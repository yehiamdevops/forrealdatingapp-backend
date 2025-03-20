const http = require('http');
const express = require('express');
const cors = require('cors');
const connectToDB = require('./db/mongoConnect.js');
const Routes = require('./routes/config_routes.js');
const { EXPRESS_PORT } = require('./secret/secretConf.js');
require("./server.js");

// Initialize Express app
const app = express();

// Middleware
// app.use(express.static(path.join(__dirname, "public")));
app.use(express.static('public'));
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON request bodies

// Serve static files (if needed)

// Connect to MongoDB
connectToDB();

// Register routes
Routes(app);

// Create HTTP server
const server = http.createServer(app);

// Start the server
server.listen(EXPRESS_PORT, ()=>{
  console.log(`express server up on port ${EXPRESS_PORT}`);
  
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
