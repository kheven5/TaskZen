"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import type { TimerMode, TimerStatus, TimerSettings } from "@/types";
import { generateId, getDateString } from "@/lib/utils";

const DEFAULT_SETTINGS: TimerSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  soundEnabled: true,
  volume: 0.5,
};

function getDuration(mode: TimerMode, settings: TimerSettings): number {
  if (mode === "focus") return settings.focusDuration * 60;
  if (mode === "short-break") return settings.shortBreakDuration * 60;
  return settings.longBreakDuration * 60;
}

export function useTimer() {
  const [settings, setSettings] = useState<TimerSettings>(() => {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    try {
      const saved = localStorage.getItem("timerSettings");
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [mode, setMode] = useState<TimerMode>("focus");
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [timeLeft, setTimeLeft] = useState(getDuration("focus", settings));
  const [completedSessions, setCompletedSessions] = useState(0);
  const [todaySessions, setTodaySessions] = useState(0);
  const [showBreakReminder, setShowBreakReminder] = useState(false);
  const [focusModeActive, setFocusModeActive] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const totalTime = getDuration(mode, settings);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const playSound = useCallback(() => {
    if (!settings.soundEnabled) return;
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(settings.volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch {}
  }, [settings.soundEnabled, settings.volume]);

  const handleFinish = useCallback(() => {
    clearTimer();
    setStatus("finished");
    playSound();
    if (mode === "focus") {
      const next = completedSessions + 1;
      setCompletedSessions(next);
      setTodaySessions((p) => p + 1);
      setShowBreakReminder(true);
    } else {
      setShowBreakReminder(false);
    }
  }, [clearTimer, playSound, mode, completedSessions]);

  useEffect(() => {
    if (status === "running") {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleFinish();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [status, handleFinish, clearTimer]);

  const start = useCallback(() => setStatus("running"), []);
  const pause = useCallback(() => setStatus("paused"), []);
  const reset = useCallback(() => {
    clearTimer();
    setStatus("idle");
    setShowBreakReminder(false);
    setTimeLeft(getDuration(mode, settings));
  }, [clearTimer, mode, settings]);

  const switchMode = useCallback((newMode: TimerMode) => {
    clearTimer();
    setMode(newMode);
    setStatus("idle");
    setShowBreakReminder(false);
    setTimeLeft(getDuration(newMode, settings));
  }, [clearTimer, settings]);

  const dismissBreak = useCallback(() => {
    setShowBreakReminder(false);
    const nextMode: TimerMode =
      completedSessions % settings.longBreakInterval === 0 ? "long-break" : "short-break";
    switchMode(nextMode);
  }, [completedSessions, settings.longBreakInterval, switchMode]);

  const updateSettings = useCallback((newSettings: Partial<TimerSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem("timerSettings", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const toggleFocusMode = useCallback(() => setFocusModeActive((p) => !p), []);

  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  return {
    mode, status, timeLeft, totalTime, progress,
    completedSessions, todaySessions, settings,
    showBreakReminder, focusModeActive,
    start, pause, reset, switchMode,
    dismissBreak, updateSettings, toggleFocusMode,
  };
}
