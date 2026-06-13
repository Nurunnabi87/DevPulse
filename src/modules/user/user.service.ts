import pool from "../../config/db";
import { IReporter } from "./user.interface";

/**
 * Batch-fetch reporter info for a set of user ids in a single query.
 * Returns a Map keyed by user id so callers can stitch reporter data
 * into issues without using a SQL JOIN (forbidden by the spec).
 */
const getReportersByIds = async (
  ids: number[]
): Promise<Map<number, IReporter>> => {
  const reporterMap = new Map<number, IReporter>();
  if (ids.length === 0) {
    return reporterMap;
  }

  const result = await pool.query<IReporter>(
    `SELECT id, name, role FROM users WHERE id = ANY($1::int[])`,
    [ids]
  );

  for (const reporter of result.rows) {
    reporterMap.set(reporter.id, reporter);
  }
  return reporterMap;
};

export const UserService = { getReportersByIds };
