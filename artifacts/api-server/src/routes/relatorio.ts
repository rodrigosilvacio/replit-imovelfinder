import { Router, type IRouter } from "express";
import { db, imoveisTable, fontesTable } from "@workspace/db";
import { eq, and, asc, sql, desc } from "drizzle-orm";
import { GerarRelatorioQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/relatorio", async (req, res): Promise<void> => {
  const parsed = GerarRelatorioQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { tipo, cidade, limite = 20 } = parsed.data;

  const conditions = [];
  if (tipo && tipo !== "todos") {
    conditions.push(eq(imoveisTable.tipo, tipo));
  }
  if (cidade) {
    conditions.push(sql`lower(${imoveisTable.cidade}) like lower(${"%" + cidade + "%"})`);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [statsResult, imoveis] = await Promise.all([
    db.select({
      totalAnalisados: sql<number>`count(*)::int`,
      mediaGeralCompra: sql<string | null>`avg(case when ${imoveisTable.tipo} = 'compra' then ${imoveisTable.preco}::numeric end)`,
      mediaGeralAluguel: sql<string | null>`avg(case when ${imoveisTable.tipo} = 'aluguel' then ${imoveisTable.preco}::numeric end)`,
    }).from(imoveisTable).where(whereClause),

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
      fonteNome: fontesTable.nome,
      favorito: imoveisTable.favorito,
      abaixoDaMedia: imoveisTable.abaixoDaMedia,
      percentualAbaixoMedia: imoveisTable.percentualAbaixoMedia,
      mediaRegiao: imoveisTable.mediaRegiao,
      coletadoEm: imoveisTable.coletadoEm,
    })
      .from(imoveisTable)
      .leftJoin(fontesTable, eq(imoveisTable.fonteId, fontesTable.id))
      .where(whereClause)
      .orderBy(
        desc(imoveisTable.abaixoDaMedia),
        desc(imoveisTable.percentualAbaixoMedia),
        asc(imoveisTable.preco)
      )
      .limit(limite),
  ]);

  const stats = statsResult[0];

  const melhoresOportunidades = imoveis.map((imovel) => {
    const percentual = imovel.percentualAbaixoMedia ? parseFloat(String(imovel.percentualAbaixoMedia)) : 0;
    let pontuacao = 0;
    const motivos: string[] = [];

    if (imovel.abaixoDaMedia) {
      pontuacao += percentual * 2;
      motivos.push(`${percentual.toFixed(1)}% abaixo da média da região`);
    }

    if (imovel.favorito) {
      pontuacao += 10;
      motivos.push("Marcado como favorito");
    }

    if (imovel.precoM2) {
      const precoM2 = parseFloat(String(imovel.precoM2));
      if (precoM2 < 5000) {
        pontuacao += 15;
        motivos.push(`Preço/m² atrativo (R$ ${precoM2.toFixed(0)}/m²)`);
      }
    }

    if (imovel.quartos && imovel.quartos >= 2) {
      pontuacao += 5;
    }

    if (motivos.length === 0) {
      motivos.push("Menor preço absoluto da seleção");
    }

    return {
      imovel,
      pontuacao: Math.round(pontuacao * 10) / 10,
      motivo: motivos.join("; "),
    };
  });

  melhoresOportunidades.sort((a, b) => b.pontuacao - a.pontuacao);

  res.json({
    geradoEm: new Date().toISOString(),
    totalAnalisados: stats?.totalAnalisados ?? 0,
    mediaGeralCompra: stats?.mediaGeralCompra ? parseFloat(stats.mediaGeralCompra) : null,
    mediaGeralAluguel: stats?.mediaGeralAluguel ? parseFloat(stats.mediaGeralAluguel) : null,
    melhoresOportunidades,
  });
});

export default router;
