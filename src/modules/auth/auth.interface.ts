import { TSafeUser, TUserRole } from "../user/user.interface";

export interface ISignupPayload {
  name: string;
  email: string;
  password: string;
  role?: TUserRole;
}

export interface ILoginPayload {
  email: string;
  password: string;
}

export interface ILoginResult {
  token: string;
  user: TSafeUser;
}

/** Claims embedded in the JWT (per spec hint: id, name, role). */
export interface IJwtPayload {
  id: number;
  name: string;
  role: TUserRole;
}
