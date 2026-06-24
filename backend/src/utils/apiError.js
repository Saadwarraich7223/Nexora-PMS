// Custom error with HTTP status and optional metadata for API responses.
class ApiError extends Error {
  constructor(statusCode, message, meta) {
    super(message);
    ((this.statusCode = statusCode), (this.meta = meta));
  }
}

export default ApiError;
