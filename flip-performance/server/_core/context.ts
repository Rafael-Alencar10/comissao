import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { COOKIE_NAME } from "../../shared/const";
import { verifyAuthSession } from "./sessionCookie";

export type AuthUser = {
  id: number;
  username: string;
  role: "user" | "admin";
  permissions: string[];
};

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: (User | AuthUser) | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: (User | AuthUser) | null = null;

  const cookieValue = opts.req.cookies?.[COOKIE_NAME];
  if (cookieValue) {
    user = await verifyAuthSession(cookieValue);
  }

  if (!user) {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      // Authentication is optional for public procedures.
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
