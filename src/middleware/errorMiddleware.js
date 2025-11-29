// Global error-handling middleware for Express
// This function catches errors thrown in routes/controllers and formats the response
const errorHandler = (err, req, res, next) => {
  // Log the error message to the server console for debugging
  console.error('Error:', err.message);
  
  // Default to 500 (Internal Server Error) if statusCode is not set on the error
  const statusCode = err.statusCode || 500;
  // Use the error's message if available, otherwise send a generic message
  const message = err.message || 'Something went wrong';
  
  // Send a consistent JSON error response to the client
  res.status(statusCode).json({
    success: false,
    error: message
  });
};

// Export the error handler so it can be used as the last middleware in index.js
module.exports = errorHandler;