import { RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import config from "../config";
import { IJwtPayload } from "../modules/auth/auth.interface";
import { TUserRole } from "../modules/user/user.interface";
import AppError from "../utils/AppError";
import catchAsync from "../utils/catchAsync";

/**
 * Verifies the JWT from the Authorization header and attaches the
 * decoded payload to req.user.
 *
 * Usage:
 *   auth()                 → any authenticated user
 *   auth("maintainer")     → only the listed role(s)
 *
 * The spec sends the raw token in the Authorization header; a
 * "Bearer " prefix is also tolerated.
 */
const auth = (...allowedRoles: TUserRole[]): RequestHandler => {
  return catchAsync(async (req, _res, next) => {
    const header = req.headers.authorization;
    if (!header) {
      throw new AppError(
        StatusCodes.UNAUTHORIZED,
        "Authorization token is missing"
      );
    }

    const token = header.startsWith("Bearer ") ? header.slice(7) : header;

    // Throws TokenExpiredError / JsonWebTokenError on bad tokens;
    // the global error handler converts those to 401 responses.
    const decoded = jwt.verify(token, config.jwtSecret) as IJwtPayload;

    if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "You do not have permission to perform this action"
      );
    }

    req.user = decoded;
    next();
  });
};

export default auth;
