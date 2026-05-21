import { logger } from "./logger";

const FIRECRAWL_BASE_URL = "https://connectors.replit.com/api/v2/firecrawl";

async function firecrawlRequest(path: string, body: object): Promise<unknown> {
  const replIdentity = process.env["REPL_IDENTITY"];
  const connectorHostname = process.env["REPLIT_CONNECTORS_HOSTNAME"];

  if (!replIdentity || !connectorHostname) {
    throw new Error("Firecrawl: Missing REPL_IDENTITY or REPLIT_CONNECTORS_HOSTNAME env vars");
  }

  const url = `https://${connectorHostname}/api/v2/firecrawl${path}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Replit-Identity": replIdentity,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Firecrawl request failed ${response.status}: ${text}`);
  }

  return response.json();
}

export interface ImovelExtraido {
  titulo: string;
  preco: number;
  tipo: "compra" | "aluguel";
  cidade?: string;
  bairro?: string;
  endereco?: string;
  quartos?: number;
  banheiros?: number;
  area?: number;
  vagas?: number;
  imagemUrl?: string;
  urlOriginal: string;
  descricao?: string;
}

function parsePreco(texto: string): number | null {
  if (!texto) return null;
  const num = texto.replace(/[^\d,]/g, "").replace(",", ".");
  const val = parseFloat(num);
  return isNaN(val) ? null : val;
}

function parseInteiro(texto: string | undefined): number | undefined {
  if (!texto) return undefined;
  const val = parseInt(texto, 10);
  return isNaN(val) ? undefined : val;
}

function detectarTipo(markdown: string, url: string): "compra" | "aluguel" {
  const texto = (markdown + url).toLowerCase();
  if (
    texto.includes("aluguel") ||
    texto.includes("locação") ||
    texto.includes("locar") ||
    texto.includes("alugar") ||
    texto.includes("/mes") ||
    texto.includes("mensal")
  ) {
    return "aluguel";
  }
  return "compra";
}

function extrairImoveisDoMarkdown(markdown: string, urlBase: string): ImovelExtraido[] {
  const imoveis: ImovelExtraido[] = [];

  // Extrai blocos de imóveis do markdown usando padrões comuns de sites imobiliários
  const tipo = detectarTipo(markdown, urlBase);

  // Padrão para encontrar preços no markdown
  const precoRegex = /R\$\s*([\d.,]+)/g;
  const tituloRegex = /#{1,3}\s+(.+)/g;
  const quartoRegex = /(\d+)\s*quarto/gi;
  const areaRegex = /(\d+(?:,\d+)?)\s*m[²2]/gi;
  const bairroRegex = /(?:bairro|localiza[çc][aã]o|regi[aã]o)[:\s]+([^\n,]+)/gi;
  const cidadeRegex = /(?:cidade|munic[íi]pio)[:\s]+([^\n,]+)/gi;

  const precos: string[] = [];
  let m;
  while ((m = precoRegex.exec(markdown)) !== null) {
    precos.push(m[1]);
  }

  const titulos: string[] = [];
  while ((m = tituloRegex.exec(markdown)) !== null) {
    titulos.push(m[1].trim());
  }

  const quartosMatch = quartoRegex.exec(markdown);
  const areaMatch = areaRegex.exec(markdown);
  const bairroMatch = bairroRegex.exec(markdown);
  const cidadeMatch = cidadeRegex.exec(markdown);

  if (precos.length === 0) return imoveis;

  // Cria um imóvel por preço encontrado (heurística)
  precos.slice(0, 5).forEach((precoStr, i) => {
    const preco = parsePreco(precoStr);
    if (!preco || preco < 100) return;

    const titulo = titulos[i] || titulos[0] || `Imóvel encontrado em ${new URL(urlBase).hostname}`;

    imoveis.push({
      titulo: titulo.slice(0, 200),
      preco,
      tipo,
      cidade: cidadeMatch ? cidadeMatch[1].trim().slice(0, 100) : undefined,
      bairro: bairroMatch ? bairroMatch[1].trim().slice(0, 100) : undefined,
      quartos: quartosMatch ? parseInteiro(quartosMatch[1]) : undefined,
      area: areaMatch ? parseInteiro(areaMatch[1].replace(",", ".")) : undefined,
      urlOriginal: urlBase,
      descricao: markdown.slice(0, 500),
    });
  });

  return imoveis;
}

export async function scrapearFonte(url: string): Promise<ImovelExtraido[]> {
  logger.info({ url }, "Iniciando scraping com Firecrawl");

  try {
    const result = (await firecrawlRequest("/scrape", {
      url,
      formats: ["markdown"],
      onlyMainContent: true,
    })) as { data?: { markdown?: string } };

    const markdown = result?.data?.markdown ?? "";

    if (!markdown) {
      logger.warn({ url }, "Nenhum conteúdo markdown retornado pelo Firecrawl");
      return [];
    }

    const imoveis = extrairImoveisDoMarkdown(markdown, url);
    logger.info({ url, total: imoveis.length }, "Imóveis extraídos");
    return imoveis;
  } catch (err) {
    logger.error({ err, url }, "Erro ao fazer scraping");
    return [];
  }
}

export async function scrapearMultiplasUrls(urls: string[]): Promise<Map<string, ImovelExtraido[]>> {
  const resultados = new Map<string, ImovelExtraido[]>();

  for (const url of urls) {
    const imoveis = await scrapearFonte(url);
    resultados.set(url, imoveis);
    // Pausa entre requests para não sobrecarregar
    await new Promise((r) => setTimeout(r, 500));
  }

  return resultados;
}
