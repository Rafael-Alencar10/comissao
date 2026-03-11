import { decimal, integer, pgEnum, pgTable, text, timestamp, varchar, json, date } from "drizzle-orm/pg-core";

// --- 1. Definição dos ENUMs (Obrigatório para Postgres no Drizzle) ---
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const statusCredEnum = pgEnum("status_cred", ["ativo", "inativo"]);
export const turnoEnum = pgEnum("turno", ["A", "B", "C"]);
export const tipoAtuacaoEnum = pgEnum("tipo_atuacao", ["Chat", "Ligacao", "Ambos"]);
export const statusAtendenteEnum = pgEnum("status_atendente", ["Ativo", "Inativo"]);
export const tipoAtendimentoEnum = pgEnum("tipo_atendimento", ["chat", "ligacao"]);
export const tipoNotificacaoEnum = pgEnum("tipo_notificacao", ["desempenho_baixo", "elegibilidade_alterada", "meta_atingida", "alerta_geral"]);

// --- 2. Definição das Tabelas ---

export const users = pgTable("users", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(), // Usando a função do Enum definida acima
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const userCredentials = pgTable("userCredentials", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  role: roleEnum("role").default("user").notNull(),
  status: statusCredEnum("status").default("ativo").notNull(),
  permissions: text("permissions"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const atendentes = pgTable("atendentes", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  turno: turnoEnum("turno").notNull(),
  tipoAtuacao: tipoAtuacaoEnum("tipoAtuacao").notNull(),
  status: statusAtendenteEnum("status").default("Ativo").notNull(),
  tolerancia: decimal("tolerancia", { precision: 5, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const producaoMensal = pgTable("producaoMensal", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  atendenteId: integer("atendenteId").notNull(),
  mes: integer("mes").notNull(),
  ano: integer("ano").notNull(),
  chatTotal: integer("chatTotal").notNull().default(0),
  chatNota5: integer("chatNota5").notNull().default(0),
  chatNota4: integer("chatNota4").notNull().default(0),
  chatNota3: integer("chatNota3").notNull().default(0),
  chatNota2: integer("chatNota2").notNull().default(0),
  chatNota1: integer("chatNota1").notNull().default(0),
  chatSemNota: integer("chatSemNota").notNull().default(0),
  ligacaoTotal: integer("ligacaoTotal").notNull().default(0),
  ligacaoExtrementeSatisfeito: integer("ligacaoExtrementeSatisfeito").notNull().default(0),
  ligacaoExcelente: integer("ligacaoExcelente").notNull().default(0),
  ligacaoBom: integer("ligacaoBom").notNull().default(0),
  ligacaoRegular: integer("ligacaoRegular").notNull().default(0),
  ligacaoRuim: integer("ligacaoRuim").notNull().default(0),
  ligacaoPessimo: integer("ligacaoPessimo").notNull().default(0),
  pontosChat: decimal("pontosChat", { precision: 10, scale: 2 }).notNull().default("0"),
  pontosLigacao: decimal("pontosLigacao", { precision: 10, scale: 2 }).notNull().default("0"),
  pontosTotais: decimal("pontosTotais", { precision: 10, scale: 2 }).notNull().default("0"),
  maxPontosChat: decimal("maxPontosChat", { precision: 10, scale: 2 }).notNull().default("0"),
  maxPontosLigacao: decimal("maxPontosLigacao", { precision: 10, scale: 2 }).notNull().default("0"),
  maxPontosTotais: decimal("maxPontosTotais", { precision: 10, scale: 2 }).notNull().default("0"),
  atendimentosTotais: integer("atendimentosTotais").notNull().default(0),
  performance: decimal("performance", { precision: 5, scale: 2 }).notNull().default("0"),
  bonificacao: decimal("bonificacao", { precision: 10, scale: 2 }).notNull().default("0"),
  elegivel: integer("elegivel").notNull().default(0),
  motivoNaoElegivel: text("motivoNaoElegivel"),
  semanas: json("semanas"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const atendimentosDetalhados = pgTable("atendimentosDetalhados", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  producaoMensalId: integer("producaoMensalId").notNull(),
  atendenteId: integer("atendenteId").notNull(),
  mes: integer("mes").notNull(),
  ano: integer("ano").notNull(),
  dataAtendimento: date("dataAtendimento"),
  nomeCliente: varchar("nomeCliente", { length: 255 }),
  tipo: tipoAtendimentoEnum("tipo").notNull(),
  nota: integer("nota"),
  auditoria: text("auditoria"),
  massiva: integer("massiva").notNull().default(0),
  retirarNota: integer("retirarNota").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const notificacoes = pgTable("notificacoes", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  atendenteId: integer("atendenteId").notNull(),
  tipo: tipoNotificacaoEnum("tipo").notNull(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  mensagem: text("mensagem").notNull(),
  mes: integer("mes"),
  ano: integer("ano"),
  lida: integer("lida").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});