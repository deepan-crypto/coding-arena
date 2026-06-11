const { ApiError } = require('../utils/ApiError');

function notFoundHandler(req, res, next) {
  next(new ApiError(404, 'Route not found'));
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const payload = {
    message: err.message || 'Internal Server Error'
  };

  if (err.details?.length) {
    payload.details = err.details;
  }

  if (process.env.NODE_ENV !== 'production') {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
}

module.exports = { notFoundHandler, errorHandler };
