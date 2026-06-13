import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { IJwtPayload } from "../auth/auth.interface";
import AppError from "../../utils/AppError";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { IssueService } from "./issue.service";
import {
  parseIssueQuery,
  validateCreateIssue,
  validateUpdateIssue,
} from "./issue.validation";

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

const getAllIssues = catchAsync(async (req: Request, res: Response) => {
  const query = parseIssueQuery(req.query as Record<string, unknown>);
  const issues = await IssueService.getAllIssues(query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: "Issues retrived successfully",
    data: issues,
  });
});

const getSingleIssue = catchAsync(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid issue id");
  }
  const issue = await IssueService.getSingleIssue(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: "Issue retrived successfully",
    data: issue,
  });
});

const updateIssue = catchAsync(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid issue id");
  }
  const payload = validateUpdateIssue(req.body);
  const issue = await IssueService.updateIssue(id, payload, user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: "Issue updated successfully",
    data: issue,
  });
});

export const IssueController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
};
