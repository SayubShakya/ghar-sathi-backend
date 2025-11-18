const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  
  // Default to 500 if status code not set
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Something went wrong';
  
  res.status(statusCode).json({
    success: false,
    error: message
  });
};

module.exports = errorHandler;