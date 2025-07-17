const express = require("express");
const app = express();

// Middleware
app.use(express.json());

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Express on Vercel",
    path: req.path,
    url: req.url,
    timestamp: new Date().toISOString()
  });
});

// Health route
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Health check passed",
    timestamp: new Date().toISOString()
  });
});

// Test POST route
app.post("/test", (req, res) => {
  res.json({
    message: "POST request received",
    body: req.body,
    timestamp: new Date().toISOString()
  });
});

// Catch all
app.all("*", (req, res) => {
  res.status(404).json({
    error: "Not found",
    path: req.path,
    method: req.method
  });
});

// Export the Express app
module.exports = app;