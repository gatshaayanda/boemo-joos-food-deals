const {onSchedule}=require("firebase-functions/v2/scheduler");
const {onCall,HttpsError}=require("firebase-functions/v2/https");
const {runPickupReminders,sendTestNotification}=require("./pickup-reminder-runner");

exports.sendPickupReminders=onSchedule(
  {
    schedule:"every 1 minutes",
    timeZone:"Africa/Gaborone",
    memory:"256MiB",
    timeoutSeconds:60
  },
  runPickupReminders
);

exports.sendTestPickupNotification=onCall(
  {memory:"256MiB",timeoutSeconds:60},
  async request=>{
    if(!request.auth?.uid){
      throw new HttpsError("unauthenticated","Sign in to test BOEMO notifications.");
    }

    try{
      const result=await sendTestNotification(request.auth.uid);
      console.log("BOEMO test notification:",JSON.stringify({
        uid:request.auth.uid,
        successCount:result.successCount,
        failureCount:result.failureCount
      }));
      return {sent:true,successCount:result.successCount,failureCount:result.failureCount};
    }catch(error){
      console.error("BOEMO test notification failed:",error);
      throw new HttpsError("failed-precondition","BOEMO could not send a test notification to this device.");
    }
  }
);
