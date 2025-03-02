const dotenv = require('dotenv');
const envFile = process.env.NODE_ENV
	? `./.env.${process.env.NODE_ENV}`
	: './.env';

dotenv.config({ path: envFile });
console.log(`Loaded environment: ${envFile}`);

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const spotifyRoutes = require('./modules/spotify/routes/spotify.Route');
const preSaveRoutes = require('./modules/presave/routes/presave.Route');
const insightsRoutes = require('./modules/insights/routes/insights.Route');
const { converterQueue } = require('./services/converterQueue');
const { taskQueue } = require('./services/taskQueue');

const app = express();
const port = process.env.PORT || 8000;

app.use(cookieParser());
app.use(express.json());
app.use(
	cors({
		origin: 'http://localhost:3000', // Adjust this to your frontend's URL (e.g., React app running on port 3001)
		methods: ['GET', 'POST', 'PUT', 'DELETE'],
		allowedHeaders: ['Content-Type', 'Authorization'],
	})
);

app.use('/presave', preSaveRoutes); //presaves from artist
app.use('/spotify', spotifyRoutes); //This is where all spotify information is
app.use('/insights', insightsRoutes); //This is where all insights information is

// Add Bull Board route to the app
// app.use('/admin/queues', router);
// const rt = '01/18/2025, 14:08';
// const tz = 'Africa/Lagos';
// const type = 'local';
// const typeLocal = 'local';
// const typeGlobal = 'global';

// let userInLocal;
// if (type == 'global') {
// 	userInLocal = moment.tz(rt, 'MM/DD/YYYY, HH:mm', tz);
// } else {
// 	userInLocal = moment.utc(rt, 'MM/DD/YYYY, HH:mm');
// }
// const userInUTC = userInLocal;
// const nowInUTC = moment().utc();

// const delay = userInUTC.diff(nowInUTC);
// console.log(delay);
// const seconds = delay / 1000; // 1234.567 seconds

// // Convert seconds to minutes
// const minutes = seconds / 60; // 20.5761 minutes
// console.log(`Milliseconds: ${delay}`);
// console.log(`Seconds: ${seconds.toFixed(2)}`); // Rounded to 2 decimal places
// console.log(`Minutes: ${minutes.toFixed(2)}`);

// if (converterQueue.isReady) {
// 	converterQueue.empty();
// 	console.log('converter queue is ready');
// }
// if (taskQueue.isReady) {
// 	taskQueue.empty();
// 	console.log('task queue is ready');
// }

// Start the server
app.listen(port, () => {
	console.log(`App is running at http://localhost:${port}`);
});
