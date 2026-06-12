import { Response } from "express";

interface ISendResponseOptions<T> {
  statusCode: number;
  message: string;
  data?: T;
}

interface ISuccessBody<T> {
  success: true;
  message: string;
  data?: T;
}

/**
 * Formats every success response with the standard envelope:
 * { success: true, message, data }
 * `data` is omitted entirely when not provided (e.g. DELETE responses).
 */
const sendResponse = <T>(
  res: Response,
  { statusCode, message, data }: ISendResponseOptions<T>
): void => {
  const body: ISuccessBody<T> = { success: true, message };
  if (data !== undefined) {
    body.data = data;
  }
  res.status(statusCode).json(body);
};

export default sendResponse;
