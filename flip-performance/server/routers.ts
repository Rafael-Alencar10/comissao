import { systemRouter } from "./_core/systemRouter";
import { router } from "./_core/trpc";
import { exportRouter } from "./routers/export";
import { notificacoesRouter } from "./routers/notificacoes";
import { atendentesRouter } from "./routers/atendentes";
import { producaoRouter } from "./routers/producao";
import { authRouter } from "./routers/auth";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  export: exportRouter,
  notificacoes: notificacoesRouter,
  auth: authRouter,
  atendentes: atendentesRouter,
  producao: producaoRouter,
});

export type AppRouter = typeof appRouter;
