import { Router, RequestHandler } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, h } from "../middleware/auth";

const router = Router();
router.use(requireAuth as RequestHandler);

router.get("/", h(async (req, res) => {
  const userId = req.user!.userId;

  try {
    // Fetch the user and its profile in a single round-trip (the profile relation is
    // included). The profile is only created when it doesn't exist yet, so the common
    // path is one query rather than the multi-statement upsert.
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true, profile: true },
    });

    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const profile = user.profile ?? (await prisma.userProfile.create({ data: { userId } }));

    res.json({ profile, user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    console.error("[profile/get]", err);
    res.status(500).json({ error: "Failed to load profile." });
  }
}));

router.put("/", h(async (req, res) => {
  const userId = req.user!.userId;
  const {
    avatar, fullName, institution, fieldOfStudy,
    yearLevel, studentId, dailyGoal, studyTime, learningStyle,
    xp, achievements, totalDistractions, perfectSessions,
  } = req.body as {
    avatar?: string;
    fullName?: string;
    institution?: string;
    fieldOfStudy?: string;
    yearLevel?: string;
    studentId?: string;
    dailyGoal?: string;
    studyTime?: string;
    learningStyle?: string;
    xp?: number;
    achievements?: string;
    totalDistractions?: number;
    perfectSessions?: number;
  };

  const profile = await prisma.userProfile.upsert({
    where: { userId },
    update: {
      ...(avatar !== undefined && { avatar }),
      ...(fullName !== undefined && { fullName }),
      ...(institution !== undefined && { institution }),
      ...(fieldOfStudy !== undefined && { fieldOfStudy }),
      ...(yearLevel !== undefined && { yearLevel }),
      ...(studentId !== undefined && { studentId }),
      ...(dailyGoal !== undefined && { dailyGoal }),
      ...(studyTime !== undefined && { studyTime }),
      ...(learningStyle !== undefined && { learningStyle }),
      ...(xp !== undefined && { xp }),
      ...(achievements !== undefined && { achievements }),
      ...(totalDistractions !== undefined && { totalDistractions }),
      ...(perfectSessions !== undefined && { perfectSessions }),
    },
    create: {
      userId,
      avatar: avatar ?? "",
      fullName: fullName ?? "",
      institution: institution ?? "",
      fieldOfStudy: fieldOfStudy ?? "",
      yearLevel: yearLevel ?? "",
      studentId: studentId ?? "",
      dailyGoal: dailyGoal ?? "",
      studyTime: studyTime ?? "",
      learningStyle: learningStyle ?? "",
      xp: xp ?? 0,
      achievements: achievements ?? "[]",
      totalDistractions: totalDistractions ?? 0,
      perfectSessions: perfectSessions ?? 0,
    },
  });
  res.json({ profile });
}));

export default router;
