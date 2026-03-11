import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./db/schema";
import {
  InsertUser, users, atendentes, Atendente, InsertAtendente,
  producaoMensal, ProducaoMensal, InsertProducaoMensal,
  notificacoes, Notificacao, InsertNotificacao,
  userCredentials, UserCredential, InsertUserCredential,
  atendimentosDetalhados, AtendimentoDetalhado, InsertAtendimentoDetalhado
} from "./db/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let _client: postgres.Sql | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _client = postgres(process.env.DATABASE_URL);
      _db = drizzle(_client, { schema });
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
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

  try {
    const values: any = {
      openId: user.openId,
    };
    const updateSet: Record<string, any> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    textFields.forEach((field) => {
      if (user[field] !== undefined) {
        values[field] = user[field];
        updateSet[field] = user[field];
      }
    });

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }

    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    // Postgres syntax: onConflictDoUpdate
    await db.insert(users)
      .values(values)
      .onConflictDoUpdate({
        target: users.openId,
        set: updateSet,
      });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Atendente queries
export async function getAtendentes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(atendentes).orderBy(atendentes.nome);
}

export async function getAtendenteById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(atendentes).where(eq(atendentes.id, id)).limit(1);
  return result[0];
}

export async function createAtendente(data: InsertAtendente) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(atendentes).values(data).returning();
}

export async function updateAtendente(id: number, data: Partial<InsertAtendente>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(atendentes).set(data).where(eq(atendentes.id, id));
}

export async function deleteAtendente(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(atendentes).where(eq(atendentes.id, id));
}

export async function getAtendentesByTurno(turno: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(atendentes).where(eq(atendentes.turno, turno as any)).orderBy(atendentes.nome);
}

export async function getAtendentesByStatus(status: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(atendentes).where(eq(atendentes.status, status as any)).orderBy(atendentes.nome);
}

// ProducaoMensal queries
export async function getProducaoMensalByAtendente(atendenteId: number, mes: number, ano: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(producaoMensal)
    .where(
      and(
        eq(producaoMensal.atendenteId, atendenteId),
        eq(producaoMensal.mes, mes),
        eq(producaoMensal.ano, ano)
      )
    )
    .limit(1);
  return result[0];
}

export async function getProducaoMensalByMesAno(mes: number, ano: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(producaoMensal)
    .where(and(eq(producaoMensal.mes, mes), eq(producaoMensal.ano, ano)))
    .orderBy(producaoMensal.atendenteId);
}

export async function getAllProducaoMensalByAtendente(atendenteId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(producaoMensal)
    .where(eq(producaoMensal.atendenteId, atendenteId))
    .orderBy(desc(producaoMensal.ano), desc(producaoMensal.mes));
}

export async function createProducaoMensal(data: InsertProducaoMensal) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(producaoMensal).values(data).returning();
}

export async function updateProducaoMensal(id: number, data: Partial<InsertProducaoMensal>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(producaoMensal).set(data).where(eq(producaoMensal.id, id));
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

// Notificacao queries
export async function createNotificacao(data: InsertNotificacao) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(notificacoes).values(data).returning();
}

export async function getNotificacoesByAtendente(atendenteId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(notificacoes)
    .where(eq(notificacoes.atendenteId, atendenteId))
    .orderBy(desc(notificacoes.createdAt))
    .limit(limit);
}

export async function getNotificacoesNaoLidas(atendenteId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(notificacoes)
    .where(and(eq(notificacoes.atendenteId, atendenteId), eq(notificacoes.lida, 0)))
    .orderBy(desc(notificacoes.createdAt));
}

export async function marcarNotificacaoComoLida(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(notificacoes).set({ lida: 1 }).where(eq(notificacoes.id, id));
}

export async function getNotificacoesRecentes(mes: number, ano: number, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(notificacoes)
    .where(and(eq(notificacoes.mes, mes), eq(notificacoes.ano, ano)))
    .orderBy(desc(notificacoes.createdAt))
    .limit(limit);
}

export async function deleteProducaoMensal(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(producaoMensal).where(eq(producaoMensal.id, id));
}

// Atendimento Detalhado queries
export async function createAtendimentoDetalhado(data: InsertAtendimentoDetalhado) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(atendimentosDetalhados).values(data).returning();
}

export async function createAtendimentosDetalhados(dataList: InsertAtendimentoDetalhado[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (dataList.length === 0) return [];
  return db.insert(atendimentosDetalhados).values(dataList).returning();
}

export async function getAtendimentosDetalhados(producaoMensalId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(atendimentosDetalhados)
    .where(eq(atendimentosDetalhados.producaoMensalId, producaoMensalId))
    .orderBy(atendimentosDetalhados.dataAtendimento);
}

export async function deleteAtendimentosDetalhados(producaoMensalId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(atendimentosDetalhados).where(eq(atendimentosDetalhados.id, producaoMensalId)); // Nota: Ajuste conforme sua PK
}

// User Credentials queries
export async function getUserCredentialByUsername(username: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(userCredentials)
    .where(eq(userCredentials.username, username))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getAllUserCredentials() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userCredentials).orderBy(userCredentials.username);
}

export async function createUserCredential(data: InsertUserCredential) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(userCredentials).values(data).returning();
}

export async function updateUserCredential(id: number, data: Partial<InsertUserCredential>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(userCredentials).set(data).where(eq(userCredentials.id, id));
}

export async function deleteUserCredential(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(userCredentials).where(eq(userCredentials.id, id));
}