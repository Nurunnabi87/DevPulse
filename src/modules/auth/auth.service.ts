import bcrypt from "bcrypt";
import { StatusCodes } from "http-status-codes";
import jwt, { SignOptions } from "jsonwebtoken";
import config from "../../config";
import pool from "../../config/db";
import AppError from "../../utils/AppError";
import { IUser, TSafeUser } from "../user/user.interface";
import {
  IJwtPayload,
  ILoginPayload,
  ILoginResult,
  ISignupPayload,
} from "./auth.interface";

const signup = async (payload: ISignupPayload): Promise<TSafeUser> => {
  const { name, email, password, role } = payload;

  // Friendly duplicate check (the DB UNIQUE constraint is the safety net)
  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
    email,
  ]);
  if (existing.rows.length > 0) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "A user with this email already exists"
    );
  }

  const hashedPassword = await bcrypt.hash(password, config.bcryptSaltRounds);

  // RETURNING deliberately excludes the password column
  const result = await pool.query<TSafeUser>(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, COALESCE($4, 'contributor'))
     RETURNING id, name, email, role, created_at, updated_at`,
    [name, email, hashedPassword, role ?? null]
  );

  return result.rows[0];
};

const login = async (payload: ILoginPayload): Promise<ILoginResult> => {
  const { email, password } = payload;

  const result = await pool.query<IUser>(
    `SELECT id, name, email, password, role, created_at, updated_at
     FROM users WHERE email = $1`,
    [email]
  );
  const user = result.rows[0];

  // Same message for unknown email and wrong password,
  // so attackers cannot probe which emails are registered
  if (!user) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
  }

  const jwtPayload: IJwtPayload = {
    id: user.id,
    name: user.name,
    role: user.role,
  };
  const signOptions: SignOptions = {
    expiresIn: config.jwtExpiresIn as SignOptions["expiresIn"],
  };
  const token = jwt.sign(jwtPayload, config.jwtSecret, signOptions);

  const safeUser: TSafeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };

  return { token, user: safeUser };
};

export const AuthService = { signup, login };
