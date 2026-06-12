import { IReporter } from "../user/user.interface";

export type TIssueType = "bug" | "feature_request";
export type TIssueStatus = "open" | "in_progress" | "resolved";

/** Full database row. */
export interface IIssue {
  id: number;
  title: string;
  description: string;
  type: TIssueType;
  status: TIssueStatus;
  reporter_id: number;
  created_at: Date;
  updated_at: Date;
}

/** Issue shape for GET responses: reporter object replaces reporter_id. */
export interface IIssueWithReporter extends Omit<IIssue, "reporter_id"> {
  reporter: IReporter;
}

export interface ICreateIssuePayload {
  title: string;
  description: string;
  type: TIssueType;
}

export interface IUpdateIssuePayload {
  title?: string;
  description?: string;
  type?: TIssueType;
  status?: TIssueStatus;
}

export interface IIssueQueryParams {
  sort: "newest" | "oldest";
  type?: TIssueType;
  status?: TIssueStatus;
}

export const ISSUE_TYPES: TIssueType[] = ["bug", "feature_request"];
export const ISSUE_STATUSES: TIssueStatus[] = [
  "open",
  "in_progress",
  "resolved",
];
