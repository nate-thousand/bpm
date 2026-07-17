"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { gsap } from "gsap";

const DOT_COUNT = 8;

type ReadingState = "ready" | "measuring" | "stabilizing" | "locked";

function mean(values: number[]) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export default function Home() {
  const [taps, setTaps] = useState<number[]>([]);
  const [pulse, setPulse] = useState(0);
  const lastTap = useRef(0);
  const stageRef = useRef<HTMLDivElement>(null);

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
    const shouldRestart = lastTap.current > 0 && now - lastTap.current > 2500;
    setTaps((current) => {
      return shouldRestart ? [now] : [...current.slice(-7), now];
    });
    lastTap.current = now;
    setPulse((value) => (shouldRestart ? 1 : value + 1));
  }, []);

  const reset = useCallback(() => {
    setTaps([]);
    setPulse(0);
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

  const activeDot = pulse ? (pulse - 1) % DOT_COUNT : -1;
  const nextDot = pulse ? (activeDot + 1) % DOT_COUNT : 0;

  useLayoutEffect(() => {
    if (!pulse || !stageRef.current) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const context = gsap.context(() => {
      const record = ".record";
      const rings = gsap.utils.toArray<HTMLElement>(".impact-ring");
      const spindle = ".spindle";
      const bpmReading = ".bpm";
      const flash = ".feedback-flash";
      const currentTap = ".timing-dot.is-tap";
      const nextBeat = ".timing-dot.is-next";

      if (reduceMotion) {
        gsap.fromTo(
          [record, currentTap],
          { opacity: 0.68 },
          { opacity: 1, duration: 0.08, overwrite: true },
        );
        return;
      }

      const isLocked = readingState === "locked";
      const timeline = gsap.timeline({
        defaults: { overwrite: "auto", force3D: true },
      });

      timeline
        .fromTo(
          record,
          { scale: isLocked ? 0.978 : 0.94 },
          {
            scale: 1,
            duration: isLocked ? 0.22 : 0.3,
            ease: isLocked ? "power3.out" : "back.out(2.5)",
          },
          0,
        )
        .fromTo(
          spindle,
          { scale: 0.78, rotation: -9 },
          {
            scale: 1,
            rotation: 0,
            duration: 0.28,
            ease: "back.out(3)",
          },
          0.01,
        )
        .fromTo(
          rings,
          { scale: 0.78, autoAlpha: 0.72 },
          {
            scale: isLocked ? 1.18 : 1.42,
            autoAlpha: 0,
            duration: isLocked ? 0.34 : 0.52,
            stagger: 0.045,
            ease: "power3.out",
          },
          0,
        )
        .fromTo(
          flash,
          { scale: 0.72, autoAlpha: 0.16 },
          {
            scale: 1.25,
            autoAlpha: 0,
            duration: 0.36,
            ease: "power2.out",
          },
          0,
        )
        .fromTo(
          bpmReading,
          { scale: 0.96, y: 3 },
          { scale: 1, y: 0, duration: 0.24, ease: "power3.out" },
          0.04,
        )
        .fromTo(
          currentTap,
          { scale: 0.24 },
          { scale: 1, duration: 0.24, ease: "back.out(3.2)" },
          0,
        )
        .fromTo(
          nextBeat,
          { scale: 0.72, opacity: 0.45 },
          { scale: 1, opacity: 1, duration: 0.28, ease: "power2.out" },
          0.08,
        );
    }, stageRef);

    return () => context.revert();
  }, [pulse, readingState]);

  useLayoutEffect(() => {
    if (!stageRef.current || readingState === "ready") return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) return;

    const context = gsap.context(() => {
      gsap.fromTo(
        ".state",
        { y: -5, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.24, ease: "power2.out" },
      );
    }, stageRef);
    return () => context.revert();
  }, [readingState]);

  return (
    <main className="prototype-shell">
      <section className="phone" aria-label="Signal-9-Live animation prototype">
        <div
          ref={stageRef}
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
            <span className="feedback-flash" aria-hidden="true" />
            <span className={`state state-${readingState}`}>
              {readingState}
            </span>
            <div className={`record record-${readingState}`}>
              <span className="impact-ring impact-ring-a" aria-hidden="true" />
              <span className="impact-ring impact-ring-b" aria-hidden="true" />
              <span className="impact-ring impact-ring-c" aria-hidden="true" />
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
              <span>{pulse ? `step ${activeDot + 1} / ${DOT_COUNT}` : "waiting"}</span>
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
