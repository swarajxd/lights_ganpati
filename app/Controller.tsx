/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type State = {
  id: number;
  device_id: string;
  mode: "manual" | "wave";
  led1: number;
  led2: number;
  led3: number;
  led4: number;
  led5: number;
  led6: number;
  led7: number;
  speed1: number;
  speed2: number;
  speed3: number;
  speed4: number;
  speed5: number;
  speed6: number;
  speed7: number;
};

const LED_NAMES = ["LED 1", "LED 2", "LED 3", "LED 4", "LED 5", "LED 6", "LED 7"];

function PowerIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v8" />
      <path d="M7.05 5.75a9 9 0 1 0 9.9 0" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" />
    </svg>
  );
}

function WaveIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 12c3-8 6 8 9 0s6-8 9 0" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
      <path d="m19 13.5 1.2 1-.9 1.6-1.5-.5a7.4 7.4 0 0 1-1.5 1.2l.2 1.6-1.8.5-.8-1.4a7.6 7.6 0 0 1-1.9.2l-.8 1.4-1.8-.5.2-1.6a7.4 7.4 0 0 1-1.5-1.2l-1.5.5-.9-1.6 1.2-1a7.4 7.4 0 0 1 0-2l-1.2-1 .9-1.6 1.5.5a7.4 7.4 0 0 1 1.5-1.2L10 6.6 11.8 6l.8 1.4a7.6 7.6 0 0 1 1.9 0l.8-1.4 1.8.6-.2 1.6a7.4 7.4 0 0 1 1.5 1.2l1.5-.5.9 1.6-1.2 1a7.4 7.4 0 0 1 0 2Z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 4.5v15l14-7.5-14-7.5Z" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6" y="6" width="12" height="12" rx="2.5" />
    </svg>
  );
}

// 🎵 ============================================================
// 🎇 GANPATI LIGHT SHOW — CUE SHEET 🎇
// ============================================================
// This is the ONLY place you need to edit to change when a light
// turns on or off during the audio show. Nothing else in the
// file needs to change.
//
// Each entry = one on/off event for one LED.
//   led    -> which light, 1 to 7
//   onAt   -> second in the song when it turns ON  (mm:ss -> seconds)
//   offAt  -> second in the song when it turns OFF
//             use `null` if it should just STAY ON for the
//             rest of the show (used for the finale below) 🌟
//
// Reminder: mm:ss -> seconds is (minutes * 60) + seconds.
// Example: 1:12 -> (1 * 60) + 12 = 72
// ============================================================

type ShowCue = {
  led: number;
  onAt: number;
  offAt: number | null;
};

const SHOW_CUES: ShowCue[] = [
  // 🕯️ Intro — LED 7 opens the show
  { led: 7, onAt: 0, offAt: 49 }, // 0:00 -> 0:49

  // ✨ Running sequence — one light at a time
  { led: 1, onAt: 72, offAt: 82.5 }, // 1:12 -> 1:22.5
  { led: 2, onAt: 82.5, offAt: 93 }, // 1:22.5 -> 1:33
  { led: 3, onAt: 96.5, offAt: 105 }, // 1:36.5 -> 1:45
  { led: 4, onAt: 105, offAt: 115 }, // 1:45 -> 1:55
  { led: 5, onAt: 119, offAt: 127 }, // 1:59 -> 2:07 (shifted 1s earlier)
  { led: 6, onAt: 128, offAt: 138 }, // 2:08 -> 2:18

  // 🌟 Finale part 1 — everything except LED 7 turns on and stays on
  { led: 1, onAt: 142, offAt: null }, // 2:22 -> stays on
  { led: 2, onAt: 142, offAt: null }, // 2:22 -> stays on
  { led: 3, onAt: 142, offAt: null }, // 2:22 -> stays on
  { led: 4, onAt: 142, offAt: null }, // 2:22 -> stays on
  { led: 5, onAt: 142, offAt: null }, // 2:22 -> stays on
  { led: 6, onAt: 142, offAt: null }, // 2:22 -> stays on

  // 🎆 Finale part 2 — LED 7 joins in, everything stays on together
  { led: 7, onAt: 152, offAt: null } // 2:32 -> stays on
];
// ============================================================
// 🎇 END OF CUE SHEET — don't need to touch anything below 🎇
// ============================================================

