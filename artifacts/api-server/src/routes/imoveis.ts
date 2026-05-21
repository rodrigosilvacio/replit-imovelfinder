import { Router, type IRouter } from "express";
import { eq, and, gte, lte, sql, desc, asc } from "drizzle-orm";
import { db, imoveisTable, fontesTable } from "@workspace/db";
import {
  ListImoveisQueryParams,
  GetImovelParams,
  ToggleFavoritoParams,
  ToggleFavoritoBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/imoveis", async (req, res): Promise<void> => {
  const parsed = ListImoveisQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const {
    tipo,
    cidade,
    bairro,
    precoMin,
    precoMax,
    quartos,
    apenasAbaixoMedia,
    apenasFavoritos,
    fonteId,
    ordenar,
    pagina = 1,
    porPagina = 20,
  } = parsed.data;

  const conditions = [];

  if (tipo && tipo !== "todos") {
    conditions.push(eq(imoveisTable.tipo, tipo));
  }
  if (cidade) {
    conditions.push(sql`lower(${imoveisTable.cidade}) like lower(${"%" + cidade + "%"})`);
  }
  if (bairro) {
    conditions.push(sql`lower(${imoveisTable.bairro}) like lower(${"%" + bairro + "%"})`);
  }
  if (precoMin != null) {
    conditions.push(gte(imoveisTable.preco, String(precoMin)));
  }
  if (precoMax != null) {
    conditions.push(lte(imoveisTable.preco, String(precoMax)));
  }
  if (quartos != null) {
    conditions.push(gte(imoveisTable.quartos, quartos));
  }
  if (apenasAbaixoMedia) {
    conditions.push(eq(imoveisTable.abaixoDaMedia, true));
  }
  if (apenasFavoritos) {
    conditions.push(eq(imoveisTable.favorito, true));
  }
  if (fonteId != null) {
    conditions.push(eq(imoveisTable.fonteId, fonteId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  let orderClause;
  switch (ordenar) {
    case "preco_desc":
      orderClause = desc(imoveisTable.preco);
      break;
    case "data_desc":
      orderClause = desc(imoveisTable.coletadoEm);
      break;
    case "preco_m2_asc":
      orderClause = asc(imoveisTable.precoM2);
      break;
    default:
      orderClause = asc(imoveisTable.preco);
  }

  const offset = (pagina - 1) * porPagina;

  const [totalResult, items] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(imoveisTable)
      .where(whereClause),
    db
      .select({
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
        favorito: imoveisTable.favorito,
        abaixoDaMedia: imoveisTable.abaixoDaMedia,
        percentualAbaixoMedia: imoveisTable.percentualAbaixoMedia,
        mediaRegiao: imoveisTable.mediaRegiao,
        coletadoEm: imoveisTable.coletadoEm,
        fonteNome: fontesTable.nome,
      })
      .from(imoveisTable)
      .leftJoin(fontesTable, eq(imoveisTable.fonteId, fontesTable.id))
      .where(whereClause)
      .orderBy(orderClause)
      .limit(porPagina)
      .offset(offset),
  ]);

  const total = totalResult[0]?.count ?? 0;

  res.json({
    items,
    total,
    pagina,
    porPagina,
    totalPaginas: Math.ceil(total / porPagina),
  });
});

router.get("/imoveis/:id", async (req, res): Promise<void> => {
  const params = GetImovelParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [imovel] = await db
    .select({
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
      favorito: imoveisTable.favorito,
      abaixoDaMedia: imoveisTable.abaixoDaMedia,
      percentualAbaixoMedia: imoveisTable.percentualAbaixoMedia,
      mediaRegiao: imoveisTable.mediaRegiao,
      coletadoEm: imoveisTable.coletadoEm,
      fonteNome: fontesTable.nome,
    })
    .from(imoveisTable)
    .leftJoin(fontesTable, eq(imoveisTable.fonteId, fontesTable.id))
    .where(eq(imoveisTable.id, params.data.id));

  if (!imovel) {
    res.status(404).json({ error: "Imóvel não encontrado" });
    return;
  }

  res.json(imovel);
});

router.patch("/imoveis/:id/favorito", async (req, res): Promise<void> => {
  const params = ToggleFavoritoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = ToggleFavoritoBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [imovel] = await db
    .update(imoveisTable)
    .set({ favorito: body.data.favorito })
    .where(eq(imoveisTable.id, params.data.id))
    .returning();

  if (!imovel) {
    res.status(404).json({ error: "Imóvel não encontrado" });
    return;
  }

  res.json(imovel);
});

export default router;
