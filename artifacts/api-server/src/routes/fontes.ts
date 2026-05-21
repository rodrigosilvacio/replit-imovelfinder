import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, fontesTable } from "@workspace/db";
import {
  CreateFonteBody,
  UpdateFonteBody,
  UpdateFonteParams,
  DeleteFonteParams,
  ListFontesResponse,
  UpdateFonteResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/fontes", async (req, res): Promise<void> => {
  const fontes = await db.select().from(fontesTable).orderBy(fontesTable.criadaEm);
  res.json(ListFontesResponse.parse(fontes));
});

router.post("/fontes", async (req, res): Promise<void> => {
  const parsed = CreateFonteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [fonte] = await db.insert(fontesTable).values(parsed.data).returning();
  res.status(201).json(fonte);
});

router.patch("/fontes/:id", async (req, res): Promise<void> => {
  const params = UpdateFonteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateFonteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [fonte] = await db
    .update(fontesTable)
    .set(parsed.data)
    .where(eq(fontesTable.id, params.data.id))
    .returning();
  if (!fonte) {
    res.status(404).json({ error: "Fonte não encontrada" });
    return;
  }
  res.json(UpdateFonteResponse.parse(fonte));
});

router.delete("/fontes/:id", async (req, res): Promise<void> => {
  const params = DeleteFonteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [fonte] = await db
    .delete(fontesTable)
    .where(eq(fontesTable.id, params.data.id))
    .returning();
  if (!fonte) {
    res.status(404).json({ error: "Fonte não encontrada" });
    return;
  }
  res.sendStatus(204);
});

export default router;
