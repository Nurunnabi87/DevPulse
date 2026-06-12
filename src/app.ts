import cors from "cors";
import express, { Application, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import globalErrorHandler from "./middleware/globalErrorHandler";
import notFound from "./middleware/notFound";
import { AuthRoutes } from "./modules/auth/auth.route";

const app: Application = express();

// Global middleware
app.use(cors());
app.use(express.json());

// Health check / welcome route
app.get("/", (_req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({
    success: true,
    message: "DevPulse API is running",
    data: null,
  });
});

// Feature modules
app.use("/api/auth", AuthRoutes);

// Unmatched routes → 404, all errors → centralized handler (order matters:
// these must be registered after every real route)
app.use(notFound);
app.use(globalErrorHandler);

export default app;
