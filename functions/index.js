const {onSchedule}=require("firebase-functions/v2/scheduler");
const {runPickupReminders}=require("./pickup-reminder-runner");

exports.sendPickupReminders=onSchedule(
  {
    schedule:"every 1 minutes",
    timeZone:"Africa/Gaborone",
    memory:"256MiB",
    timeoutSeconds:60
  },
  runPickupReminders
);
