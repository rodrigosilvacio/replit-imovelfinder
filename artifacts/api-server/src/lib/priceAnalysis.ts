import { db, imoveisTable } from "@workspace/db";
import { eq, and, avg, sql } from "drizzle-orm";
import { logger } from "./logger";

/**
 * Recalcula a média por região/bairro e atualiza os flags abaixoDaMedia
 * para todos os imóveis do mesmo bairro e tipo.
 */
export async function recalcularMedias(): Promise<void> {
  logger.info("Recalculando médias por região");

  try {
    // Busca médias agrupadas por cidade, bairro e tipo
    const medias = await db
      .select({
        cidade: imoveisTable.cidade,
        bairro: imoveisTable.bairro,
        tipo: imoveisTable.tipo,
        media: avg(imoveisTable.preco),
      })
      .from(imoveisTable)
      .groupBy(imoveisTable.cidade, imoveisTable.bairro, imoveisTable.tipo);

    for (const { cidade, bairro, tipo, media } of medias) {
      if (!media) continue;
      const mediaNum = parseFloat(String(media));

      // Busca todos os imóveis dessa região
      const imoveis = await db
        .select({ id: imoveisTable.id, preco: imoveisTable.preco })
        .from(imoveisTable)
        .where(
          and(
            cidade ? eq(imoveisTable.cidade, cidade) : sql`${imoveisTable.cidade} IS NULL`,
            bairro ? eq(imoveisTable.bairro, bairro) : sql`${imoveisTable.bairro} IS NULL`,
            eq(imoveisTable.tipo, tipo)
          )
        );

      for (const imovel of imoveis) {
        const preco = parseFloat(String(imovel.preco));
        const abaixo = preco < mediaNum * 0.9; // 10% abaixo da média
        const percentual = abaixo ? ((mediaNum - preco) / mediaNum) * 100 : null;

        await db
          .update(imoveisTable)
          .set({
            abaixoDaMedia: abaixo,
            percentualAbaixoMedia: percentual ? String(percentual.toFixed(2)) : null,
            mediaRegiao: String(mediaNum.toFixed(2)),
          })
          .where(eq(imoveisTable.id, imovel.id));
      }
    }

    logger.info("Médias recalculadas com sucesso");
  } catch (err) {
    logger.error({ err }, "Erro ao recalcular médias");
  }
}
