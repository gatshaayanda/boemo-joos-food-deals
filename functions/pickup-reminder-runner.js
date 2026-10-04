const {initializeApp,getApps}=require("firebase-admin/app");
const {getFirestore}=require("firebase-admin/firestore");
const {getMessaging}=require("firebase-admin/messaging");

if(!getApps().length)initializeApp();

const db=getFirestore();
const messaging=getMessaging();
const WINDOW_MS=6*60*1000;
const LOOKAHEAD_MS=65*60*1000;
const TERMINAL_STATUSES=new Set(["Cancelled","Collected","Delivered"]);
const INVALID_TOKEN_CODES=new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token"
]);

async function tokensFor(uid){
  const snapshot=await db.collection("notificationTokens").doc(uid).collection("tokens").get();
  return snapshot.docs
    .map(doc=>({id:doc.id,ref:doc.ref,...doc.data()}))
    .filter(item=>typeof item.token==="string"&&item.token);
}

async function sendToUser(uid,message){
  const tokens=await tokensFor(uid);
  if(!tokens.length)return {sent:false,reason:"no-token"};

  const response=await messaging.sendEachForMulticast({
    ...message,
    tokens:tokens.map(item=>item.token)
  });

  await Promise.all(response.responses.map((result,index)=>{
    if(result.success||!INVALID_TOKEN_CODES.has(result.error?.code))return Promise.resolve();
    return tokens[index].ref.delete();
  }));

  return {
    sent:response.successCount>0,
    successCount:response.successCount,
    failureCount:response.failureCount
  };
}

async function alreadySent(jobId){
  return (await db.collection("notificationDeliveries").doc(jobId).get()).exists;
}

async function markSent(jobId,data){
  await db.collection("notificationDeliveries").doc(jobId).set({
    ...data,
    sentAt:new Date().toISOString()
  });
}

async function remindUser(uid,leadMinutes,order,admin){
  const jobId=order.id+"_"+uid+"_"+leadMinutes;
  if(await alreadySent(jobId))return {sent:false,reason:"already-sent"};

  const scheduled=new Date(order.scheduledFor);
  const timeText=new Intl.DateTimeFormat("en-GB",{
    timeStyle:"short",
    timeZone:"Africa/Gaborone"
  }).format(scheduled);
  const items=(Array.isArray(order.items)?order.items:[])
    .map(item=>item.quantity+"× "+item.name)
    .join(" · ");
  const title=admin?"BOEMO pickup reminder":"Your BOEMO pickup is coming up";
  const body=admin
    ?"Pickup in "+leadMinutes+" minutes · "+order.customerName+" · "+items+" · "+timeText
    :"Your BOEMO pickup is in "+leadMinutes+" minutes at "+timeText+". "+items;
  const link=admin?"/admin":"/orders/"+order.id;
  const publicUrl=process.env.BOEMO_PUBLIC_URL||"https://boemo-joos-food-deals.vercel.app";

  const result=await sendToUser(uid,{
    notification:{title,body},
    data:{link,orderId:order.id},
    webpush:{
      fcmOptions:{link:publicUrl+link},
      notification:{
        tag:"boemo-pickup-"+order.id,
        icon:"/icon.svg",
        badge:"/icon.svg"
      }
    }
  });

  if(result.sent){
    await markSent(jobId,{
      orderId:order.id,
      recipientUid:uid,
      leadMinutes,
      admin
    });
  }

  return result;
}

async function runPickupReminders(){
  const now=Date.now();
  const lower=new Date(now).toISOString();
  const upper=new Date(now+LOOKAHEAD_MS).toISOString();

  const [ordersSnapshot,adminsSnapshot]=await Promise.all([
    // Query only by time so the free GitHub Actions runner does not depend
    // on a composite Firestore index; filter pickup orders in application code.
    db.collection("orders")
      .where("scheduledFor",">=",lower)
      .where("scheduledFor","<=",upper)
      .get(),
    db.collection("admins").get()
  ]);

  if(ordersSnapshot.empty){
    return {orders:0,reminders:0,sent:0};
  }

  const adminUids=adminsSnapshot.docs.map(doc=>doc.id);
  const adminPrefs=new Map();
  await Promise.all(adminUids.map(async uid=>{
    const pref=(await db.collection("notificationPreferences").doc(uid).get()).data();
    if(pref?.enabled){
      adminPrefs.set(uid,Number(pref.leadMinutes)||15);
    }
  }));

  let reminders=0;
  let sent=0;

  for(const orderDoc of ordersSnapshot.docs){
    const order={id:orderDoc.id,...orderDoc.data()};
    if(order.mode!=="pickup")continue;
    if(TERMINAL_STATUSES.has(order.status))continue;

    const scheduledAt=new Date(order.scheduledFor).getTime();
    if(!Number.isFinite(scheduledAt))continue;

    const recipients=[];
    if(typeof order.customerId==="string"){
      const pref=(await db.collection("notificationPreferences").doc(order.customerId).get()).data();
      if(pref?.enabled){
        const lead=Number(pref.leadMinutes)||15;
        const reminderAt=scheduledAt-lead*60*1000;
        if(Math.abs(reminderAt-now)<=WINDOW_MS){
          recipients.push({uid:order.customerId,lead,admin:false});
        }
      }
    }

    for(const [uid,lead] of adminPrefs){
      const reminderAt=scheduledAt-lead*60*1000;
      if(Math.abs(reminderAt-now)<=WINDOW_MS){
        recipients.push({uid,lead,admin:true});
      }
    }

    for(const recipient of recipients){
      reminders++;
      const result=await remindUser(
        recipient.uid,
        recipient.lead,
        order,
        recipient.admin
      );
      if(result.sent)sent++;
    }
  }

  return {orders:ordersSnapshot.size,reminders,sent};
}

module.exports={runPickupReminders};

if(require.main===module){
  runPickupReminders()
    .then(summary=>console.log("BOEMO pickup reminders:",JSON.stringify(summary)))
    .catch(error=>{
      console.error("BOEMO pickup reminders failed:",error);
      process.exitCode=1;
    });
}
