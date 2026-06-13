import { StatusCodes } from "http-status-codes";
import pool from "../../config/db";
import AppError from "../../utils/AppError";
import { IReporter } from "../user/user.interface";
import { UserService } from "../user/user.service";
import {
  ICreateIssuePayload,
  IIssue,
  IIssueQueryParams,
  IIssueWithReporter,
} from "./issue.interface";

/** Swap reporter_id for an embedded reporter object (no JOIN used). */
const attachReporter = (
  issue: IIssue,
  reporter: IReporter
): IIssueWithReporter => {
  const { reporter_id, ...rest } = issue;
  void reporter_id; // intentionally dropped from the response shape
  return { ...rest, reporter };
};

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

const getAllIssues = async (
  query: IIssueQueryParams
): Promise<IIssueWithReporter[]> => {
  // Build parameterized WHERE clauses for optional filters
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (query.type) {
    values.push(query.type);
    conditions.push(`type = $${values.length}`);
  }
  if (query.status) {
    values.push(query.status);
    conditions.push(`status = $${values.length}`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const orderDirection = query.sort === "oldest" ? "ASC" : "DESC";

  const result = await pool.query<IIssue>(
    `SELECT id, title, description, type, status, reporter_id, created_at, updated_at
     FROM issues
     ${whereClause}
     ORDER BY created_at ${orderDirection}`,
    values
  );

  // Batch-fetch all reporters in one query, then stitch in memory
  const reporterIds = [...new Set(result.rows.map((row) => row.reporter_id))];
  const reporterMap = await UserService.getReportersByIds(reporterIds);

  return result.rows
    .map((issue) => {
      const reporter = reporterMap.get(issue.reporter_id);
      // Skip orphaned issues whose reporter no longer exists
      return reporter ? attachReporter(issue, reporter) : null;
    })
    .filter((issue): issue is IIssueWithReporter => issue !== null);
};

const getSingleIssue = async (id: number): Promise<IIssueWithReporter> => {
  const result = await pool.query<IIssue>(
    `SELECT id, title, description, type, status, reporter_id, created_at, updated_at
     FROM issues WHERE id = $1`,
    [id]
  );
  const issue = result.rows[0];
  if (!issue) {
    throw new AppError(StatusCodes.NOT_FOUND, "Issue not found");
  }

  const reporterMap = await UserService.getReportersByIds([issue.reporter_id]);
  const reporter = reporterMap.get(issue.reporter_id);
  if (!reporter) {
    throw new AppError(StatusCodes.NOT_FOUND, "Reporter account not found");
  }

  return attachReporter(issue, reporter);
};

export const IssueService = { createIssue, getAllIssues, getSingleIssue };
