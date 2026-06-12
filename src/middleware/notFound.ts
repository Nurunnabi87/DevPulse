import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

/** Catch-all for requests that match no registered route. */
const notFound = (req: Request, res: Response): void => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: "Route not found",
    errors: `No handler for ${req.method} ${req.originalUrl}`,
  });
};

export default notFound;
