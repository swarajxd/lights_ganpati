/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";

type State = {
  id: number;
  device_id: string;
  mode: "manual" | "wave";
  led1: number;
  led2: number;
  led3: number;
  led4: number;
  led5: number;
  speed1: number;
  speed2: number;
  speed3: number;
  speed4: number;
  speed5: number;
};

const LED_NAMES = ["LED 1", "LED 2", "LED 3", "LED 4", "LED 5"];

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

export default function Controller() {
  const [state, setState] = useState<State | null>(null);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<"manual" | "wave">("manual");
  const [selectedLed, setSelectedLed] = useState(0);
  const [loginUser, setLoginUser] = useState("admin");
  const [loginPass, setLoginPass] = useState("");

  const brightness = useMemo(
    () =>
      state
        ? [state.led1, state.led2, state.led3, state.led4, state.led5]
        : [0, 0, 0, 0, 0],
    [state]
  );

  const speeds = useMemo(
    () =>
      state
        ? [state.speed1, state.speed2, state.speed3, state.speed4, state.speed5]
        : [2000, 1500, 3000, 1000, 2000],
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

  const current = brightness[selectedLed];

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
            <span>{state.mode === "wave" ? "Wave is running" : "Lights ready"}</span>
          </div>
          <span className="device-label">{state.device_id}</span>
        </div>

        <div className="hero-number">{Math.round((current / 80) * 100)}%</div>
        <div className="hero-caption">{LED_NAMES[selectedLed]} brightness</div>

        <input
          className="range hero-range"
          type="range"
          min="0"
          max="80"
          value={current}
          onChange={(e) => {
            const value = Number(e.target.value);
            const key = `led${selectedLed + 1}` as keyof State;
            setState({ ...state, [key]: value });
          }}
          onMouseUp={(e) => {
            const value = Number((e.target as HTMLInputElement).value);
            update({ [`led${selectedLed + 1}`]: value } as Partial<State>);
          }}
          onTouchEnd={(e) => {
            const value = Number((e.target as HTMLInputElement).value);
            update({ [`led${selectedLed + 1}`]: value } as Partial<State>);
          }}
        />

        <div className="range-labels"><span>0%</span><span>100%</span></div>
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
        <button
          className={activeTab === "wave" ? "tab" : "tab"}
          onClick={() => update({ mode: "manual" })}
        >
          <PowerIcon /> Stop
        </button>
      </div>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">INDIVIDUAL CONTROL</p>
            <h2>Choose a light</h2>
          </div>
          <span className="small-status">{busy ? "Updating…" : "Synced"}</span>
        </div>

        <div className="led-grid">
          {LED_NAMES.map((name, index) => (
            <button
              key={name}
              className={`led-card ${selectedLed === index ? "selected" : ""}`}
              onClick={() => {
                setSelectedLed(index);
                update({ mode: "manual" });
              }}
            >
              <span className={`led-bulb ${brightness[index] > 0 ? "on" : ""}`} />
              <span className="led-name">{name}</span>
              <span className="led-value">{Math.round((brightness[index] / 80) * 100)}%</span>
            </button>
          ))}
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

      {error && <div className="error bottom-error">{error}</div>}

      <footer>
        <GearIcon />
        ESP32 cloud controller · 5 channels
      </footer>
    </main>
  );
}
