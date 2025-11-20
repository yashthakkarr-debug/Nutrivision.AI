import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/database.js';
import foodAnalysisRoutes from './routes/foodAnalysis.js';
import chatbotRoutes from './routes/chatbot.js';
import authRoutes from './routes/auth.js';
import mealRoutes from './routes/meals.js';
import oauthRoutes from './routes/oauth.js';

dotenv.config();

// Verify environment variables
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === 'your-secret-key') {
  console.warn('⚠️  WARNING: JWT_SECRET not set or using default. Please set JWT_SECRET in .env file.');
} else {
  console.log('✅ JWT_SECRET loaded');
}

// Check Clarifai API Key
const CLARIFAI_API_KEY = process.env.CLARIFAI_API_KEY || process.env.CLARIFAI_KEY;
if (!CLARIFAI_API_KEY) {
  console.warn('⚠️  WARNING: CLARIFAI_API_KEY not set. Food analysis will not work. Please set CLARIFAI_API_KEY in .env file.');
} else {
  console.log('✅ CLARIFAI_API_KEY loaded');
  console.log('🔑 Clarifai API Key:', CLARIFAI_API_KEY.substring(0, 10) + '...' + CLARIFAI_API_KEY.substring(CLARIFAI_API_KEY.length - 4));
}

const app = express();
// Ensure PORT is a valid number
const PORT = Number(process.env.PORT) || 5001; // Changed to 5001 as 5000 might be in use

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/food-analysis', foodAnalysisRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/auth', oauthRoutes); // OAuth routes (Google, Apple)
app.use('/api/meals', mealRoutes);

// Health check with database status
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ 
    status: 'OK', 
    message: 'NutriVision API is running',
    database: dbStatus
  });
});

// Start server with error handling
const startServer = async (port) => {
  // Connect to MongoDB first
  console.log('🔄 Attempting to connect to MongoDB...');
  try {
    const dbConnection = await connectDB();
    if (dbConnection) {
      console.log('✅ Database connection established successfully');
    } else {
      console.warn('⚠️  Database connection failed, server will continue with in-memory storage');
      console.warn('💡 To enable database persistence:');
      console.warn('   1. Make sure MongoDB is running locally, OR');
      console.warn('   2. Set MONGODB_URI in .env file for MongoDB Atlas');
    }
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.warn('⚠️  Server will continue without database (using in-memory storage)');
  }

  // Ensure port is a number and within valid range
  const portNumber = Number(port);
  
  if (isNaN(portNumber) || portNumber < 0 || portNumber >= 65536) {
    console.error(`❌ Invalid port number: ${port}. Port must be between 0 and 65535.`);
    console.error(`💡 Using default port 5001...`);
    startServer(5001);
    return;
  }
  
  const server = app.listen(portNumber, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${portNumber}`);
    console.log(`📡 API available at http://0.0.0.0:${portNumber}/api`);
    if (mongoose.connection.readyState === 1) {
      console.log(`💾 Database: Connected to ${mongoose.connection.name}`);
    } else {
      console.log(`💾 Database: Using in-memory storage`);
    }
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE' || error.code === 'EACCES') {
      console.error(`❌ Port ${portNumber} is already in use or permission denied.`);
      
      // Try next port (max 5 attempts to avoid infinite loop)
      const nextPort = portNumber + 1;
      if (nextPort < 65536 && nextPort < portNumber + 10) {
        console.error(`💡 Trying alternative port ${nextPort}...`);
        startServer(nextPort);
      } else {
        console.error(`❌ Could not find available port. Please free up port ${portNumber} or use a different port.`);
        console.error(`💡 You can set PORT environment variable: PORT=5002 node server.js`);
        process.exit(1);
      }
    } else {
      console.error('❌ Server error:', error);
      process.exit(1);
    }
  });
};

startServer(PORT);

