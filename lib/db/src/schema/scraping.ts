import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const scrapingStatusTable = pgTable("scraping_status", {
  id: serial("id").primaryKey(),
  rodando: boolean("rodando").notNull().default(false),
  fonteAtual: text("fonte_atual"),
  imoveisColetados: integer("imoveis_coletados").notNull().default(0),
  erros: integer("erros").notNull().default(0),
  mensagem: text("mensagem").notNull().default(""),
  iniciadoEm: timestamp("iniciado_em", { withTimezone: true }),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
});

export type ScrapingStatusRow = typeof scrapingStatusTable.$inferSelect;
