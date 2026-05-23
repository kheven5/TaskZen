const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
}

async function apiFetch(path: string, init?: RequestInit, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error("timeout")), timeoutMs);
  try {
    const res = await fetch(`${API}${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...init?.headers },
      signal: controller.signal,
      ...init,
    });
    clearTimeout(timer);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as { error?: string }).error ?? "Request failed");
    return data;
  } catch (err) {
    clearTimeout(timer);
    if (controller.signal.aborted) throw new Error("Request timed out");
    throw err;
  }
}

export async function getSession(): Promise<AuthUser | null> {
  try {
    const data = await apiFetch("/api/auth/me", undefined, 4000);
    return (data as { user: AuthUser }).user ?? null;
  } catch {
    return null;
  }
}

export async function authLogin(
  email: string,
  password: string,
  rememberMe = false
): Promise<AuthUser> {
  const data = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, rememberMe }),
  });
  return (data as { user: AuthUser }).user;
}

export async function authSignup(
  username: string,
  email: string,
  password: string
): Promise<AuthUser> {
  const data = await apiFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });
  return (data as { user: AuthUser }).user;
}

export async function authLogout(): Promise<void> {
  await apiFetch("/api/auth/logout", { method: "POST" });
}
