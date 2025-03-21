const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');

const dotenv = require( 'dotenv');

// Import the school router as default
const schoolRouter = require( './routers/school.router.js'); // Ensure this path is correct

dotenv.config(); // Load environment variables

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());

// MONGODB CONNECTION
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB is connected successfully.');
  })
  .catch((e) => {
    console.log('MongoDB error:', e);
  });

// Test route for health check
app.get('/test', (req, res) => {
  res.send({ id: 1, message: 'Welcome' });
});

// Use the school router
app.use('/app/school', schoolRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('Server is running at PORT =>', PORT);
});
