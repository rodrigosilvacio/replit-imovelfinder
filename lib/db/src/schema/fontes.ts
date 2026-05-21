import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const fontesTable = pgTable("fontes", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  url: text("url").notNull(),
  descricao: text("descricao"),
  ativa: boolean("ativa").notNull().default(true),
  ultimoScraping: timestamp("ultimo_scraping", { withTimezone: true }),
  totalImoveisColetados: integer("total_imoveis_coletados").notNull().default(0),
  criadaEm: timestamp("criada_em", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFonteSchema = createInsertSchema(fontesTable).omit({
  id: true,
  criadaEm: true,
  ultimoScraping: true,
  totalImoveisColetados: true,
});
export type InsertFonte = z.infer<typeof insertFonteSchema>;
export type Fonte = typeof fontesTable.$inferSelect;
