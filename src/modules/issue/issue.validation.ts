import { StatusCodes } from "http-status-codes";
import AppError from "../../utils/AppError";
import {
  ICreateIssuePayload,
  ISSUE_STATUSES,
  ISSUE_TYPES,
  IUpdateIssuePayload,
} from "./issue.interface";

const TITLE_MAX_LENGTH = 150;
const DESCRIPTION_MIN_LENGTH = 20;

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

const validateTitle = (title: unknown, errors: string[]): void => {
  if (!isNonEmptyString(title)) {
    errors.push("title is required and must be a non-empty string");
  } else if (title.trim().length > TITLE_MAX_LENGTH) {
    errors.push(`title must be at most ${TITLE_MAX_LENGTH} characters`);
  }
};

const validateDescription = (description: unknown, errors: string[]): void => {
  if (!isNonEmptyString(description)) {
    errors.push("description is required and must be a non-empty string");
  } else if (description.trim().length < DESCRIPTION_MIN_LENGTH) {
    errors.push(
      `description must be at least ${DESCRIPTION_MIN_LENGTH} characters`
    );
  }
};

export const validateCreateIssue = (body: unknown): ICreateIssuePayload => {
  const errors: string[] = [];
  const input = (body ?? {}) as Record<string, unknown>;
  const { title, description, type } = input;

  validateTitle(title, errors);
  validateDescription(description, errors);
  if (!ISSUE_TYPES.includes(type as never)) {
    errors.push("type must be either 'bug' or 'feature_request'");
  }

  if (errors.length > 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Validation failed", errors);
  }

  return {
    title: (title as string).trim(),
    description: (description as string).trim(),
    type: type as ICreateIssuePayload["type"],
  };
};

export const validateUpdateIssue = (body: unknown): IUpdateIssuePayload => {
  const errors: string[] = [];
  const input = (body ?? {}) as Record<string, unknown>;
  const { title, description, type, status } = input;
  const payload: IUpdateIssuePayload = {};

  if (title !== undefined) {
    validateTitle(title, errors);
    payload.title = isNonEmptyString(title) ? title.trim() : undefined;
  }
  if (description !== undefined) {
    validateDescription(description, errors);
    payload.description = isNonEmptyString(description)
      ? description.trim()
      : undefined;
  }
  if (type !== undefined) {
    if (!ISSUE_TYPES.includes(type as never)) {
      errors.push("type must be either 'bug' or 'feature_request'");
    } else {
      payload.type = type as IUpdateIssuePayload["type"];
    }
  }
  if (status !== undefined) {
    if (!ISSUE_STATUSES.includes(status as never)) {
      errors.push("status must be one of 'open', 'in_progress', 'resolved'");
    } else {
      payload.status = status as IUpdateIssuePayload["status"];
    }
  }

  if (Object.keys(payload).length === 0 && errors.length === 0) {
    errors.push(
      "at least one field (title, description, type, status) must be provided"
    );
  }

  if (errors.length > 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Validation failed", errors);
  }

  return payload;
};
