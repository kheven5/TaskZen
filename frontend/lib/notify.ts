"use client";

/**
 * Thin wrapper around the browser Notification API for system-level ("floating")
 * popups that appear even when the TaskZen tab is in the background — e.g. when the
 * user has alt-tabbed away during a focus session.
 */

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/** Requests permission once if it hasn't been decided yet. Safe to call from a user gesture. */
export function ensureNotificationPermission(): void {
  if (!notificationsSupported()) return;
  if (Notification.permission === "default") {
    Notification.requestPermission().catch(() => {});
  }
}

interface SendOptions {
  body?: string;
  tag?: string;
  /** Focus the TaskZen window when the notification is clicked (default: true). */
  focusOnClick?: boolean;
}

export function sendNotification(title: string, options: SendOptions = {}): void {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  const { body, tag, focusOnClick = true } = options;
  try {
    const n = new Notification(title, { body, tag, icon: "/taskzen-circle.png" });
    if (focusOnClick) {
      n.onclick = () => {
        window.focus();
        n.close();
      };
    }
  } catch {
    /* ignore — some browsers throw if permission was revoked mid-session */
  }
}
