export type TUserRole = "contributor" | "maintainer";

/** Full database row, including the hashed password. Internal use only. */
export interface IUser {
  id: number;
  name: string;
  email: string;
  password: string;
  role: TUserRole;
  created_at: Date;
  updated_at: Date;
}

/** User shape that is safe to send in responses (no password). */
export type TSafeUser = Omit<IUser, "password">;

/** Compact reporter info embedded in issue responses. */
export interface IReporter {
  id: number;
  name: string;
  role: TUserRole;
}

export const USER_ROLES: TUserRole[] = ["contributor", "maintainer"];
