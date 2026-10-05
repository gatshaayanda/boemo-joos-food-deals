import {cert,initializeApp,getApp,getApps} from "firebase-admin/app";
import {getFirestore, type DocumentReference} from "firebase-admin/firestore";
import type {MulticastMessage} from "firebase-admin/messaging";
import {getMessaging} from "firebase-admin/messaging";

if(!getApps().length){
  const raw=process.env.FIREBASE_ADMIN_KEY;
  if(raw){
    let credential;
    try{credential=cert(JSON.parse(raw));}
    catch{throw new Error("FIREBASE_ADMIN_KEY is not valid JSON.");}
    initializeApp({credential});
  }else{
    initializeApp();
  }
}

const db=getFirestore();
const messaging=getMessaging();
const CATCH_UP_WINDOW_MS=15*60*1000;
const GABORONE_OFFSET="+02:00";

type ReminderItem={quantity:unknown;name:unknown};
type ReminderOrder={id:string;scheduledFor?:unknown;status?:unknown;customerId?:unknown;customerName?:string;items?:unknown};
type NotificationToken={id:string;ref:DocumentReference;token:string};
type NotificationResult={sent:boolean;reason?:string;successCount?:number;failureCount?:number};
type Recipient={uid:string;lead:number;admin:boolean};

function parseScheduledFor(value:unknown):number{
  if(typeof value!=="string")return NaN;
  const hasOffset=/[zZ]|[+-]\d{2}:?\d{2}$/.test(value);
  const normalized=hasOffset?value:value+GABORONE_OFFSET;
  const time=Date.parse(normalized);
  return Number.isFinite(time)?time:NaN;
}

const TERMINAL_STATUSES=new Set(["Cancelled","Collected","Delivered"]);
const INVALID_TOKEN_CODES=new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token"
]);

async function tokensFor(uid:string):Promise<NotificationToken[]>{
  const snapshot=await db.collection("notificationTokens").doc(uid).collection("tokens").get();
  return snapshot.docs
    .map(doc=>({id:doc.id,ref:doc.ref,...doc.data()} as NotificationToken))
    .filter(item=>typeof item.token==="string"&&item.token);
}

async function sendToUser(uid:string,message:Omit<MulticastMessage,"tokens">):Promise<NotificationResult>{
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

async function claimDelivery(jobId:string,data:Record<string,unknown>):Promise<boolean>{
  const ref=db.collection("notificationDeliveries").doc(jobId);
  return db.runTransaction(async transaction=>{
    const snapshot=await transaction.get(ref);
    if(snapshot.exists)return false;
    transaction.create(ref,{
      ...data,
      status:"sending",
      claimedAt:new Date().toISOString()
    });
    return true;
  });
}

async function markSent(jobId:string,data:Record<string,unknown>):Promise<void>{
  await db.collection("notificationDeliveries").doc(jobId).set({
    ...data,
    status:"sent",
    sentAt:new Date().toISOString()
  },{merge:true});
}

async function releaseDelivery(jobId:string):Promise<void>{
  await db.collection("notificationDeliveries").doc(jobId).delete();
}

async function remindUser(uid:string,leadMinutes:number,order:ReminderOrder,admin:boolean):Promise<NotificationResult>{
  const jobId=order.id+"_"+uid+"_"+leadMinutes;

  const scheduledTime=parseScheduledFor(order.scheduledFor);
  if(!Number.isFinite(scheduledTime))return {sent:false,reason:"invalid-scheduled-time"};
  const scheduled=new Date(scheduledTime);
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
  const link=admin?"/admin":"/account";
  const publicUrl=process.env.BOEMO_PUBLIC_URL||"https://boemo-joos-food-deals.vercel.app";

  const deliveryData={
    orderId:order.id,
    recipientUid:uid,
    leadMinutes,
    admin
  };
  if(!await claimDelivery(jobId,deliveryData)){
    return {sent:false,reason:"already-sent-or-in-progress"};
  }

  try{
    const result=await sendToUser(uid,{
      data:{title,body,link,orderId:order.id},
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
      await markSent(jobId,deliveryData);
    }else{
      await releaseDelivery(jobId);
    }

    return result;
  }catch(error){
    await releaseDelivery(jobId).catch(()=>{});
    throw error;
  }
}

async function runPickupReminders():Promise<{orders:number;reminders:number;sent:number}>{
  const now=Date.now();
  // Do not range-query scheduledFor as a string. BOEMO has deliberately supported
  // both legacy datetime-local values and explicit +02:00/Z values, and those textual
  // representations are not safely comparable as Firestore strings. Read the small
  // pickup queue and compare the parsed instants in Gaborone/UTC time instead.
  const [ordersSnapshot,adminsSnapshot]=await Promise.all([
    db.collection("orders").where("mode","==","pickup").get(),
    db.collection("admins").get()
  ]);

  if(ordersSnapshot.empty){
    return {orders:0,reminders:0,sent:0};
  }

  const adminUids=adminsSnapshot.docs.map(doc=>doc.id);
  const adminPrefs=new Map<string,number>();
  await Promise.all(adminUids.map(async uid=>{
    const pref=(await db.collection("notificationPreferences").doc(uid).get()).data();
    if(pref?.enabled){
      adminPrefs.set(uid,Number(pref.leadMinutes)||15);
    }
  }));

  let reminders=0;
  let sent=0;

  for(const orderDoc of ordersSnapshot.docs){
    const order={id:orderDoc.id,...orderDoc.data()} as ReminderOrder;
    if(typeof order.status==="string"&&TERMINAL_STATUSES.has(order.status))continue;

    const scheduledAt=parseScheduledFor(order.scheduledFor);
    if(!Number.isFinite(scheduledAt))continue;
    // Only inspect orders that could currently have a reminder due. This keeps the
    // scan bounded even though the query intentionally avoids fragile string ranges.
    if(scheduledAt < now-CATCH_UP_WINDOW_MS || scheduledAt > now+90*60*1000)continue;

    const recipients:Recipient[]=[];
    if(typeof order.customerId==="string"){
      const pref=(await db.collection("notificationPreferences").doc(order.customerId).get()).data();
      if(pref?.enabled){
        const lead=Number(pref.leadMinutes)||15;
        const reminderAt=scheduledAt-lead*60*1000;
        if(reminderAt<=now&&now-reminderAt<=CATCH_UP_WINDOW_MS){
          recipients.push({uid:order.customerId,lead,admin:false});
        }
      }
    }

    for(const [uid,lead] of adminPrefs){
      const reminderAt=scheduledAt-lead*60*1000;
      if(reminderAt<=now&&now-reminderAt<=CATCH_UP_WINDOW_MS){
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

  const summary={orders:ordersSnapshot.size,reminders,sent};
  console.log("BOEMO pickup reminders:",JSON.stringify(summary));
  return summary;
}

async function sendTestNotification(uid:string):Promise<NotificationResult>{
  const result=await sendToUser(uid,{
    data:{title:"BOEMO test notification",body:"Push notifications are working on this device.",link:"/account",test:"true"},
    webpush:{
      fcmOptions:{link:(process.env.BOEMO_PUBLIC_URL||"https://boemo-joos-food-deals.vercel.app")+"/account"},
      notification:{tag:"boemo-test-notification",icon:"/icon.svg",badge:"/icon.svg"}
    }
  });
  if(!result.sent)throw new Error(result.reason||"no-token");
  return result;
}

export {runPickupReminders,sendTestNotification};
