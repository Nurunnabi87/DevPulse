import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { IJwtPayload } from "../auth/auth.interface";
import AppError from "../../utils/AppError";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { IssueService } from "./issue.service";
import { validateCreateIssue } from "./issue.validation";

/** req.user is optional on the Request type; protected routes must have it. */
const requireUser = (req: Request): IJwtPayload => {
  if (!req.user) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Authentication required");
  }
  return req.user;
};

const createIssue = catchAsync(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const payload = validateCreateIssue(req.body);
  const issue = await IssueService.createIssue(payload, user.id);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    message: "Issue created successfully",
    data: issue,
  });
});

export const IssueController = { createIssue };
