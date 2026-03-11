import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
// point at Postgres version when using Supabase
import * as db from "../db-pg";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "../../shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { signAuthSession } from "../_core/sessionCookie";

const loginSchema = z.object({
  username: z.string().min(1, "Usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

const createUserSchema = z.object({
  username: z.string().min(3, "Usuário deve ter no mínimo 3 caracteres"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  role: z.enum(["user", "admin"]).default("user"),
  permissions: z.array(z.string()).optional(),
});

const updateUserSchema = z.object({
  id: z.number(),
  username: z.string().optional(),
  password: z.string().optional(),
  role: z.enum(["user", "admin"]).optional(),
  status: z.enum(["ativo", "inativo"]).optional(),
  permissions: z.array(z.string()).optional(),
});

export const authRouter = router({
  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input, ctx }) => {
      const user = await db.getUserCredentialByUsername(input.username);

      if (!user || user.status !== "ativo") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário ou senha inválidos",
        });
      }

      const passwordMatch = await bcrypt.compare(input.password, user.passwordHash);

      if (!passwordMatch) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário ou senha inválidos",
        });
      }

      const authPayload = {
        id: user.id,
        username: user.username,
        role: user.role,
        permissions: user.permissions ? JSON.parse(user.permissions) : [],
      };

      const cookieValue = await signAuthSession(authPayload);
      const cookieOptions = {
        ...getSessionCookieOptions(ctx.req),
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      };
      ctx.res.cookie(COOKIE_NAME, cookieValue, cookieOptions);

      return {
        id: user.id,
        username: user.username,
        role: user.role,
        permissions: user.permissions ? JSON.parse(user.permissions) : [],
      };
    }),

  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      return null;
    }

    // Ensure we return a consistent user type
    return {
      id: ctx.user.id,
      username: "username" in ctx.user ? ctx.user.username : ctx.user.openId,
      role: ctx.user.role,
      permissions:
        "permissions" in ctx.user
          ? ctx.user.permissions
          : [],
    };
  }),

  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    // This would typically come from session/token
    // For now, returning auth context
    return ctx.user || null;
  }),

  createUser: protectedProcedure
    .input(createUserSchema)
    .mutation(async ({ input, ctx }) => {
      // Only admins can create users
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem criar usuários",
        });
      }

      // Check if username already exists
      const existing = await db.getUserCredentialByUsername(input.username);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Este usuário já existe",
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(input.password, 10);

      // Create user
      const result = await db.createUserCredential({
        username: input.username,
        passwordHash,
        role: input.role,
        status: "ativo",
        permissions: input.permissions ? JSON.stringify(input.permissions) : null,
      });

      return {
        success: true,
        message: "Usuário criado com sucesso",
      };
    }),

  listUsers: protectedProcedure.query(async ({ ctx }) => {
    // Only admins can list users
    if (ctx.user?.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Apenas administradores podem listar usuários",
      });
    }

    const users = await db.getAllUserCredentials();
    // Don't return passwords
    return users.map((u) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      status: u.status,
      permissions: u.permissions ? JSON.parse(u.permissions) : [],
      createdAt: u.createdAt,
    }));
  }),

  updateUser: protectedProcedure
    .input(updateUserSchema)
    .mutation(async ({ input, ctx }) => {
      // Only admins can update users
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem atualizar usuários",
        });
      }

      const updateData: any = {};

      if (input.username !== undefined) {
        // Check if new username already exists
        const existing = await db.getUserCredentialByUsername(input.username);
        if (existing && existing.id !== input.id) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Este usuário já existe",
          });
        }
        updateData.username = input.username;
      }

      if (input.password !== undefined) {
        updateData.passwordHash = await bcrypt.hash(input.password, 10);
      }

      if (input.role !== undefined) {
        updateData.role = input.role;
      }

      if (input.status !== undefined) {
        updateData.status = input.status;
      }

      if (input.permissions !== undefined) {
        updateData.permissions = JSON.stringify(input.permissions);
      }

      await db.updateUserCredential(input.id, updateData);

      return {
        success: true,
        message: "Usuário atualizado com sucesso",
      };
    }),

  deleteUser: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Only admins can delete users
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem deletar usuários",
        });
      }

      await db.deleteUserCredential(input.id);

      return {
        success: true,
        message: "Usuário deletado com sucesso",
      };
    }),

  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return {
      success: true,
    };
  }),
});
