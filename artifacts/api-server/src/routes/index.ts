import { Router, type IRouter } from "express";
import healthRouter from "./health";
import imoveisRouter from "./imoveis";
import fontesRouter from "./fontes";
import dashboardRouter from "./dashboard";
import scrapingRouter from "./scraping";
import relatorioRouter from "./relatorio";

const router: IRouter = Router();

router.use(healthRouter);
router.use(imoveisRouter);
router.use(fontesRouter);
router.use(dashboardRouter);
router.use(scrapingRouter);
router.use(relatorioRouter);

export default router;
