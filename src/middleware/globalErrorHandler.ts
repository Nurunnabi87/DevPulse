import { ErrorRequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import AppError from "../utils/AppError";

interface IPgError {
  code: string;
  detail?: string;
  constraint?: string;
}

const isPgError = (err: unknown): err is IPgError => {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code: unknown }).code === "string"
  );
};

/**
 * Centralized error handler: every next(err) in the app lands here.
 * Express identifies it as an error handler by its 4-argument signature.
 */
const globalErrorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = "Something went wrong";
  let errors: unknown = null;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err instanceof TokenExpiredError) {
    statusCode = StatusCodes.UNAUTHORIZED;
    message = "Token has expired";
  } else if (err instanceof JsonWebTokenError) {
    statusCode = StatusCodes.UNAUTHORIZED;
    message = "Invalid token";
  } else if (isPgError(err)) {
    // Translate common PostgreSQL constraint violations
    if (err.code === "23505") {
      statusCode = StatusCodes.BAD_REQUEST;
      message = "Duplicate value violates a unique constraint";
      errors = err.detail ?? null;
    } else if (err.code === "23514") {
      statusCode = StatusCodes.BAD_REQUEST;
      message = "Value violates a database check constraint";
      errors = err.detail ?? err.constraint ?? null;
    }
  } else if (err instanceof Error) {
    message = err.message;
  }

  // Log for debugging; request bodies (which may contain passwords) are never logged
  console.error(`[ERROR] ${statusCode} - ${message}`);

  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

export default globalErrorHandler;
