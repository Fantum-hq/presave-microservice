require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const spotifyRoutes = require('./modules/spotify/routes/spotify.Route');
const preSaveRoutes = require('./modules/presave/routes/presave.Route');

// const { router, setQueues } = require('@bull-board/express'); // Correct import for Bull v4.x
// const { taskQueue } = require('./services/taskQueue');  // Import your taskQueue
// const { BullAdapter } = require('@bull-board/express'); // Correct import for Bull v4.x 

// Set up Bull Board to monitor the taskQueue
// setQueues([new BullAdapter(taskQueue)]);

const app = express();
const port = process.env.PORT || 8000;

app.use(cookieParser());
app.use(express.json());
app.use(cors({
    origin: '*',  // Adjust this to your frontend's URL (e.g., React app running on port 3001)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.post('/presave', preSaveRoutes); //presaves from artist
app.use('/spotify', spotifyRoutes); //This is where all spotify information is


// Add Bull Board route to the app
// app.use('/admin/queues', router);

// Start the server
app.listen(port, () => {
    console.log(`App is running at http://localhost:${port}`);
});
