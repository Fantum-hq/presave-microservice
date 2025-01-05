const moment = require("moment-timezone");
const { taskQueue } = require("./taskQueue");

// Function to schedule a task for a user
const scheduleTask = ({ userReleaseTime, userId, songLink, accessToken, timeZone, libraryId }) => {
    // Convert the release date to the user's time zone and get the cron time format
    const userTime = moment.tz(userReleaseTime, timeZone);

    // Calculate the delay (in milliseconds) until the user release time
    const delay = userTime.diff(moment());

    // Add the job to the queue with a delay
    taskQueue.add(
        { userId, songLink, accessToken, libraryId },
        { delay } // Delay the job execution to the user's release time
    );

    console.log(`Task scheduled for user ${userId} at ${userTime.format()} (${timeZone}).`);
};
  
module.exports = { scheduleTask };
