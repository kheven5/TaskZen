"use client";
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { FocusTimer } from "@/components/FocusTimer";
import { AIAssistant } from "@/components/AIAssistant";
import { SessionStats } from "@/components/SessionStats";
import { ProductivityChart } from "@/components/ProductivityChart";
import { QuotesWidget } from "@/components/QuotesWidget";
import { BreakReminder } from "@/components/BreakReminder";
import { SettingsModal } from "@/components/SettingsModal";
import { StudyNotes } from "@/components/StudyNotes";
import { TodoList } from "@/components/TodoList";
import { ProfilePage } from "@/components/ProfilePage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTimer } from "@/hooks/useTimer";
import { useAuth } from "@/context/AuthContext";
import { useTaskNotifications } from "@/hooks/useTaskNotifications";
import { dummyStats } from "@/data/dummy";
import { cn, formatMinutes } from "@/lib/utils";
import {
  BookOpen, Brain, Zap, GraduationCap,
  Lightbulb, Calendar, CheckCircle2, BarChart3
} from "lucide-react";

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
};

function DashboardOverview({ onNavigate, stats }: { onNavigate: (tab: string) => void; stats: typeof dummyStats }) {
  const quickStats = [
    { icon: Zap, label: "Sessions Today", value: String(stats.todaySessions), color: "text-primary bg-primary/10" },
    { icon: Calendar, label: "Day Streak", value: `${stats.currentStreak}`, color: "text-orange-500 bg-orange-100 dark:bg-orange-900/30" },
    { icon: CheckCircle2, label: "Weekly Progress", value: `${Math.round((stats.weeklyProgress / stats.weeklyGoal) * 100)}%`, color: "text-green-600 bg-green-100 dark:bg-green-900/30" },
    { icon: BarChart3, label: "Total Focus", value: formatMinutes(stats.totalMinutes), color: "text-blue-500 bg-blue-100 dark:bg-blue-900/30" },
  ];

  return (
    <div className="space-y-5">
      {/* Hero banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl gradient-blue p-6 text-white shadow-md"
      >
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-start justify-between">
          <div>
            <Badge className="bg-white/20 text-white border-0 mb-3 text-xs">AI-Powered</Badge>
            <h1 className="text-2xl font-bold mb-1">Ready to Focus?</h1>
            <p className="text-white/80 text-sm mb-4 max-w-xs">
              Start a Pomodoro session, ask your AI assistant, or review your progress.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => onNavigate("timer")}
                className="bg-white text-[#2C2C2C] hover:bg-white/90 rounded-xl text-sm h-9 font-semibold"
              >
                <Zap className="h-3.5 w-3.5 mr-1.5" />
                Start Focus
              </Button>
              <Button
                onClick={() => onNavigate("assistant")}
                variant="outline"
                className="border-white/30 text-white bg-transparent hover:bg-white/10 rounded-xl text-sm h-9"
              >
                <Brain className="h-3.5 w-3.5 mr-1.5" />
                Ask AI
              </Button>
            </div>
          </div>
          <div className="hidden sm:flex w-20 h-20 rounded-2xl bg-white/15 items-center justify-center">
            <GraduationCap className="h-10 w-10 text-white" />
          </div>
        </div>
      </motion.div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickStats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.07 }}
            whileHover={{ y: -2 }}
          >
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", s.color)}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Two-column */}
      <div className="grid lg:grid-cols-2 gap-4">
        <QuotesWidget />
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Start 25m Focus", icon: Zap, tab: "timer", color: "bg-primary/10 text-primary hover:bg-primary/20" },
                { label: "Chat with AI", icon: Brain, tab: "assistant", color: "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900/50" },
                { label: "View Analytics", icon: BarChart3, tab: "stats", color: "bg-green-100 dark:bg-green-900/30 text-green-600 hover:bg-green-200 dark:hover:bg-green-900/50" },
                { label: "Study Notes", icon: BookOpen, tab: "notes", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 hover:bg-amber-200 dark:hover:bg-amber-900/50" },
              ].map((action) => (
                <button
                  key={action.tab}
                  onClick={() => onNavigate(action.tab)}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl text-sm font-medium transition-all duration-200 text-left",
                    action.color
                  )}
                >
                  <action.icon className="h-4 w-4 shrink-0" />
                  {action.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart preview */}
      <ProductivityChart />
    </div>
  );
}

