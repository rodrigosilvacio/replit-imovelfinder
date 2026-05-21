import { pgTable, text, serial, timestamp, boolean, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const imoveisTable = pgTable("imoveis", {
  id: serial("id").primaryKey(),
  titulo: text("titulo").notNull(),
  descricao: text("descricao"),
  preco: numeric("preco", { precision: 14, scale: 2 }).notNull(),
  precoM2: numeric("preco_m2", { precision: 10, scale: 2 }),
  tipo: text("tipo").notNull(), // compra | aluguel
  cidade: text("cidade"),
  bairro: text("bairro"),
  endereco: text("endereco"),
  quartos: integer("quartos"),
  banheiros: integer("banheiros"),
  area: numeric("area", { precision: 10, scale: 2 }),
  vagas: integer("vagas"),
  imagemUrl: text("imagem_url"),
  urlOriginal: text("url_original").notNull(),
  fonteId: integer("fonte_id").notNull(),
  favorito: boolean("favorito").notNull().default(false),
  abaixoDaMedia: boolean("abaixo_da_media").notNull().default(false),
  percentualAbaixoMedia: numeric("percentual_abaixo_media", { precision: 6, scale: 2 }),
  mediaRegiao: numeric("media_regiao", { precision: 14, scale: 2 }),
  coletadoEm: timestamp("coletado_em", { withTimezone: true }).notNull().defaultNow(),
});

export const insertImovelSchema = createInsertSchema(imoveisTable).omit({
  id: true,
  coletadoEm: true,
  favorito: true,
  abaixoDaMedia: true,
});
export type InsertImovel = z.infer<typeof insertImovelSchema>;
export type Imovel = typeof imoveisTable.$inferSelect;
