import { StatusCodes } from "http-status-codes";
import AppError from "../../utils/AppError";
import { USER_ROLES } from "../user/user.interface";
import { ILoginPayload, ISignupPayload } from "./auth.interface";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

export const validateSignup = (body: unknown): ISignupPayload => {
  const errors: string[] = [];
  const input = (body ?? {}) as Record<string, unknown>;
  const { name, email, password, role } = input;

  if (!isNonEmptyString(name)) {
    errors.push("name is required and must be a non-empty string");
  }
  if (!isNonEmptyString(email)) {
    errors.push("email is required and must be a non-empty string");
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.push("email must be a valid email address");
  }
  if (!isNonEmptyString(password)) {
    errors.push("password is required and must be a non-empty string");
  }
  if (role !== undefined && !USER_ROLES.includes(role as never)) {
    errors.push("role must be either 'contributor' or 'maintainer'");
  }

  if (errors.length > 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Validation failed", errors);
  }

  return {
    name: (name as string).trim(),
    email: (email as string).trim().toLowerCase(),
    password: password as string,
    role: role as ISignupPayload["role"],
  };
};

export const validateLogin = (body: unknown): ILoginPayload => {
  const errors: string[] = [];
  const input = (body ?? {}) as Record<string, unknown>;
  const { email, password } = input;

  if (!isNonEmptyString(email)) {
    errors.push("email is required");
  }
  if (!isNonEmptyString(password)) {
    errors.push("password is required");
  }

  if (errors.length > 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Validation failed", errors);
  }

  return {
    email: (email as string).trim().toLowerCase(),
    password: password as string,
  };
};
