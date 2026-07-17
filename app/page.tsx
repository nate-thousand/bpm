"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DOT_COUNT = 8;

type ReadingState = "ready" | "measuring" | "stabilizing" | "locked";

function mean(values: number[]) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export default function Home() {
  const [taps, setTaps] = useState<number[]>([]);
  const [pulse, setPulse] = useState(0);
  const lastTap = useRef(0);

  const intervals = useMemo(
    () => taps.slice(1).map((tap, index) => tap - taps[index]),
    [taps],
  );

  const bpm = useMemo(() => {
    if (!intervals.length) return null;
    const recent = intervals.slice(-6);
    const raw = Math.round(60000 / mean(recent));
    return Math.max(30, Math.min(240, raw));
  }, [intervals]);

  const consistency = useMemo(() => {
    if (intervals.length < 3) return 0;
    const recent = intervals.slice(-6);
    const average = mean(recent);
    const averageDeviation = mean(
      recent.map((interval) => Math.abs(interval - average)),
    );
    return Math.max(0, 1 - averageDeviation / average);
  }, [intervals]);

  const readingState: ReadingState =
    taps.length === 0
      ? "ready"
      : taps.length < 3
        ? "measuring"
        : taps.length < 6 || consistency < 0.93
          ? "stabilizing"
          : "locked";

  const display =
    taps.length === 0
      ? "—"
      : taps.length === 1
        ? "1XX"
        : taps.length === 2
          ? bpm
            ? `${String(bpm).slice(0, 2)}X`
            : "12X"
          : bpm;

  const registerTap = useCallback(() => {
    const now = performance.now();
    setTaps((current) => {
      const shouldRestart =
        current.length > 0 && now - current[current.length - 1] > 2500;
      return shouldRestart ? [now] : [...current.slice(-7), now];
    });
    lastTap.current = now;
    setPulse((value) => value + 1);
  }, []);

  const reset = useCallback(() => {
    setTaps([]);
    lastTap.current = 0;
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        registerTap();
      }
      if (event.code === "Escape") reset();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [registerTap, reset]);

  const activeDot = taps.length ? (taps.length - 1) % DOT_COUNT : -1;
  const nextDot = taps.length ? (activeDot + 1) % DOT_COUNT : 0;

  return (
    <main className="prototype-shell">
      <section className="phone" aria-label="Signal-9-Live animation prototype">
        <div
          className="tap-stage"
          onPointerDown={(event) => {
            if ((event.target as HTMLElement).closest("button")) return;
            registerTap();
          }}
        >
          <header className="app-header">
            <span className="brand">Signal-9-Live</span>
            <button className="reset" type="button" onClick={reset}>
              Reset
            </button>
          </header>

          <div className="reading" aria-live="polite">
            <span className={`state state-${readingState}`}>
              {readingState}
            </span>
            <div className={`record record-${readingState}`}>
              <span key={pulse} className="tap-pulse" aria-hidden="true" />
              <span className="spindle" aria-hidden="true" />
            </div>
            <div className={`bpm bpm-${readingState}`}>
              <span>{display}</span>
              <small>BPM</small>
            </div>
          </div>

          <section className="timing" aria-label="Tap timing sequence">
            <div className="timing-meta">
              <span>Timing taps</span>
              <span>{taps.length ? `${Math.min(taps.length, 8)} taps` : "waiting"}</span>
            </div>
            <div className="timing-line" aria-hidden="true">
              {Array.from({ length: DOT_COUNT }, (_, index) => (
                <span
                  key={index}
                  className={`timing-dot ${index === activeDot ? "is-tap" : ""} ${
                    index === nextDot ? "is-next" : ""
                  }`}
                />
              ))}
            </div>
            <div className="timing-legend">
              <span><i className="legend-tap" />last tap</span>
              <span><i className="legend-next" />next beat</span>
            </div>
          </section>

          <footer className="instruction">
            <strong>Tap anywhere</strong>
            <span>or press spacebar</span>
          </footer>
        </div>
      </section>
      <p className="desktop-note">Touch the frame or press spacebar</p>
    </main>
  );
}
