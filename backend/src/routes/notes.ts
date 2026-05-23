import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const notes = await prisma.note.findMany({
    where: { userId: req.user!.userId },
    orderBy: { updatedAt: "desc" },
  });
  res.json({ notes });
});

router.post("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, content, category } = req.body as {
    title?: string;
    content?: string;
    category?: string;
  };

  if (!title?.trim() && !content?.trim()) {
    res.status(400).json({ error: "Title or content is required" });
    return;
  }

  const note = await prisma.note.create({
    data: {
      userId: req.user!.userId,
      title: title?.trim() || "Untitled",
      content: content?.trim() ?? "",
      category: category ?? "General",
    },
  });
  res.status(201).json({ note });
});

router.put("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const existing = await prisma.note.findFirst({ where: { id, userId: req.user!.userId } });
  if (!existing) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  const { title, content, category } = req.body as {
    title?: string;
    content?: string;
    category?: string;
  };

  const note = await prisma.note.update({
    where: { id },
    data: {
      title: title !== undefined ? (title.trim() || "Untitled") : existing.title,
      content: content !== undefined ? content.trim() : existing.content,
      category: category ?? existing.category,
    },
  });
  res.json({ note });
});

router.delete("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const existing = await prisma.note.findFirst({ where: { id, userId: req.user!.userId } });
  if (!existing) {
    res.status(404).json({ error: "Note not found" });
    return;
  }
  await prisma.note.delete({ where: { id } });
  res.json({ message: "Deleted" });
});

export default router;
