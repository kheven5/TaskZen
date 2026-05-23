import { Router, Request, Response, RequestHandler } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { signToken } from "../lib/jwt";
import { requireAuth, h } from "../middleware/auth";
import passport from "../lib/passport";

const router = Router();

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

// ── Google OAuth ──────────────────────────────────────────────────────────────

// GET /api/auth/google  — prompt forces account picker every time
router.get("/google", (req, res, next) => {
  console.log("[Auth] Starting Google OAuth flow");
  passport.authenticate("google", {
    scope: ["email", "profile"],
    prompt: "select_account",
    access_type: "offline",
  } as object)(req, res, next);
});

// GET /api/auth/google/callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${FRONTEND_URL}/login?error=google_failed`,
    session: false, // We use JWT — skip Passport's session.regenerate() entirely
  }),
  (req: Request, res: Response): void => {
    const user = req.user as { id: string; email: string; username: string };
    console.log(`[Auth] Google callback success — issuing JWT for user ${user.id} (${user.email})`);

    const token = signToken({ userId: user.id, email: user.email, username: user.username });

    // Clear any old token before setting new one
    res.clearCookie("token");
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.redirect(`${FRONTEND_URL}/dashboard`);
  }
);

// ── Email / Password ──────────────────────────────────────────────────────────

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  const { username, email, password } = req.body as {
    username?: string;
    email?: string;
    password?: string;
  };

  if (!username?.trim() || !email?.trim() || !password) {
    res.status(400).json({ error: "Username, email, and password are required" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (existing) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
    },
  });

  const token = signToken({ userId: user.id, email: user.email, username: user.username });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.status(201).json({
    user: { id: user.id, username: user.username, email: user.email },
    token,
  });
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  const { email, password, rememberMe } = req.body as {
    email?: string;
    password?: string;
    rememberMe?: boolean;
  };

  if (!email?.trim() || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  if (!user.password) {
    res.status(401).json({ error: "This account uses Google sign-in. Please use the Google button." });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signToken(
    { userId: user.id, email: user.email, username: user.username },
    rememberMe
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
  });

  res.json({
    user: { id: user.id, username: user.username, email: user.email },
    token,
  });
});

// POST /api/auth/logout
router.post("/logout", (req: Request, res: Response): void => {
  console.log("[Auth] Logout requested");
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  if (req.session) {
    req.session.destroy(() => {
      console.log("[Auth] Session destroyed");
      res.json({ message: "Logged out" });
    });
  } else {
    res.json({ message: "Logged out" });
  }
});

// GET /api/auth/me
router.get("/me", requireAuth as RequestHandler, h(async (req, res) => {
  res.json({ user: req.user });
}));

export default router;
