import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import authRouter from "./routes/auth";
import landingRouter from "./routes/landing";
import passport from "./lib/passport";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET ?? "taskzen-dev-session-secret",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 10 * 60 * 1000 }, // 10 min — only for OAuth handshake
}));

app.use(passport.initialize());
app.use(passport.session());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/landing", landingRouter);

app.listen(PORT, () => {
  console.log(`TaskZen backend running on http://localhost:${PORT}`);
});