function NotesPlaceholder() {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <Card className="min-h-[400px] flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 rounded-2xl gradient-blue flex items-center justify-center mx-auto mb-4 shadow-lg">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-bold mb-2">Study Notes</h3>
          <p className="text-muted-foreground text-sm max-w-xs">
            Your personal study notes workspace. Jot down key concepts, summaries, and important ideas while studying.
          </p>
          <Badge variant="blue" className="mt-4">Coming Soon</Badge>
        </div>
      </Card>
    </motion.div>
  );
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("tab") || "dashboard";
    }
    return "dashboard";
  });
  const [focusModeActive, setFocusModeActive] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [allTasks, setAllTasks] = useState<{ id: string; title: string; status: string; dueDate: string; dueTime: string }[]>([]);
  const { user, logout } = useAuth();

  useEffect(() => {
    const readTasks = () => {
      try {
        const r = localStorage.getItem("taskzen_todos");
        setAllTasks(r ? JSON.parse(r) : []);
      } catch {}
    };
    readTasks();
    window.addEventListener("taskzen_todos_updated", readTasks);
    return () => window.removeEventListener("taskzen_todos_updated", readTasks);
  }, []);

  useTaskNotifications(allTasks);

  useEffect(() => {
    const readName = () => {
      try {
        const r = localStorage.getItem("taskzen_profile");
        setProfileName(r ? JSON.parse(r).fullName ?? "" : "");
      } catch {}
    };
    readName();
    window.addEventListener("taskzen_profile_updated", readName);
    return () => window.removeEventListener("taskzen_profile_updated", readName);
  }, []);
  const {
    showBreakReminder, completedSessions, todaySessions,
    dismissBreak, settings, updateSettings,
  } = useTimer();

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    window.history.replaceState(null, "", `/dashboard?tab=${tab}`);
  }, []);

  const handleToggleFocusMode = () => setFocusModeActive((p) => !p);

  const statsWithToday = { ...dummyStats, todaySessions: dummyStats.todaySessions + todaySessions };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />

      <div className="flex-1 flex flex-col lg:ml-16 min-w-0">
        <Header
          activeTab={activeTab}
          onTabChange={handleTabChange}
          streak={dummyStats.currentStreak}
          username={user?.username || profileName}
          onLogout={logout}
        />

        <main className="flex-1 p-4 lg:p-6 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div key="dashboard" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
                <DashboardOverview onNavigate={handleTabChange} stats={statsWithToday} />
              </motion.div>
            )}

            {activeTab === "timer" && (
              <motion.div key="timer" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
                <div className="grid lg:grid-cols-5 gap-5">
                  <div className="lg:col-span-3 space-y-4">
                    <div className="flex items-center justify-between mb-1">
                      <h2 className="text-xl font-bold">Focus Timer</h2>
                      <SettingsModal settings={settings} onSave={updateSettings} />
                    </div>
                    <FocusTimer
                      focusModeActive={focusModeActive}
                      onToggleFocusMode={handleToggleFocusMode}
                    />
                    <QuotesWidget />
                  </div>
                  <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold mb-1">{"Today's Progress"}</h2>
                    <SessionStats stats={statsWithToday} todaySessions={todaySessions} />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "assistant" && (
              <motion.div key="assistant" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
                <div className="grid lg:grid-cols-5 gap-5">
                  <div className="lg:col-span-3">
                    <h2 className="text-xl font-bold mb-4">AI Study Assistant</h2>
                    <AIAssistant />
                  </div>
                  <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold mb-4">Quick Stats</h2>
                    <SessionStats stats={statsWithToday} todaySessions={todaySessions} />
                    <QuotesWidget />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "stats" && (
              <motion.div key="stats" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
                <h2 className="text-xl font-bold mb-4">Productivity Analytics</h2>
                <div className="space-y-5">
                  <SessionStats stats={statsWithToday} todaySessions={todaySessions} />
                  <ProductivityChart />
                </div>
              </motion.div>
            )}

            {activeTab === "notes" && (
              <motion.div key="notes" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
                <StudyNotes />
              </motion.div>
            )}

            {activeTab === "todo" && (
              <motion.div key="todo" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
                <TodoList />
              </motion.div>
            )}

            {activeTab === "profile" && (
              <motion.div key="profile" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
                <ProfilePage
                  username={user?.username}
                  onProfileChange={() => window.dispatchEvent(new Event("taskzen_profile_updated"))}
                />
              </motion.div>
            )}

            {activeTab === "settings" && (
              <motion.div key="settings" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
                <h2 className="text-xl font-bold mb-4">Settings</h2>
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Timer Configuration</h3>
                        <p className="text-sm text-muted-foreground">Customize your Pomodoro durations and behavior</p>
                      </div>
                      <SettingsModal settings={settings} onSave={updateSettings} />
                    </div>
                    <div className="border-t border-border pt-4">
                      <h3 className="font-semibold mb-1">Current Settings</h3>
                      <div className="grid sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                        <div>Focus Duration: <span className="text-foreground font-medium">{settings.focusDuration} min</span></div>
                        <div>Short Break: <span className="text-foreground font-medium">{settings.shortBreakDuration} min</span></div>
                        <div>Long Break: <span className="text-foreground font-medium">{settings.longBreakDuration} min</span></div>
                        <div>Long Break Every: <span className="text-foreground font-medium">{settings.longBreakInterval} sessions</span></div>
                        <div>Sound: <span className="text-foreground font-medium">{settings.soundEnabled ? "On" : "Off"}</span></div>
                        <div>Auto-start Breaks: <span className="text-foreground font-medium">{settings.autoStartBreaks ? "On" : "Off"}</span></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <BreakReminder
        show={showBreakReminder}
        sessionsCompleted={completedSessions}
        onStartBreak={dismissBreak}
        onDismiss={dismissBreak}
      />

      <AnimatePresence>
        {focusModeActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md space-y-4">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl gradient-blue flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Focus Mode</h2>
                <p className="text-sm text-muted-foreground mt-1">Distraction-free environment active</p>
              </div>
              <FocusTimer focusModeActive onToggleFocusMode={handleToggleFocusMode} />
              <Button
                variant="outline"
                className="w-full rounded-xl"
                onClick={handleToggleFocusMode}
              >
                Exit Focus Mode (F)
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
