"use client";

import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { gsap } from "gsap";

const DOT_COUNT = 8;
const TOUCH_FEEDBACK_COUNT = 3;
const THEME_ORDER = [
  "white",
  "black",
  "orange-dark",
  "orange-light",
] as const;

type ReadingState = "ready" | "measuring" | "stabilizing" | "locked";
type ScreenState = "start" | "first" | "taps" | "taps2" | "result";
type Theme = (typeof THEME_ORDER)[number];
type TapFeedbackInput = {
  clientX: number;
  clientY: number;
  pointerType: string;
};
type TempoMotionProfile = {
  durationScale: number;
  spaciousness: number;
  contactScaleTouch: number;
  contactScalePointer: number;
  recordScaleTouch: number;
  recordScalePointer: number;
  ringScaleTouch: number;
  ringScalePointer: number;
  flashScaleTouch: number;
  flashScalePointer: number;
  ringStagger: number;
};

const THEME_LABELS: Record<Theme, string> = {
  white: "white",
  black: "black",
  "orange-dark": "orange on black",
  "orange-light": "orange on white",
};

const RESULT_NODE_IDS: Record<
  Theme,
  { stage: string; controls: string; theme: string; reset: string }
> = {
  white: {
    stage: "86:816",
    controls: "86:826",
    theme: "86:827",
    reset: "86:828",
  },
  black: {
    stage: "86:531",
    controls: "86:541",
    theme: "86:542",
    reset: "86:543",
  },
  "orange-dark": {
    stage: "86:919",
    controls: "86:929",
    theme: "86:930",
    reset: "86:931",
  },
  "orange-light": {
    stage: "86:1022",
    controls: "86:1032",
    theme: "86:1033",
    reset: "86:1034",
  },
};

function getNextTheme(theme: Theme): Theme {
  const currentIndex = THEME_ORDER.indexOf(theme);
  return THEME_ORDER[(currentIndex + 1) % THEME_ORDER.length];
}

function ThemeIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0ZM8 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13ZM16 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5ZM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8ZM13.657 2.343a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 0 1-.708-.708l1.415-1.414a.5.5 0 0 1 .707 0ZM4.464 11.536a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0ZM13.657 13.657a.5.5 0 0 1-.707 0l-1.415-1.414a.5.5 0 0 1 .708-.707l1.414 1.414a.5.5 0 0 1 0 .707ZM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708Z" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 16 13.4334" aria-hidden="true">
      <path d="M11 4.183V2.717H5a4 4 0 0 0-3.584 5.777.5.5 0 1 1-.896.445A5 5 0 0 1 5 1.717h6V.25c0-.212.247-.327.41-.192l2.36 1.967a.25.25 0 0 1 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192Z" />
      <path d="M14.81 4.269a.5.5 0 0 1 .67.225A5 5 0 0 1 11 11.717H5v1.466a.25.25 0 0 1-.41.192l-2.36-1.966a.25.25 0 0 1 0-.384l2.36-1.967A.25.25 0 0 1 5 9.25v1.467h6a4 4 0 0 0 3.584-5.778.5.5 0 0 1 .226-.67Z" />
    </svg>
  );
}

function mean(values: number[]) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function getTempoMotionProfile(intervalMs: number | null): TempoMotionProfile {
  const effectiveInterval = intervalMs ?? 650;
  const clampedInterval = Math.min(1200, Math.max(250, effectiveInterval));
  const spaciousness = (clampedInterval - 250) / 950;

  return {
    durationScale: 0.78 + spaciousness * 0.42,
    spaciousness,
    contactScaleTouch: 1.52 + spaciousness * 0.44,
    contactScalePointer: 1.36 + spaciousness * 0.34,
    recordScaleTouch: 0.85 - spaciousness * 0.05,
    recordScalePointer: 0.89 - spaciousness * 0.04,
    ringScaleTouch: 1.5 + spaciousness * 0.4,
    ringScalePointer: 1.42 + spaciousness * 0.3,
    flashScaleTouch: 1.5 + spaciousness * 0.38,
    flashScalePointer: 1.4 + spaciousness * 0.28,
    ringStagger: 0.026 + spaciousness * 0.036,
  };
}

