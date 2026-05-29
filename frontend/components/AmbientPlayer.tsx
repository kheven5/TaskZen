"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Music2, Volume2, VolumeX, Play, Pause, ChevronDown, ExternalLink, X } from "lucide-react";
import { cn } from "@/lib/utils";

const SPOTIFY_GREEN = "#1DB954";

const PRESETS = [
  { label: "Lo-fi",     emoji: "🎵", query: "lofi hip hop study music" },
  { label: "Rain",      emoji: "🌧️", query: "rain sounds for studying 1 hour" },
  { label: "Nature",    emoji: "🌿", query: "nature ambient sounds study" },
  { label: "Jazz",      emoji: "🎷", query: "smooth jazz study concentration" },
  { label: "Classical", emoji: "🎻", query: "classical music studying focus" },
  { label: "Chill",     emoji: "✨", query: "chill beats focus study music" },
];

function extractYouTubeId(raw: string): { type: "video" | "playlist"; id: string } | null {
  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    const list = url.searchParams.get("list");
    if (list) return { type: "playlist", id: list };
    if (url.hostname === "youtu.be") return { type: "video", id: url.pathname.slice(1).split("?")[0] };
    const v = url.searchParams.get("v");
    if (v) return { type: "video", id: v };
    const m = url.pathname.match(/\/embed\/([^/?]+)/);
    if (m) return { type: "video", id: m[1] };
  } catch {}
  if (/^[A-Za-z0-9_-]{11}$/.test(raw.trim())) return { type: "video", id: raw.trim() };
  return null;
}

function buildEmbedUrl(parsed: { type: "video" | "playlist"; id: string }): string {
  const base = "autoplay=1&enablejsapi=1&modestbranding=1&rel=0";
  if (parsed.type === "playlist")
    return `https://www.youtube-nocookie.com/embed/videoseries?list=${parsed.id}&${base}`;
  return `https://www.youtube-nocookie.com/embed/${parsed.id}?${base}`;
}

interface AmbientPlayerProps {
  /** Controlled open state — toggled from the sidebar music button. */
  expanded: boolean;
  onExpandedChange: (v: boolean) => void;
  /** Reports playback state up so the sidebar button can show a "playing" pulse. */
  onPlayingChange?: (playing: boolean) => void;
}

