CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."status_atendente" AS ENUM('Ativo', 'Inativo');--> statement-breakpoint
CREATE TYPE "public"."status_cred" AS ENUM('ativo', 'inativo');--> statement-breakpoint
CREATE TYPE "public"."tipo_atendimento" AS ENUM('chat', 'ligacao');--> statement-breakpoint
CREATE TYPE "public"."tipo_atuacao" AS ENUM('Chat', 'Ligacao', 'Ambos');--> statement-breakpoint
CREATE TYPE "public"."tipo_notificacao" AS ENUM('desempenho_baixo', 'elegibilidade_alterada', 'meta_atingida', 'alerta_geral');--> statement-breakpoint
CREATE TYPE "public"."turno" AS ENUM('A', 'B', 'C');--> statement-breakpoint
CREATE TABLE "atendentes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "atendentes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"nome" varchar(255) NOT NULL,
	"turno" "turno" NOT NULL,
	"tipoAtuacao" "tipo_atuacao" NOT NULL,
	"status" "status_atendente" DEFAULT 'Ativo' NOT NULL,
	"tolerancia" numeric(5, 2) DEFAULT '0' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "atendimentosDetalhados" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "atendimentosDetalhados_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"producaoMensalId" integer NOT NULL,
	"atendenteId" integer NOT NULL,
	"mes" integer NOT NULL,
	"ano" integer NOT NULL,
	"dataAtendimento" date,
	"nomeCliente" varchar(255),
	"tipo" "tipo_atendimento" NOT NULL,
	"nota" integer,
	"auditoria" text,
	"massiva" integer DEFAULT 0 NOT NULL,
	"retirarNota" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notificacoes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "notificacoes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"atendenteId" integer NOT NULL,
	"tipo" "tipo_notificacao" NOT NULL,
	"titulo" varchar(255) NOT NULL,
	"mensagem" text NOT NULL,
	"mes" integer,
	"ano" integer,
	"lida" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "producaoMensal" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "producaoMensal_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"atendenteId" integer NOT NULL,
	"mes" integer NOT NULL,
	"ano" integer NOT NULL,
	"chatTotal" integer DEFAULT 0 NOT NULL,
	"chatNota5" integer DEFAULT 0 NOT NULL,
	"chatNota4" integer DEFAULT 0 NOT NULL,
	"chatNota3" integer DEFAULT 0 NOT NULL,
	"chatNota2" integer DEFAULT 0 NOT NULL,
	"chatNota1" integer DEFAULT 0 NOT NULL,
	"chatSemNota" integer DEFAULT 0 NOT NULL,
	"ligacaoTotal" integer DEFAULT 0 NOT NULL,
	"ligacaoExtrementeSatisfeito" integer DEFAULT 0 NOT NULL,
	"ligacaoExcelente" integer DEFAULT 0 NOT NULL,
	"ligacaoBom" integer DEFAULT 0 NOT NULL,
	"ligacaoRegular" integer DEFAULT 0 NOT NULL,
	"ligacaoRuim" integer DEFAULT 0 NOT NULL,
	"ligacaoPessimo" integer DEFAULT 0 NOT NULL,
	"pontosChat" numeric(10, 2) DEFAULT '0' NOT NULL,
	"pontosLigacao" numeric(10, 2) DEFAULT '0' NOT NULL,
	"pontosTotais" numeric(10, 2) DEFAULT '0' NOT NULL,
	"maxPontosChat" numeric(10, 2) DEFAULT '0' NOT NULL,
	"maxPontosLigacao" numeric(10, 2) DEFAULT '0' NOT NULL,
	"maxPontosTotais" numeric(10, 2) DEFAULT '0' NOT NULL,
	"atendimentosTotais" integer DEFAULT 0 NOT NULL,
	"performance" numeric(5, 2) DEFAULT '0' NOT NULL,
	"bonificacao" numeric(10, 2) DEFAULT '0' NOT NULL,
	"elegivel" integer DEFAULT 0 NOT NULL,
	"motivoNaoElegivel" text,
	"semanas" json,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "userCredentials" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "userCredentials_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"username" varchar(255) NOT NULL,
	"passwordHash" varchar(255) NOT NULL,
	"role" "role" DEFAULT 'user' NOT NULL,
	"status" "status_cred" DEFAULT 'ativo' NOT NULL,
	"permissions" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "userCredentials_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
