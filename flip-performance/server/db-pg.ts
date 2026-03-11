import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertUser, users, atendentes, Atendente, InsertAtendente, producaoMensal, ProducaoMensal, InsertProducaoMensal, notificacoes, Notificacao, InsertNotificacao, userCredentials, UserCredential, InsertUserCredential, atendimentosDetalhados, AtendimentoDetalhado, InsertAtendimentoDetalhado } from "./db/schema";

let _db: ReturnType<typeof drizzle> | null = null;
let _client: postgres.Sql | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _client = postgres(process.env.DATABASE_URL);
      _db = drizzle(_client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// Close the database connection
export async function closeDb() {
  if (_client) {
    await _client.end();
    _client = null;
    _db = null;
  }
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  await db
    .insert(users)
    .values(user)
    .onConflictDoUpdate({
      target: users.openId,
      set: {
        name: user.name,
        email: user.email,
        loginMethod: user.loginMethod,
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
    });
}

export async function getUserByOpenId(openId: string): Promise<typeof users.$inferSelect | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0] || null;
}

export async function getUserById(id: number): Promise<typeof users.$inferSelect | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] || null;
}

export async function getAllUsers(): Promise<typeof users.$inferSelect[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(users);
}

export async function getUserCredentialsByUsername(username: string): Promise<typeof userCredentials.$inferSelect | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(userCredentials).where(eq(userCredentials.username, username)).limit(1);
  return result[0] || null;
}

export async function getUserCredentialByUsername(username: string): Promise<typeof userCredentials.$inferSelect | null> {
  return getUserCredentialsByUsername(username);
}

export async function createUserCredentials(credentials: InsertUserCredential): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create user credentials: database not available");
    return;
  }

  await db.insert(userCredentials).values(credentials);
}

export async function createUserCredential(credentials: InsertUserCredential): Promise<void> {
  return createUserCredentials(credentials);
}

export async function updateUserCredentials(id: number, updates: Partial<InsertUserCredential>): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update user credentials: database not available");
    return;
  }

  await db.update(userCredentials).set(updates).where(eq(userCredentials.id, id));
}

export async function updateUserCredential(id: number, updates: Partial<InsertUserCredential>): Promise<void> {
  return updateUserCredentials(id, updates);
}

export async function deleteUserCredential(id: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete user credential: database not available");
    return;
  }

  await db.delete(userCredentials).where(eq(userCredentials.id, id));
}

export async function getAllUserCredentials(): Promise<UserCredential[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(userCredentials).orderBy(userCredentials.username);
}

export async function getAllAtendentes(): Promise<Atendente[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(atendentes).orderBy(atendentes.nome);
}

export async function getAtendenteById(id: number): Promise<Atendente | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(atendentes).where(eq(atendentes.id, id)).limit(1);
  return result[0] || null;
}

export async function createAtendente(atendente: InsertAtendente): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(atendentes).values(atendente).returning({ id: atendentes.id });
  return result[0].id;
}

export async function updateAtendente(id: number, updates: Partial<InsertAtendente>): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update atendente: database not available");
    return;
  }

  await db.update(atendentes).set(updates).where(eq(atendentes.id, id));
}

export async function deleteAtendente(id: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete atendente: database not available");
    return;
  }

  await db.delete(atendentes).where(eq(atendentes.id, id));
}

// alias for convenience; routers expect `db.getAtendentes`
export const getAtendentes = getAllAtendentes;

export async function getAtendentesByTurno(turno: string): Promise<Atendente[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(atendentes).where(eq(atendentes.turno, turno as any)).orderBy(atendentes.nome);
}

export async function getAtendentesByStatus(status: string): Promise<Atendente[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(atendentes).where(eq(atendentes.status, status as any)).orderBy(atendentes.nome);
}

export async function getProducaoMensal(atendenteId: number, mes: number, ano: number): Promise<ProducaoMensal | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(producaoMensal)
    .where(and(eq(producaoMensal.atendenteId, atendenteId), eq(producaoMensal.mes, mes), eq(producaoMensal.ano, ano)))
    .limit(1);
  return result[0] || null;
}

export async function getProducaoMensalByMesAno(mes: number, ano: number): Promise<ProducaoMensal[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(producaoMensal)
    .where(and(eq(producaoMensal.mes, mes), eq(producaoMensal.ano, ano)))
    .orderBy(producaoMensal.atendenteId);
}

export async function getAllProducaoMensalByAtendente(atendenteId: number): Promise<ProducaoMensal[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(producaoMensal)
    .where(eq(producaoMensal.atendenteId, atendenteId))
    .orderBy(desc(producaoMensal.ano), desc(producaoMensal.mes));
}

