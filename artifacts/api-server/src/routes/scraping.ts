import { Router, type IRouter } from "express";
import { db, fontesTable, imoveisTable, scrapingStatusTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { IniciarScrapingBody } from "@workspace/api-zod";
import { scrapearFonte } from "../lib/firecrawl";
import { recalcularMedias } from "../lib/priceAnalysis";
import { logger } from "../lib/logger";

const router: IRouter = Router();

let statusCache = {
  rodando: false,
  fonteAtual: null as string | null,
  imoveisColetados: 0,
  erros: 0,
  mensagem: "Aguardando início",
  iniciadoEm: null as string | null,
};

router.get("/scraping/status", async (_req, res): Promise<void> => {
  res.json(statusCache);
});

router.post("/scraping/iniciar", async (req, res): Promise<void> => {
  if (statusCache.rodando) {
    res.status(409).json({ error: "Scraping já em execução" });
    return;
  }

  const parsed = IniciarScrapingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { fonteId } = parsed.data;

  statusCache = {
    rodando: true,
    fonteAtual: null,
    imoveisColetados: 0,
    erros: 0,
    mensagem: "Iniciando scraping...",
    iniciadoEm: new Date().toISOString(),
  };

  res.status(202).json(statusCache);

  // Roda em background
  runScraping(fonteId ?? null).catch((err) => {
    logger.error({ err }, "Erro fatal no scraping");
    statusCache.rodando = false;
    statusCache.mensagem = "Erro fatal: " + String(err);
  });
});

async function runScraping(fonteId: number | null): Promise<void> {
  try {
    let fontes;
    if (fonteId != null) {
      fontes = await db.select().from(fontesTable).where(eq(fontesTable.id, fonteId));
    } else {
      fontes = await db.select().from(fontesTable).where(eq(fontesTable.ativa, true));
    }

    if (fontes.length === 0) {
      statusCache.mensagem = "Nenhuma fonte ativa encontrada";
      statusCache.rodando = false;
      return;
    }

    for (const fonte of fontes) {
      statusCache.fonteAtual = fonte.nome;
      statusCache.mensagem = `Coletando de: ${fonte.nome}`;

      try {
        const imoveis = await scrapearFonte(fonte.url);

        for (const imovel of imoveis) {
          try {
            await db.insert(imoveisTable).values({
              titulo: imovel.titulo,
              descricao: imovel.descricao ?? null,
              preco: String(imovel.preco),
              precoM2: imovel.area && imovel.preco ? String((imovel.preco / imovel.area).toFixed(2)) : null,
              tipo: imovel.tipo,
              cidade: imovel.cidade ?? null,
              bairro: imovel.bairro ?? null,
              endereco: imovel.endereco ?? null,
              quartos: imovel.quartos ?? null,
              banheiros: imovel.banheiros ?? null,
              area: imovel.area ? String(imovel.area) : null,
              vagas: imovel.vagas ?? null,
              imagemUrl: imovel.imagemUrl ?? null,
              urlOriginal: imovel.urlOriginal,
              fonteId: fonte.id,
            });
            statusCache.imoveisColetados++;
          } catch (insertErr) {
            logger.warn({ insertErr }, "Erro ao inserir imóvel");
          }
        }

        await db
          .update(fontesTable)
          .set({
            ultimoScraping: new Date(),
            totalImoveisColetados: sql`${fontesTable.totalImoveisColetados} + ${imoveis.length}`,
          })
          .where(eq(fontesTable.id, fonte.id));
      } catch (err) {
        logger.error({ err, fonte: fonte.nome }, "Erro ao scraping da fonte");
        statusCache.erros++;
      }
    }

    statusCache.mensagem = `Concluído! ${statusCache.imoveisColetados} imóveis coletados`;
    statusCache.fonteAtual = null;

    await recalcularMedias();
  } finally {
    statusCache.rodando = false;
  }
}

export default router;
