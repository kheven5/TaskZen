import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  let settings = await prisma.timerSettings.findUnique({ where: { userId } });
  if (!settings) {
    settings = await prisma.timerSettings.create({ data: { userId } });
  }
  res.json({ settings });
});

router.put("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const {
    focusDuration, shortBreakDuration, longBreakDuration,
    longBreakInterval, autoStartBreaks, autoStartFocus,
    soundEnabled, volume, weeklyGoal,
  } = req.body as {
    focusDuration?: number;
    shortBreakDuration?: number;
    longBreakDuration?: number;
    longBreakInterval?: number;
    autoStartBreaks?: boolean;
    autoStartFocus?: boolean;
    soundEnabled?: boolean;
    volume?: number;
    weeklyGoal?: number;
  };

  const patch = {
    ...(focusDuration !== undefined && { focusDuration }),
    ...(shortBreakDuration !== undefined && { shortBreakDuration }),
    ...(longBreakDuration !== undefined && { longBreakDuration }),
    ...(longBreakInterval !== undefined && { longBreakInterval }),
    ...(autoStartBreaks !== undefined && { autoStartBreaks }),
    ...(autoStartFocus !== undefined && { autoStartFocus }),
    ...(soundEnabled !== undefined && { soundEnabled }),
    ...(volume !== undefined && { volume }),
    ...(weeklyGoal !== undefined && { weeklyGoal }),
  };

  const settings = await prisma.timerSettings.upsert({
    where: { userId },
    update: patch,
    create: { userId, ...patch },
  });
  res.json({ settings });
});

export default router;
