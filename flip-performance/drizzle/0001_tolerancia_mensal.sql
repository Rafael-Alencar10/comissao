-- Tabela para tolerância por atendente por mês (aplica somente ao mês vigente)
-- Quando tolerância > 5%, justificativa é obrigatória na aba Performance
CREATE TABLE IF NOT EXISTS "toleranciaMensal" (
	"id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY NOT NULL,
	"atendenteId" integer NOT NULL,
	"mes" integer NOT NULL,
	"ano" integer NOT NULL,
	"tolerancia" numeric(5, 2) DEFAULT '0' NOT NULL,
	"justificativaToleranciaAlta" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

-- Índice único: um registro por atendente por mês/ano
CREATE UNIQUE INDEX IF NOT EXISTS "toleranciaMensal_atendenteId_mes_ano_unique" ON "toleranciaMensal" ("atendenteId","mes","ano");
