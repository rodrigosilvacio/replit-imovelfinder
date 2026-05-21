import { Router, type IRouter } from "express";
import { db, imoveisTable } from "@workspace/db";
import { eq, sql, avg, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard", async (req, res): Promise<void> => {
  const [statsResult, imoveisDestaque, distribuicaoCidades, ultimaAtualizacao] = await Promise.all([
    db.select({
      totalImoveis: sql<number>`count(*)::int`,
      totalFavoritos: sql<number>`sum(case when ${imoveisTable.favorito} then 1 else 0 end)::int`,
      imoveisAbaixoMedia: sql<number>`sum(case when ${imoveisTable.abaixoDaMedia} then 1 else 0 end)::int`,
      mediaPrecoCompra: sql<string | null>`avg(case when ${imoveisTable.tipo} = 'compra' then ${imoveisTable.preco}::numeric end)`,
      mediaPrecoAluguel: sql<string | null>`avg(case when ${imoveisTable.tipo} = 'aluguel' then ${imoveisTable.preco}::numeric end)`,
    }).from(imoveisTable),

    db.select({
      id: imoveisTable.id,
      titulo: imoveisTable.titulo,
      descricao: imoveisTable.descricao,
      preco: imoveisTable.preco,
      precoM2: imoveisTable.precoM2,
      tipo: imoveisTable.tipo,
      cidade: imoveisTable.cidade,
      bairro: imoveisTable.bairro,
      endereco: imoveisTable.endereco,
      quartos: imoveisTable.quartos,
      banheiros: imoveisTable.banheiros,
      area: imoveisTable.area,
      vagas: imoveisTable.vagas,
      imagemUrl: imoveisTable.imagemUrl,
      urlOriginal: imoveisTable.urlOriginal,
      fonteId: imoveisTable.fonteId,
      fonteNome: sql<null>`null`,
      favorito: imoveisTable.favorito,
      abaixoDaMedia: imoveisTable.abaixoDaMedia,
      percentualAbaixoMedia: imoveisTable.percentualAbaixoMedia,
      mediaRegiao: imoveisTable.mediaRegiao,
      coletadoEm: imoveisTable.coletadoEm,
    })
      .from(imoveisTable)
      .where(eq(imoveisTable.abaixoDaMedia, true))
      .orderBy(desc(imoveisTable.percentualAbaixoMedia))
      .limit(6),

    db.select({
      cidade: imoveisTable.cidade,
      total: sql<number>`count(*)::int`,
    })
      .from(imoveisTable)
      .where(sql`${imoveisTable.cidade} IS NOT NULL`)
      .groupBy(imoveisTable.cidade)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(8),

    db.select({ coletadoEm: imoveisTable.coletadoEm })
      .from(imoveisTable)
      .orderBy(desc(imoveisTable.coletadoEm))
      .limit(1),
  ]);

  const stats = statsResult[0];

  res.json({
    totalImoveis: stats?.totalImoveis ?? 0,
    totalFavoritos: stats?.totalFavoritos ?? 0,
    imoveisAbaixoMedia: stats?.imoveisAbaixoMedia ?? 0,
    mediaPrecoCompra: stats?.mediaPrecoCompra ? parseFloat(stats.mediaPrecoCompra) : null,
    mediaPrecoAluguel: stats?.mediaPrecoAluguel ? parseFloat(stats.mediaPrecoAluguel) : null,
    ultimaAtualizacao: ultimaAtualizacao[0]?.coletadoEm ?? null,
    imoveisDestaque,
    distribuicaoCidades: distribuicaoCidades.map(d => ({
      cidade: d.cidade ?? "Desconhecida",
      total: d.total,
    })),
  });
});

export default router;
