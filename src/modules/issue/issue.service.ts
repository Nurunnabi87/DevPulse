import { StatusCodes } from "http-status-codes";
import pool from "../../config/db";
import AppError from "../../utils/AppError";
import { ICreateIssuePayload, IIssue } from "./issue.interface";

const createIssue = async (
  payload: ICreateIssuePayload,
  reporterId: number
): Promise<IIssue> => {
  // No FK on reporter_id by design — the spec requires this check
  // to live in application logic instead.
  const reporter = await pool.query("SELECT id FROM users WHERE id = $1", [
    reporterId,
  ]);
  if (reporter.rows.length === 0) {
    throw new AppError(StatusCodes.NOT_FOUND, "Reporter account not found");
  }

  const result = await pool.query<IIssue>(
    `INSERT INTO issues (title, description, type, reporter_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id, title, description, type, status, reporter_id, created_at, updated_at`,
    [payload.title, payload.description, payload.type, reporterId]
  );

  return result.rows[0];
};

export const IssueService = { createIssue };
