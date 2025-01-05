const { taskQueue } = require('./taskQueue'); // Your Bull queue instance

// Monitor job events for the taskQueue
const monitorQueue = () => {
    // Monitor job completion
    taskQueue.on('completed', (job, result) => {
        console.log(`Job ${job.id} completed successfully:`, result); // You can log the result or other details
    });

    // Monitor job failure
    taskQueue.on('failed', (job, error) => {
        console.error(`Job ${job.id} failed with error: ${error.message}`); // Error message when job fails
    });

    // Monitor stalled jobs (jobs that are no longer being processed)
    taskQueue.on('stalled', (job) => {
        console.warn(`Job ${job.id} stalled. It might need attention.`); // When a job is stalled (e.g., worker issue)
    });

    // Monitor when a job is active (actively being processed)
    taskQueue.on('active', (job) => {
        console.log(`Job ${job.id} is now active and processing.`); // When the job starts processing
    });

    // Monitor when a job is removed from the queue
    taskQueue.on('removed', (job) => {
        console.log(`Job ${job.id} has been removed.`); // When a job is manually removed or completed
    });
};

// Start monitoring the queue
monitorQueue();

module.exports = { monitorQueue };