// Given a point in time (seconds), work out which LEDs should be
// ON right now according to the cue sheet above.
function desiredStateAt(seconds: number): number[] {
  const result = [0, 0, 0, 0, 0, 0, 0];
  for (const cue of SHOW_CUES) {
    const isOn = seconds >= cue.onAt && (cue.offAt === null || seconds < cue.offAt);
    if (isOn) {
      result[cue.led - 1] = 100;
    }
  }
  return result;
}

function formatTime(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) ? totalSeconds : 0;
  const m = Math.floor(safe / 60);
  const s = Math.floor(safe % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Controller() {
  const [state, setState] = useState<State | null>(null);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<"manual" | "wave">("manual");
  const [loginUser, setLoginUser] = useState("admin");
  const [loginPass, setLoginPass] = useState("");

  // ------- Show playback state -------
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSentRef = useRef<number[] | null>(null);
  const rafRef = useRef<number | null>(null);
  const [isShowPlaying, setIsShowPlaying] = useState(false);
  const [showElapsed, setShowElapsed] = useState(0);

  const brightness = useMemo(
    () =>
      state
        ? [state.led1, state.led2, state.led3, state.led4, state.led5, state.led6, state.led7]
        : [0, 0, 0, 0, 0, 0, 0],
    [state]
  );

  const speeds = useMemo(
    () =>
      state
        ? [state.speed1, state.speed2, state.speed3, state.speed4, state.speed5, state.speed6, state.speed7]
        : [5000, 5000, 5000, 5000, 5000, 5000, 5000],
    [state]
  );

  async function loadState() {
    const res = await fetch("/api/state", { cache: "no-store" });
    if (res.status === 401) {
      setLoggedIn(false);
      return;
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not load state");
    setState(data.state);
    setLoggedIn(true);
    setActiveTab(data.state.mode === "wave" ? "wave" : "manual");
  }

  useEffect(() => {
    loadState().catch((e) => setError(e.message));
  }, []);

  // Clean up the animation frame loop if the component unmounts
  // while the show is playing.
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUser, password: loginPass })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      setLoginPass("");
      await loadState();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setLoggedIn(false);
    setState(null);
  }

  async function update(patch: Partial<State>) {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/state", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      });
      const data = await res.json();
      if (res.status === 401) {
        setLoggedIn(false);
        return;
      }
      if (!res.ok) throw new Error(data.error || "Update failed");
      setState(data.state);
      if (data.state.mode === "wave") setActiveTab("wave");
      else setActiveTab("manual");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  // ------- Show playback engine -------
  // Runs once per animation frame while the show is playing:
  // reads the audio's current playback position, works out which
  // LEDs should be on/off right now, and only sends an update
  // when something actually needs to change.
  function tickShow() {
    const audio = audioRef.current;
    if (!audio) return;

    setShowElapsed(audio.currentTime);

    const desired = desiredStateAt(audio.currentTime);
    const last = lastSentRef.current;
    const changed = !last || desired.some((v, i) => v !== last[i]);

    if (changed) {
      const patch: Record<string, number> = {};
      desired.forEach((value, index) => {
        if (!last || value !== last[index]) {
          patch[`led${index + 1}`] = value;
        }
      });
      lastSentRef.current = desired;
      update(patch as Partial<State>);
    }

    rafRef.current = requestAnimationFrame(tickShow);
  }

  async function startShow() {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    lastSentRef.current = null;

    // Make sure the ESP32 is reading direct LED values, not wave mode.
    await update({ mode: "manual" });

    try {
      await audio.play();
    } catch (e: any) {
      setError("Could not start audio: " + e.message);
      return;
    }

    setIsShowPlaying(true);
    rafRef.current = requestAnimationFrame(tickShow);
  }

  function stopShow() {
    const audio = audioRef.current;
    if (audio) audio.pause();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setIsShowPlaying(false);
    // Lights are intentionally left exactly as they were -
    // they only change again once manual or wave mode is used.
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    function onEnded() {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setIsShowPlaying(false);
      // Audio finished - lights stay exactly as the last cue left
      // them until manual or wave mode changes them again.
    }

    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, []);

  if (loggedIn === null) {
    return <div className="loading">Connecting to controller…</div>;
  }

  if (!loggedIn) {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <div className="brand-mark"><SunIcon /></div>
          <p className="eyebrow">SMART LIGHTING</p>
          <h1>Welcome back</h1>
          <p className="muted">Sign in to control your ESP32 lights.</p>

          <form onSubmit={login}>
            <label>
              Username
              <input
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                autoComplete="username"
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                autoComplete="current-password"
              />
            </label>

            {error && <div className="error">{error}</div>}

            <button className="primary full" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  if (!state) return <div className="loading">Loading controller…</div>;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">LIVING ROOM</p>
          <h1>Light Control</h1>
        </div>
        <button className="icon-button" onClick={logout} title="Log out">
          <PowerIcon />
        </button>
      </header>

      <section className="hero-card">
        <div className="hero-top">
          <div>
            <span className="status-dot" />
            <span>
              {isShowPlaying
                ? "Show is running"
                : state.mode === "wave"
                ? "Wave is running"
                : "Lights ready"}
            </span>
          </div>
          <span className="device-label">{state.device_id}</span>
        </div>
        <div className="hero-caption" style={{ marginTop: 10 }}>
          Tap a light below to turn it on or off.
        </div>
      </section>

      <div className="tabs">
        <button
          className={activeTab === "manual" ? "tab active" : "tab"}
          onClick={() => update({ mode: "manual" })}
        >
          <SunIcon /> Manual
        </button>
        <button
          className={activeTab === "wave" ? "tab active" : "tab"}
          onClick={() => update({ mode: "wave" })}
        >
          <WaveIcon /> Wave
        </button>
        <button className="tab" onClick={() => update({ mode: "manual" })}>
          <PowerIcon /> Stop
        </button>
      </div>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">INDIVIDUAL CONTROL</p>
            <h2>Tap a light to toggle it</h2>
          </div>
          <span className="small-status">{busy ? "Updating…" : "Synced"}</span>
        </div>

        <div className="led-grid">
          {LED_NAMES.map((name, index) => {
            const on = brightness[index] > 0;
            return (
              <button
                key={name}
                className={`led-card ${on ? "selected" : ""}`}
                onClick={() => {
                  const key = `led${index + 1}` as keyof State;
                  update({ [key]: on ? 0 : 100, mode: "manual" } as Partial<State>);
                }}
              >
                <span className={`led-bulb ${on ? "on" : ""}`} />
                <span className="led-name">{name}</span>
                <span className="led-value">{on ? "ON" : "OFF"}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">WAVE SETTINGS</p>
            <h2>Fade speed</h2>
          </div>
          <span className="small-status">Per LED</span>
        </div>

        <div className="speed-list">
          {LED_NAMES.map((name, index) => (
            <div className="speed-row" key={name}>
              <div className="speed-name">
                <span className={`mini-bulb ${brightness[index] > 0 ? "on" : ""}`} />
                <span>{name}</span>
              </div>
              <input
                className="range"
                type="range"
                min="500"
                max="5000"
                step="100"
                value={speeds[index]}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  const key = `speed${index + 1}` as keyof State;
                  setState({ ...state, [key]: value });
                }}
                onMouseUp={(e) => {
                  const value = Number((e.target as HTMLInputElement).value);
                  update({ [`speed${index + 1}`]: value } as Partial<State>);
                }}
              />
              <span className="speed-value">{(speeds[index] / 1000).toFixed(1)}s</span>
            </div>
          ))}
        </div>
      </section>

      {/* 🎇 ============================================================
          GANPATI LIGHT SHOW PANEL
          To change WHEN a light turns on/off during the show, edit the
          SHOW_CUES list near the top of this file - nothing here needs
          to change.
          ============================================================ */}
      <section className="panel show-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">GANPATI LIGHT SHOW</p>
            <h2>Music-synced sequence</h2>
          </div>
          <span className="small-status">{isShowPlaying ? "Playing…" : "Stopped"}</span>
        </div>

        <audio ref={audioRef} src="/ganpati_audio.mp3" preload="auto" />

        <div className="show-controls">
          <button
            className="primary full"
            onClick={isShowPlaying ? stopShow : startShow}
          >
            {isShowPlaying ? (
              <>
                <StopIcon /> Stop show
              </>
            ) : (
              <>
                <PlayIcon /> Play show
              </>
            )}
          </button>
          <div className="show-time">{formatTime(showElapsed)}</div>
        </div>

        <p className="muted show-hint">
          🔊 Connect this device to your Bluetooth speaker first, then press
          Play — the audio and the lights follow the same timeline. When the
          audio ends, the lights stay exactly as they are until you switch to
          Manual or Wave mode. 🎶
        </p>
      </section>

      {error && <div className="error bottom-error">{error}</div>}

      <footer>
        <GearIcon />
        ESP32 cloud controller · 7 channels
      </footer>
    </main>
  );
}