function EqualizerBars() {
  return (
    <div className="flex gap-0.5 items-end h-4 shrink-0">
      {[0.6, 1, 0.75, 0.9, 0.55].map((h, i) => (
        <motion.div
          key={i}
          className="w-0.5 rounded-full"
          style={{ height: "100%", transformOrigin: "bottom", backgroundColor: SPOTIFY_GREEN }}
          animate={{ scaleY: [h, 1, h * 0.6, 1, h] }}
          transition={{ repeat: Infinity, duration: 1.1 + i * 0.18, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

export function AmbientPlayer({ expanded, onExpandedChange, onPlayingChange }: AmbientPlayerProps) {
  const [inputUrl, setInputUrl] = useState("");
  const [activeEmbed, setActiveEmbed] = useState<{ type: "video" | "playlist"; id: string } | null>(null);
  const [volume, setVolume] = useState(50);
  const [isPlaying, setIsPlaying] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => { onPlayingChange?.(isPlaying); }, [isPlaying, onPlayingChange]);

  const postCmd = useCallback((func: string, args?: unknown[]) => {
    const msg = JSON.stringify({ event: "command", func, args: args ?? [] });
    iframeRef.current?.contentWindow?.postMessage(msg, "*");
  }, []);

  const handleLoad = useCallback(() => {
    const parsed = extractYouTubeId(inputUrl.trim());
    if (!parsed) return;
    setActiveEmbed(parsed);
    setIsPlaying(true);
  }, [inputUrl]);

  const handleIframeReady = useCallback(() => {
    setTimeout(() => postCmd("setVolume", [volume]), 1200);
  }, [postCmd, volume]);

  const togglePlay = useCallback(() => {
    if (!activeEmbed) return;
    if (isPlaying) postCmd("pauseVideo");
    else postCmd("playVideo");
    setIsPlaying(p => !p);
  }, [activeEmbed, isPlaying, postCmd]);

  const handleVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value);
    setVolume(v);
    postCmd("setVolume", [v]);
  }, [postCmd]);

  const handleStop = useCallback(() => {
    setActiveEmbed(null);
    setIsPlaying(false);
    setInputUrl("");
  }, []);

  return (
    <>
      {/* Persistent off-screen audio host — kept mounted whenever something is loaded so
          closing the popover (or switching tabs) never stops the music. */}
      {activeEmbed && (
        <div aria-hidden className="fixed left-[-9999px] top-0 w-[320px] h-[180px] pointer-events-none">
          <iframe
            key={activeEmbed.id}
            ref={iframeRef}
            src={buildEmbedUrl(activeEmbed)}
            onLoad={handleIframeReady}
            allow="autoplay; encrypted-media"
            title="Focus music audio"
            className="w-full h-full"
          />
        </div>
      )}

      {/* Floating Spotify-style popover (opens from the sidebar music button) */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed z-50 bottom-4 left-4 lg:left-20 w-[330px] max-w-[calc(100vw-2rem)]"
          >
            <div className="rounded-2xl border border-white/10 bg-[#181818] text-neutral-200 shadow-2xl overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between px-4 pt-3 pb-2">
                <div className="flex items-center gap-1.5">
                  <Music2 className="h-3.5 w-3.5 text-[#1DB954]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1DB954]">Focus Music</span>
                </div>
                <button
                  onClick={() => onExpandedChange(false)}
                  aria-label="Close player"
                  className="p-1 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              {/* Now-playing row */}
              <div className="flex items-center gap-3 px-4 pb-3">
                <div className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center shrink-0 shadow-md",
                  isPlaying
                    ? "bg-gradient-to-br from-[#1DB954] to-[#1ed760] text-black"
                    : "bg-gradient-to-br from-neutral-700 to-neutral-800 text-neutral-300",
                )}>
                  <Music2 className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">
                    {activeEmbed ? "Now playing" : "Nothing playing"}
                  </p>
                  <p className="text-[11px] text-neutral-400 truncate">
                    {isPlaying ? "Playing · keeps going when closed" : activeEmbed ? "Paused" : "Pick a vibe or paste a link"}
                  </p>
                </div>
                {isPlaying && <EqualizerBars />}
                {activeEmbed && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      aria-label={isPlaying ? "Pause" : "Play"}
                      onClick={togglePlay}
                      className="w-9 h-9 rounded-full bg-[#1DB954] text-black flex items-center justify-center hover:scale-105 transition-transform"
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                    </button>
                    <button
                      aria-label="Stop"
                      onClick={handleStop}
                      className="w-8 h-8 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Volume (only when something is loaded) */}
              {activeEmbed && (
                <div className="flex items-center gap-2.5 px-4 pb-3">
                  <VolumeX className="h-3.5 w-3.5 text-neutral-400 shrink-0" aria-hidden="true" />
                  <input
                    type="range"
                    aria-label="Volume"
                    min={0}
                    max={100}
                    value={volume}
                    onChange={handleVolume}
                    className="flex-1 h-1.5 cursor-pointer"
                    style={{ accentColor: SPOTIFY_GREEN }}
                  />
                  <Volume2 className="h-3.5 w-3.5 text-neutral-400 shrink-0" aria-hidden="true" />
                </div>
              )}

              <div className="border-t border-white/10" />

              {/* Genre quick-links */}
              <div className="px-4 pt-3">
                <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider mb-1.5">
                  Find on YouTube
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {PRESETS.map(p => (
                    <a
                      key={p.label}
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(p.query)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[10px] font-medium text-neutral-100 transition-colors"
                    >
                      <span>{p.emoji}</span>
                      {p.label}
                      <ExternalLink className="h-2.5 w-2.5 text-neutral-400" />
                    </a>
                  ))}
                </div>
              </div>

              {/* URL input */}
              <div className="flex gap-2 px-4 py-3">
                <input
                  type="text"
                  placeholder="Paste a YouTube link or video ID…"
                  value={inputUrl}
                  onChange={e => setInputUrl(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLoad()}
                  className="flex-1 h-9 px-3 text-xs rounded-full bg-white/10 border border-white/10 text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#1DB954] placeholder:text-neutral-500"
                />
                <button
                  onClick={handleLoad}
                  disabled={!inputUrl.trim()}
                  className="h-9 px-5 text-xs font-bold rounded-full bg-[#1DB954] text-black hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 transition-transform"
                >
                  Play
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
