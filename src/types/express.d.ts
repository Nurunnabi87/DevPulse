import { IJwtPayload } from "../modules/auth/auth.interface";

declare global {
  namespace Express {
    interface Request {
      /** Decoded JWT payload, set by the auth middleware. */
      user?: IJwtPayload;
    }
  }
}

export {};
