import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AuthService } from "./auth.service";
import { validateLogin, validateSignup } from "./auth.validation";

const signup = catchAsync(async (req: Request, res: Response) => {
  const payload = validateSignup(req.body);
  const user = await AuthService.signup(payload);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    message: "User registered successfully",
    data: user,
  });
});

const login = catchAsync(async (req: Request, res: Response) => {
  const payload = validateLogin(req.body);
  const result = await AuthService.login(payload);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: "Login successful",
    data: result,
  });
});

export const AuthController = { signup, login };
