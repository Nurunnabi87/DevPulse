/**
 * Operational error with an HTTP status code.
 * Business logic throws this; the global error handler
 * converts it into the standard error response.
 */
class AppError extends Error {
  public readonly statusCode: number;
  public readonly errors: unknown;

  constructor(statusCode: number, message: string, errors: unknown = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