export default function Home() {
  const [taps, setTaps] = useState<number[]>([]);
  const [pulse, setPulse] = useState(0);
  const [theme, setTheme] = useState<Theme>("black");
  const lastTap = useRef(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const recordRef = useRef<HTMLDivElement>(null);
  const spindleRef = useRef<HTMLSpanElement>(null);
  const flashRef = useRef<HTMLSpanElement>(null);
  const ringRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const contactRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const contactIndexRef = useRef(0);
  const tapDirectionRef = useRef(1);
  const tempoIntervalRef = useRef<number | null>(null);
  const bpmRef = useRef<HTMLDivElement>(null);
  const timingRef = useRef<HTMLElement>(null);
  const timingDotRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const resetRef = useRef<HTMLButtonElement>(null);
  const tapTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const previousScreenRef = useRef<ScreenState>("start");

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

  const screenState: ScreenState =
    taps.length === 0
      ? "start"
      : taps.length === 1
        ? "first"
        : readingState === "locked"
          ? "result"
          : taps.length >= 4
            ? "taps2"
            : "taps";
  const displayText =
    screenState === "start" || screenState === "first"
      ? "BPM"
      : screenState === "taps"
        ? "1XX"
        : screenState === "taps2"
          ? "12X"
        : screenState === "result"
          ? String(bpm ?? "—")
          : "";

  const playTapFeedback = useCallback((
    input?: TapFeedbackInput,
    tempoInterval: number | null = null,
  ) => {
    const stage = stageRef.current;
    const record = recordRef.current;
    const spindle = spindleRef.current;
    const flash = flashRef.current;
    const rings = ringRefs.current.filter(
      (ring): ring is HTMLSpanElement => Boolean(ring),
    );
    const targets = [record, spindle, flash, ...rings].filter(
      (target): target is HTMLElement => Boolean(target),
    );

    if (!record || !targets.length) return;

    tapTimelineRef.current?.kill();
    gsap.killTweensOf(targets);
    gsap.set(targets, {
      clearProps: "transform,opacity,visibility,willChange",
    });

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) {
      gsap.fromTo(
        record,
        { opacity: 0.72 },
        {
          opacity: 1,
          duration: 0.08,
          overwrite: true,
          onComplete: () => gsap.set(record, { clearProps: "opacity" }),
        },
      );
      return;
    }

    const motion = getTempoMotionProfile(tempoInterval);
    const tempoTime = (seconds: number) => seconds * motion.durationScale;

    if (input && stage) {
      const contact =
        contactRefs.current[
          contactIndexRef.current % TOUCH_FEEDBACK_COUNT
        ];
      contactIndexRef.current += 1;

      if (contact) {
        const stageBounds = stage.getBoundingClientRect();
        gsap.killTweensOf(contact);
        gsap.set(contact, {
          x: input.clientX - stageBounds.left,
          y: input.clientY - stageBounds.top,
          xPercent: -50,
          yPercent: -50,
          scale: 0.12,
          autoAlpha: 0.72,
          willChange: "transform, opacity",
        });
        gsap.to(contact, {
          scale:
            input.pointerType === "touch"
              ? motion.contactScaleTouch
              : motion.contactScalePointer,
          autoAlpha: 0,
          duration: tempoTime(0.46),
          ease: "power3.out",
          force3D: true,
          overwrite: true,
          onComplete: () =>
            gsap.set(contact, {
              clearProps:
                "transform,opacity,visibility,willChange",
            }),
        });
      }
    }

    gsap.set(targets, { willChange: "transform, opacity" });

    const isTouch = input?.pointerType === "touch";
    const direction = tapDirectionRef.current;
    tapDirectionRef.current *= -1;
    const timeline = gsap.timeline({
      defaults: { overwrite: "auto", force3D: true },
      onComplete: () => {
        gsap.set(targets, {
          clearProps: "transform,opacity,visibility,willChange",
        });
        tapTimelineRef.current = null;
      },
    });

    timeline
      .fromTo(
        record,
        {
          scale: isTouch
            ? motion.recordScaleTouch
            : motion.recordScalePointer,
        },
        {
          scale: 1.035 + motion.spaciousness * 0.03,
          duration: tempoTime(0.105),
          ease: "power4.out",
        },
        0,
      )
      .to(
        record,
        {
          scale: 0.982,
          duration: tempoTime(0.075),
          ease: "power2.inOut",
        },
        tempoTime(0.105),
      )
      .to(
        record,
        {
          scale: 1,
          duration: tempoTime(0.2),
          ease: "elastic.out(1, 0.48)",
        },
        tempoTime(0.18),
      )
      .fromTo(
        spindle,
        {
          scale: isTouch
            ? 0.34 - motion.spaciousness * 0.08
            : 0.44 - motion.spaciousness * 0.08,
          rotation: direction * (14 + motion.spaciousness * 10),
        },
        {
          scale: 1.14 + motion.spaciousness * 0.08,
          rotation: direction * (-3 - motion.spaciousness * 3),
          duration: tempoTime(0.13),
          ease: "power4.out",
        },
        tempoTime(0.006),
      )
      .to(
        spindle,
        {
          scale: 1,
          rotation: 0,
          duration: tempoTime(0.24),
          ease: "elastic.out(1, 0.42)",
        },
        tempoTime(0.136),
      )
      .fromTo(
        rings,
        {
          scale: isTouch
            ? 0.6 - motion.spaciousness * 0.1
            : 0.68 - motion.spaciousness * 0.08,
          autoAlpha: 0.96,
        },
        {
          scale: isTouch
            ? motion.ringScaleTouch
            : motion.ringScalePointer,
          autoAlpha: 0,
          duration: tempoTime(0.58),
          stagger: motion.ringStagger,
          ease: "power3.out",
        },
        0,
      )
      .fromTo(
        flash,
        {
          scale: isTouch
            ? 0.44 - motion.spaciousness * 0.08
            : 0.52 - motion.spaciousness * 0.06,
          autoAlpha: isTouch
            ? 0.48 + motion.spaciousness * 0.08
            : 0.36 + motion.spaciousness * 0.06,
        },
        {
          scale: isTouch
            ? motion.flashScaleTouch
            : motion.flashScalePointer,
          autoAlpha: 0,
          duration: tempoTime(0.52),
          ease: "power3.out",
        },
        0,
      );

    tapTimelineRef.current = timeline;
  }, []);

  const registerTap = useCallback((input?: TapFeedbackInput) => {
    const now = performance.now();
    const currentInterval =
      lastTap.current > 0 ? now - lastTap.current : null;
    const shouldRestart = currentInterval !== null && currentInterval > 2500;

    if (currentInterval === null || shouldRestart) {
      tempoIntervalRef.current = null;
    } else {
      tempoIntervalRef.current =
        tempoIntervalRef.current === null
          ? currentInterval
          : tempoIntervalRef.current * 0.58 + currentInterval * 0.42;
    }

    playTapFeedback(input, tempoIntervalRef.current);
    setTaps((current) => {
      return shouldRestart ? [now] : [...current.slice(-7), now];
    });
    lastTap.current = now;
    setPulse((value) => (shouldRestart ? 1 : value + 1));
  }, [playTapFeedback]);

  const handleStagePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const isPrimaryMouseButton =
        event.pointerType !== "mouse" || event.button === 0;

      if (!event.isPrimary || !isPrimaryMouseButton) return;

      event.preventDefault();
      if (
        event.pointerType === "touch" &&
        typeof navigator.vibrate === "function"
      ) {
        navigator.vibrate(6);
      }
      registerTap({
        clientX: event.clientX,
        clientY: event.clientY,
        pointerType: event.pointerType,
      });
    },
    [registerTap],
  );

  const reset = useCallback(() => {
    tapTimelineRef.current?.kill();
    tapTimelineRef.current = null;
    const tapTargets = [
      recordRef.current,
      spindleRef.current,
      flashRef.current,
      ...ringRefs.current,
      ...contactRefs.current,
    ].filter((target): target is HTMLElement => Boolean(target));
    gsap.killTweensOf(tapTargets);
    gsap.set(tapTargets, {
      clearProps: "transform,opacity,visibility,willChange",
    });
    setTaps([]);
    setPulse(0);
    lastTap.current = 0;
    contactIndexRef.current = 0;
    tapDirectionRef.current = 1;
    tempoIntervalRef.current = null;
  }, []);

  const cycleTheme = useCallback(() => {
    setTheme((current) => getNextTheme(current));
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const target = event.target as HTMLElement | null;
      const isInteractive = target?.closest(
        "button, a, input, textarea, select, [contenteditable='true']",
      );
      if (event.code === "Space") {
        if (isInteractive) return;
        event.preventDefault();
        registerTap();
      }
      if (event.code === "Escape") reset();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [registerTap, reset]);

  const activeDot = pulse ? pulse % DOT_COUNT : -1;
  const nextDot = pulse ? (activeDot + 1) % DOT_COUNT : 0;
  const trailLength = Math.min(4, pulse);

  useLayoutEffect(() => {
    if (!pulse) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const currentTap = timingDotRefs.current[activeDot];
    const nextBeat = timingDotRefs.current[nextDot];
    const newestTrail =
      timingDotRefs.current[(activeDot - 1 + DOT_COUNT) % DOT_COUNT];
    const bpmReading = bpmRef.current;
    const targets = [currentTap, nextBeat, newestTrail, bpmReading].filter(
      (target): target is HTMLElement => Boolean(target),
    );

    if (!targets.length) return;

    if (reduceMotion) {
      if (currentTap) {
        gsap.fromTo(
          currentTap,
          { opacity: 0.68 },
          { opacity: 1, duration: 0.08, overwrite: true },
        );
      }
      return;
    }

    const motion = getTempoMotionProfile(tempoIntervalRef.current);
    const tempoTime = (seconds: number) => seconds * motion.durationScale;

    gsap.set(targets, { willChange: "transform, opacity" });
    const timeline = gsap.timeline({
      defaults: { overwrite: "auto", force3D: true },
      onComplete: () =>
        gsap.set(targets, {
          clearProps: "transform,opacity,visibility,willChange",
        }),
    });

    if (currentTap) {
      timeline.fromTo(
        currentTap,
        {
          scale: 0.24 - motion.spaciousness * 0.16,
          autoAlpha: 0.42,
        },
        {
          scale: 1.12 + motion.spaciousness * 0.1,
          autoAlpha: 1,
          duration: tempoTime(0.13),
          ease: "back.out(4.4)",
        },
        0,
      );
      timeline.to(
        currentTap,
        {
          scale: 1,
          duration: tempoTime(0.14),
          ease: "power2.out",
        },
        tempoTime(0.13),
      );
    }
    if (newestTrail) {
      timeline.fromTo(
        newestTrail,
        {
          scale: 1.24 + motion.spaciousness * 0.14,
          autoAlpha: 1,
        },
        {
          scale: 1,
          autoAlpha: 1,
          duration: tempoTime(0.24),
          ease: "power3.out",
        },
        0,
      );
    }
    if (nextBeat) {
      timeline.fromTo(
        nextBeat,
        {
          scale: 0.7 - motion.spaciousness * 0.1,
          autoAlpha: 0.5,
        },
        {
          scale: 1,
          autoAlpha: 1,
          duration: tempoTime(0.3),
          ease: "back.out(2.4)",
        },
        tempoTime(0.07),
      );
    }
    if (bpmReading) {
      timeline.fromTo(
        bpmReading,
        {
          scale: 0.95 - motion.spaciousness * 0.03,
          y: 4 + motion.spaciousness * 4,
          autoAlpha: 0.62,
        },
        {
          scale: 1.025 + motion.spaciousness * 0.015,
          y: -1 - motion.spaciousness,
          autoAlpha: 1,
          duration: tempoTime(0.13),
          ease: "power4.out",
        },
        tempoTime(0.015),
      );
      timeline.to(
        bpmReading,
        {
          scale: 1,
          y: 0,
          duration: tempoTime(0.17),
          ease: "power2.out",
        },
        tempoTime(0.145),
      );
    }

    return () => {
      timeline.kill();
      gsap.set(targets, {
        clearProps: "transform,opacity,visibility,willChange",
      });
    };
  }, [activeDot, nextDot, pulse]);

  useLayoutEffect(() => {
    const previousScreen = previousScreenRef.current;
    previousScreenRef.current = screenState;
    if (previousScreen === screenState) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) return;

    const targets =
      screenState === "start"
        ? [recordRef.current, bpmRef.current]
        : screenState === "first"
          ? [timingRef.current]
          : screenState === "result"
            ? [resetRef.current]
            : [];
    const visibleTargets = targets.filter(
      (target): target is HTMLElement => Boolean(target),
    );
    if (!visibleTargets.length) return;

    gsap.set(visibleTargets, { willChange: "transform, opacity" });
    const timeline = gsap.fromTo(
      visibleTargets,
      {
        scale: screenState === "start" ? 0.86 : 0.96,
        y: screenState === "start" ? 0 : 8,
        autoAlpha: 0,
      },
      {
        scale: 1,
        y: 0,
        autoAlpha: 1,
        duration: screenState === "start" ? 0.42 : 0.3,
        stagger: 0.055,
        ease: "back.out(2.8)",
        clearProps: "transform,opacity,visibility,willChange",
      },
    );

    return () => {
      timeline.kill();
      gsap.set(visibleTargets, {
        clearProps: "transform,opacity,visibility,willChange",
      });
    };
  }, [screenState]);

  useLayoutEffect(
    () => () => {
      tapTimelineRef.current?.kill();
      const targets = [
        recordRef.current,
        spindleRef.current,
        flashRef.current,
        ...ringRefs.current,
        ...contactRefs.current,
      ].filter((target): target is HTMLElement => Boolean(target));
      gsap.killTweensOf(targets);
      gsap.set(targets, {
        clearProps: "transform,opacity,visibility,willChange",
      });
    },
    [],
  );

  const nextTheme = getNextTheme(theme);

  return (
    <main className="prototype-shell">
      <section
        className={`phone theme-${theme}`}
        aria-label="Signal-9-Live animation prototype"
      >
        <div
          ref={stageRef}
          className={`tap-stage screen-${screenState}`}
          data-testid="tap-stage"
          role="group"
          tabIndex={0}
          aria-label="Tap tempo input. Tap anywhere on this surface or press the Space bar."
          data-node-id={
            screenState === "result"
              ? RESULT_NODE_IDS[theme].stage
              : screenState === "start" && theme === "black"
                ? "76:465"
              : {
                  start: "75:490",
                  first: "75:480",
                  taps: "75:510",
                  taps2: "75:559",
                }[screenState]
          }
          onPointerDown={handleStagePointerDown}
          onContextMenu={(event) => event.preventDefault()}
        >
          {Array.from({ length: TOUCH_FEEDBACK_COUNT }, (_, index) => (
            <span
              ref={(node) => {
                contactRefs.current[index] = node;
              }}
              key={index}
              className="touch-contact"
              aria-hidden="true"
            />
          ))}
          <span
            className="brand-logo"
            role="img"
            aria-label="Signal-9-Live"
          />
          <div className="reading" aria-live="polite">
            <span
              ref={flashRef}
              className="feedback-flash"
              aria-hidden="true"
            />
            <span className={`state sr-only state-${readingState}`}>
              {readingState}
            </span>
            <div ref={recordRef} className={`record record-${readingState}`}>
              <span
                ref={(node) => {
                  ringRefs.current[0] = node;
                }}
                className="impact-ring impact-ring-a"
                aria-hidden="true"
              />
              <span
                ref={(node) => {
                  ringRefs.current[1] = node;
                }}
                className="impact-ring impact-ring-b"
                aria-hidden="true"
              />
              <span
                ref={(node) => {
                  ringRefs.current[2] = node;
                }}
                className="impact-ring impact-ring-c"
                aria-hidden="true"
              />
              <span ref={spindleRef} className="spindle" aria-hidden="true" />
            </div>
            <div ref={bpmRef} className={`bpm bpm-${screenState}`}>
              <span className="bpm-value">
                {screenState === "taps" ? (
                  <>
                    <span className="bpm-known">1</span>
                    <span className="bpm-unknown">XX</span>
                  </>
                ) : screenState === "taps2" ? (
                  <>
                    <span className="bpm-known">12</span>
                    <span className="bpm-unknown">X</span>
                  </>
                ) : (
                  <span className="bpm-known">{displayText}</span>
                )}
              </span>
              <span
                className={`bpm-meta bpm-meta-${screenState}`}
                aria-hidden={screenState !== "start" && screenState !== "result"}
              >
                {screenState === "start"
                  ? "TAP"
                  : screenState === "result"
                    ? "BPM LOCKED"
                    : "\u00a0"}
              </span>
            </div>
          </div>

          {(screenState === "first" ||
            screenState === "taps" ||
            screenState === "taps2") && (
            <section
              ref={timingRef}
              className="timing"
              aria-label="Tap timing sequence"
            >
              <div
                className="timing-line"
                data-node-id={screenState === "taps2" ? "75:568" : undefined}
                aria-hidden="true"
              >
                {Array.from({ length: DOT_COUNT }, (_, index) => {
                  const trailDistance = pulse
                    ? (activeDot - index + DOT_COUNT) % DOT_COUNT
                    : 0;
                  const trailClass =
                    trailDistance > 0 && trailDistance <= trailLength
                      ? `is-trail trail-${trailDistance}`
                      : "";

                  return (
                    <span
                      ref={(node) => {
                        timingDotRefs.current[index] = node;
                      }}
                      key={index}
                      className={`timing-dot ${index === activeDot ? "is-tap" : ""} ${
                        index === nextDot ? "is-next" : ""
                      } ${trailClass}`}
                    />
                  );
                })}
              </div>
            </section>
          )}

          <div
            className={`result-controls ${screenState === "result" ? "" : "is-single"}`}
            data-node-id={
              screenState === "result"
                ? RESULT_NODE_IDS[theme].controls
                : screenState === "start" && theme === "black"
                ? "76:479"
                : theme === "white"
                  ? "76:116"
                  : "76:96"
            }
          >
            <button
              className="icon-button"
              type="button"
              data-node-id={
                screenState === "result"
                  ? RESULT_NODE_IDS[theme].theme
                  : theme === "white"
                    ? "76:117"
                    : "76:61"
              }
              aria-label={`Switch to ${THEME_LABELS[nextTheme]} theme`}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={cycleTheme}
            >
              <ThemeIcon />
            </button>
            {screenState === "result" && (
              <button
                ref={resetRef}
                className="icon-button"
                type="button"
                data-node-id={RESULT_NODE_IDS[theme].reset}
                aria-label="Reset BPM reading"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={reset}
              >
                <RefreshIcon />
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
