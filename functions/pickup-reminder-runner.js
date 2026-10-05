require("../src/lib/server/pickup-reminder-runner.js");
const runner=require("../src/lib/server/pickup-reminder-runner.js");
module.exports=runner;

if(require.main===module){
  runner.runPickupReminders()
    .then(summary=>console.log("BOEMO pickup reminders:",JSON.stringify(summary)))
    .catch(error=>{console.error("BOEMO pickup reminders failed:",error);process.exitCode=1;});
}
