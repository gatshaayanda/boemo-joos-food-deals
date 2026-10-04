const {onSchedule}=require("firebase-functions/v2/scheduler");
const {initializeApp}=require("firebase-admin/app");
const {getFirestore,FieldPath}=require("firebase-admin/firestore");
const {getMessaging}=require("firebase-admin/messaging");

initializeApp();
const db=getFirestore();
const messaging=getMessaging();
const WINDOW_MS=75*1000;
const LOOKAHEAD_MS=60*60*1000;

async function tokensFor(uid){
  const snapshot=await db.collection("notificationTokens").doc(uid).collection("tokens").get();
  return snapshot.docs.map(doc=>({id:doc.id,ref:doc.ref,...doc.data()})).filter(item=>typeof item.token==="string"&&item.token);
}

async function sendToUser(uid,message){
  const tokens=await tokensFor(uid);
  if(!tokens.length)return {sent:false,reason:"no-token"};
  const response=await messaging.sendEachForMulticast({...message,tokens:tokens.map(item=>item.token)});
  const invalidCodes=new Set(["messaging/registration-token-not-registered","messaging/invalid-registration-token"]);
  await Promise.all(response.responses.map((result,index)=>{
    if(result.success||!invalidCodes.has(result.error?.code))return Promise.resolve();
    return tokens[index].ref.delete();
  }));
  return {sent:response.successCount>0,successCount:response.successCount,failureCount:response.failureCount};
}

async function alreadySent(jobId){
  return (await db.collection("notificationDeliveries").doc(jobId).get()).exists;
}

async function markSent(jobId,data){
  await db.collection("notificationDeliveries").doc(jobId).set({...data,sentAt:new Date().toISOString()});
}

async function remindUser(uid,leadMinutes,order,admin){
  const jobId=order.id+"_"+uid+"_"+leadMinutes;
  if(await alreadySent(jobId))return;
  const scheduled=new Date(order.scheduledFor);
  const timeText=new Intl.DateTimeFormat("en-GB",{timeStyle:"short",timeZone:"Africa/Gaborone"}).format(scheduled);
  const items=order.items.map(item=>item.quantity+"× "+item.name).join(" · ");
  const title=admin?"BOEMO pickup reminder":"Your BOEMO pickup is coming up";
  const body=admin
    ?"Pickup in "+leadMinutes+" minutes · "+order.customerName+" · "+items+" · "+timeText
    :"Your BOEMO pickup is in "+leadMinutes+" minutes at "+timeText+". "+items;
  const link=admin?"/admin":"/orders/"+order.id;
  const result=await sendToUser(uid,{notification:{title,body},data:{link,orderId:order.id},webpush:{fcmOptions:{link:process.env.BOEMO_PUBLIC_URL?process.env.BOEMO_PUBLIC_URL+link:"https://boemo-joos-food-deals.vercel.app"+link},notification:{tag:"boemo-pickup-"+order.id,icon:"/icon.svg",badge:"/icon.svg"}}});
  if(result.sent)await markSent(jobId,{orderId:order.id,recipientUid:uid,leadMinutes,admin});
}

exports.sendPickupReminders=onSchedule({schedule:"every 1 minutes",timeZone:"Africa/Gaborone",memory:"256MiB",timeoutSeconds:60},async()=>{
  const now=Date.now();
  const lower=new Date(now).toISOString();
  const upper=new Date(now+LOOKAHEAD_MS).toISOString();
  const ordersSnapshot=await db.collection("orders").where("mode","==","pickup").where("scheduledFor",">=",lower).where("scheduledFor","<=",upper).get();
  if(ordersSnapshot.empty)return;
  const adminsSnapshot=await db.collection("admins").get();
  const adminUids=adminsSnapshot.docs.map(doc=>doc.id);
  for(const orderDoc of ordersSnapshot.docs){
    const order={id:orderDoc.id,...orderDoc.data()};
    if(["Cancelled","Collected","Delivered"].includes(order.status))continue;
    const recipients=[];
    if(typeof order.customerId==="string"){
      const pref=(await db.collection("notificationPreferences").doc(order.customerId).get()).data();
      if(pref?.enabled){
        const lead=Number(pref.leadMinutes)||15;
        const reminderAt=new Date(order.scheduledFor).getTime()-lead*60*1000;
        if(Math.abs(reminderAt-now)<=WINDOW_MS)recipients.push({uid:order.customerId,lead,admin:false});
      }
    }
    for(const uid of adminUids){
      const pref=(await db.collection("notificationPreferences").doc(uid).get()).data();
      if(!pref?.enabled)continue;
      const lead=Number(pref.leadMinutes)||15;
      const reminderAt=new Date(order.scheduledFor).getTime()-lead*60*1000;
      if(Math.abs(reminderAt-now)<=WINDOW_MS)recipients.push({uid,lead,admin:true});
    }
    for(const recipient of recipients)await remindUser(recipient.uid,recipient.lead,order,recipient.admin);
  }
});