export async function getProducaoMensalByTurnoMesAno(turno: string, mes: number, ano: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: producaoMensal.id,
      atendenteId: producaoMensal.atendenteId,
      mes: producaoMensal.mes,
      ano: producaoMensal.ano,
      chatTotal: producaoMensal.chatTotal,
      chatNota5: producaoMensal.chatNota5,
      chatNota4: producaoMensal.chatNota4,
      chatNota3: producaoMensal.chatNota3,
      chatNota2: producaoMensal.chatNota2,
      chatNota1: producaoMensal.chatNota1,
      ligacaoTotal: producaoMensal.ligacaoTotal,
      ligacaoExtrementeSatisfeito: producaoMensal.ligacaoExtrementeSatisfeito,
      ligacaoExcelente: producaoMensal.ligacaoExcelente,
      ligacaoBom: producaoMensal.ligacaoBom,
      ligacaoRegular: producaoMensal.ligacaoRegular,
      ligacaoRuim: producaoMensal.ligacaoRuim,
      ligacaoPessimo: producaoMensal.ligacaoPessimo,
      pontosChat: producaoMensal.pontosChat,
      pontosLigacao: producaoMensal.pontosLigacao,
      pontosTotais: producaoMensal.pontosTotais,
      atendimentosTotais: producaoMensal.atendimentosTotais,
      performance: producaoMensal.performance,
      bonificacao: producaoMensal.bonificacao,
      elegivel: producaoMensal.elegivel,
      motivoNaoElegivel: producaoMensal.motivoNaoElegivel,
      createdAt: producaoMensal.createdAt,
      updatedAt: producaoMensal.updatedAt,
      atendenteName: atendentes.nome,
      atendenteTurno: atendentes.turno,
    })
    .from(producaoMensal)
    .innerJoin(atendentes, eq(producaoMensal.atendenteId, atendentes.id))
    .where(
      and(
        eq(atendentes.turno, turno as any),
        eq(producaoMensal.mes, mes),
        eq(producaoMensal.ano, ano)
      )
    )
    .orderBy(atendentes.nome);
}

export async function upsertProducaoMensal(producao: InsertProducaoMensal): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert producao mensal: database not available");
    return;
  }

  await db
    .insert(producaoMensal)
    .values(producao)
    .onConflictDoUpdate({
      target: [producaoMensal.atendenteId, producaoMensal.mes, producaoMensal.ano],
      set: producao,
    });
}

export async function createProducaoMensal(producao: InsertProducaoMensal): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create producao mensal: database not available");
    return;
  }

  await db.insert(producaoMensal).values(producao);
}

export async function getAllProducaoMensal(): Promise<ProducaoMensal[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(producaoMensal).orderBy(desc(producaoMensal.ano), desc(producaoMensal.mes));
}

export async function getProducaoMensalByAtendente(atendenteId: number, mes: number, ano: number): Promise<ProducaoMensal | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const results = await db
    .select()
    .from(producaoMensal)
    .where(and(eq(producaoMensal.atendenteId, atendenteId), eq(producaoMensal.mes, mes), eq(producaoMensal.ano, ano)))
    .orderBy(desc(producaoMensal.ano), desc(producaoMensal.mes));

  return results.length > 0 ? results[0] : undefined;
}

export async function updateProducaoMensal(id: number, data: Partial<ProducaoMensal>): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update producao mensal: database not available");
    return;
  }

  await db.update(producaoMensal).set(data).where(eq(producaoMensal.id, id));
}

export async function deleteProducaoMensal(id: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete producao mensal: database not available");
    return;
  }

  await db.delete(producaoMensal).where(eq(producaoMensal.id, id));
}

export async function getAtendimentosDetalhados(producaoMensalId: number): Promise<AtendimentoDetalhado[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(atendimentosDetalhados)
    .where(eq(atendimentosDetalhados.producaoMensalId, producaoMensalId))
    .orderBy(atendimentosDetalhados.dataAtendimento);
}

export async function createAtendimentosDetalhados(atendimentos: InsertAtendimentoDetalhado[]): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create atendimentos detalhados: database not available");
    return;
  }

  if (atendimentos.length > 0) {
    await db.insert(atendimentosDetalhados).values(atendimentos);
  }
}

export async function updateAtendimentosDetalhados(updates: { id: number; data: Partial<InsertAtendimentoDetalhado> }[]): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update atendimentos detalhados: database not available");
    return;
  }

  for (const update of updates) {
    await db.update(atendimentosDetalhados).set(update.data).where(eq(atendimentosDetalhados.id, update.id));
  }
}

export async function deleteAtendimentosDetalhados(producaoMensalId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete atendimentos detalhados: database not available");
    return;
  }

  await db.delete(atendimentosDetalhados).where(eq(atendimentosDetalhados.producaoMensalId, producaoMensalId));
}

export async function getNotificacoesByAtendente(atendenteId: number, limit?: number): Promise<Notificacao[]> {
  const db = await getDb();
  if (!db) return [];

  const baseQuery = db
    .select()
    .from(notificacoes)
    .where(eq(notificacoes.atendenteId, atendenteId))
    .orderBy(desc(notificacoes.createdAt));

  if (limit) {
    return await baseQuery.limit(limit);
  }

  return await baseQuery;
}

export async function createNotificacao(notificacao: InsertNotificacao): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create notificacao: database not available");
    return;
  }

  await db.insert(notificacoes).values(notificacao);
}

export async function markNotificacaoAsRead(id: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot mark notificacao as read: database not available");
    return;
  }

  await db.update(notificacoes).set({ lida: 1 }).where(eq(notificacoes.id, id));
}

export async function marcarNotificacaoComoLida(id: number): Promise<void> {
  return markNotificacaoAsRead(id);
}

export async function getNotificacoesNaoLidas(atendenteId: number): Promise<Notificacao[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(notificacoes)
    .where(and(eq(notificacoes.atendenteId, atendenteId), eq(notificacoes.lida, 0)))
    .orderBy(desc(notificacoes.createdAt));
}

export async function getNotificacoesRecentes(mes: number, ano: number, limit: number = 20): Promise<Notificacao[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(notificacoes)
    .where(and(eq(notificacoes.mes, mes), eq(notificacoes.ano, ano)))
    .orderBy(desc(notificacoes.createdAt))
    .limit(limit);
}