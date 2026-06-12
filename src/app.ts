import cors from "cors";
import express, { Application, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

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

export default app;
