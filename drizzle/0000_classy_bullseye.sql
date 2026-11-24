CREATE TABLE "avulsos" (
	"dia_id" uuid NOT NULL,
	"jogador_id" uuid NOT NULL,
	"valor" integer NOT NULL,
	"pago_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "avulsos_dia_id_jogador_id_pk" PRIMARY KEY("dia_id","jogador_id")
);
--> statement-breakpoint
CREATE TABLE "dias_de_jogo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sala_id" uuid NOT NULL,
	"data" date NOT NULL,
	"estado" jsonb NOT NULL,
	"versao" integer DEFAULT 0 NOT NULL,
	"encerrado" boolean DEFAULT false NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "historico_estado" (
	"id" serial PRIMARY KEY NOT NULL,
	"dia_id" uuid NOT NULL,
	"estado" jsonb NOT NULL,
	"descricao" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jogadores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sala_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"posicao" text DEFAULT 'jogador' NOT NULL,
	"idoso" boolean DEFAULT false NOT NULL,
	"mensalista" boolean DEFAULT false NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mensalidades" (
	"sala_id" uuid NOT NULL,
	"jogador_id" uuid NOT NULL,
	"mes" text NOT NULL,
	"valor" integer NOT NULL,
	"pago_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mensalidades_jogador_id_mes_pk" PRIMARY KEY("jogador_id","mes")
);
--> statement-breakpoint
CREATE TABLE "salas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codigo" text NOT NULL,
	"pin_hash" text NOT NULL,
	"config" jsonb NOT NULL,
	"tentativas_falhas" integer DEFAULT 0 NOT NULL,
	"bloqueado_ate" timestamp with time zone,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "avulsos" ADD CONSTRAINT "avulsos_dia_id_dias_de_jogo_id_fk" FOREIGN KEY ("dia_id") REFERENCES "public"."dias_de_jogo"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avulsos" ADD CONSTRAINT "avulsos_jogador_id_jogadores_id_fk" FOREIGN KEY ("jogador_id") REFERENCES "public"."jogadores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dias_de_jogo" ADD CONSTRAINT "dias_de_jogo_sala_id_salas_id_fk" FOREIGN KEY ("sala_id") REFERENCES "public"."salas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historico_estado" ADD CONSTRAINT "historico_estado_dia_id_dias_de_jogo_id_fk" FOREIGN KEY ("dia_id") REFERENCES "public"."dias_de_jogo"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jogadores" ADD CONSTRAINT "jogadores_sala_id_salas_id_fk" FOREIGN KEY ("sala_id") REFERENCES "public"."salas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mensalidades" ADD CONSTRAINT "mensalidades_sala_id_salas_id_fk" FOREIGN KEY ("sala_id") REFERENCES "public"."salas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mensalidades" ADD CONSTRAINT "mensalidades_jogador_id_jogadores_id_fk" FOREIGN KEY ("jogador_id") REFERENCES "public"."jogadores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dias_sala_idx" ON "dias_de_jogo" USING btree ("sala_id","encerrado");--> statement-breakpoint
CREATE INDEX "historico_dia_idx" ON "historico_estado" USING btree ("dia_id","id");--> statement-breakpoint
CREATE INDEX "jogadores_sala_idx" ON "jogadores" USING btree ("sala_id");--> statement-breakpoint
CREATE UNIQUE INDEX "salas_codigo_idx" ON "salas" USING btree ("codigo");