"use client";

import { useEffect, useRef, useState } from "react";
import * as Sentry from "@sentry/nextjs";

export default function Home() {
  const [goal, setGoal] = useState("");
  const [isWalking, setIsWalking] = useState(false);
  const [status, setStatus] = useState("Status: Ready for signal.");
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const lastTapRef = useRef<number>(0);

  // Screen Wake Lock API helpers
  async function requestWakeLock() {
    if (typeof window !== "undefined" && "wakeLock" in navigator) {
      if (document.visibilityState !== "visible") return;
      try {
        const sentinel = await navigator.wakeLock.request("screen");
        wakeLockRef.current = sentinel;
        sentinel.addEventListener("release", () => {
          wakeLockRef.current = null;
        });
      } catch (err) {
        console.error("Screen Wake Lock request failed:", err);
      }
    }
  }

  async function releaseWakeLock() {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch (err) {
        console.error("Screen Wake Lock release failed:", err);
      }
      wakeLockRef.current = null;
    }
  }

  // Manage Screen Wake Lock when isWalking changes
  useEffect(() => {
    if (isWalking) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    return () => {
      releaseWakeLock();
    };
  }, [isWalking]);

  // Re-acquire wake lock if page becomes visible while walking
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isWalking) {
        requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isWalking]);

  function handleWake() {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsWalking(false);
    releaseWakeLock();
    setStatus("Status: Display awakened. Ready for signal.");
  }

  function handleContainerDoubleTap() {
    const now = Date.now();
    const DOUBLE_TAP_THRESHOLD_MS = 350;
    if (now - lastTapRef.current < DOUBLE_TAP_THRESHOLD_MS) {
      handleWake();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }

  const getPosition = () =>
    new Promise<GeolocationPosition>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject),
    );

  async function handleStartQuest() {
    setIsLoading(true);
    setStatus("Status: Acquiring GPS signal...");

    let latitude: number;
    let longitude: number;

    try {
      if (typeof window === "undefined" || !navigator.geolocation) {
        throw new Error("Geolocation is not supported by your browser.");
      }
      const position = await getPosition();
      latitude = position.coords.latitude;
      longitude = position.coords.longitude;
    } catch (err: unknown) {
      const message =
        typeof window !== "undefined" &&
        err instanceof GeolocationPositionError &&
        err.code === err.PERMISSION_DENIED
          ? "Location permission was denied. Please allow location access to start your quest."
          : err instanceof Error
            ? err.message
            : "Location permission denied or unavailable.";

      alert(message);
      console.error("Geolocation error:", err);
      Sentry.captureException(err);
      setStatus(`Status: ${message}`);
      setIsLoading(false);
      return;
    }

    try {

      // 2) POST to /api/location
      setStatus("Status: Transmitting location...");
      const searchParams = new URLSearchParams(window.location.search);
      const friendSessionId =
        searchParams.get("friendSessionId") ||
        searchParams.get("friend") ||
        searchParams.get("sessionId");

      const locationRes = await fetch("/api/location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          latitude,
          longitude,
          goal,
          ...(friendSessionId ? { friendSessionId } : {}),
        }),
      });

      if (!locationRes.ok) {
        const errorText = await locationRes.text();
        throw new Error(
          `Location update failed: ${errorText || locationRes.statusText}`,
        );
      }

      const locationData = await locationRes.json();
      const distance = locationData.distance ?? 50;
      const bearing = locationData.bearing ?? "North";

      // 3) POST to /api/generate-script
      setStatus("Status: Receiving adventure guide transmission...");
      const scriptRes = await fetch("/api/generate-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          distance,
          bearing,
          destination: goal,
          goal,
          latitude,
          longitude,
        }),
      });

      if (!scriptRes.ok) {
        const errorText = await scriptRes.text();
        throw new Error(
          `Script generation failed: ${errorText || scriptRes.statusText}`,
        );
      }

      const scriptText = await scriptRes.text();

      // 4) POST to /api/tts to get the audio buffer
      setStatus("Status: Synthesizing guide voice...");
      const ttsRes = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: scriptText,
        }),
      });

      if (!ttsRes.ok) {
        const errorText = await ttsRes.text();
        throw new Error(`TTS synthesis failed: ${errorText || ttsRes.statusText}`);
      }

      const audioBuffer = await ttsRes.arrayBuffer();
      const audioBlob = new Blob([audioBuffer], { type: "audio/mpeg" });
      const audioUrl = URL.createObjectURL(audioBlob);

      // 5) Play the audio using native HTMLAudioElement. As soon as audio starts, set isWalking to true.
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.addEventListener("play", () => {
        setIsWalking(true);
      });

      audio.addEventListener("ended", () => {
        URL.revokeObjectURL(audioUrl);
      });

      await audio.play();
      setIsWalking(true);
    } catch (err) {
      console.error("Exploration error:", err);
      Sentry.captureException(err);
      setStatus(
        `Status: ${err instanceof Error ? err.message : "Exploration failed."}`,
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (isWalking) {
    return (
      <main
        className="fixed inset-0 bg-black z-50"
        onClick={handleContainerDoubleTap}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundColor: "#000",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          alignItems: "center",
          paddingBottom: "3rem",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <button
          type="button"
          className="nes-btn is-disabled"
          onClick={(e) => {
            e.stopPropagation();
            handleWake();
          }}
          style={{
            opacity: 0.5,
            fontSize: "0.75rem",
            letterSpacing: "0.08em",
          }}
        >
          TAP TO WAKE
        </button>
      </main>
    );
  }

  return (
    <main className="shell" aria-label="PORI explorer">
      <section className="console">
        <h1>PORI</h1>
        <div className="nes-field" style={{ width: "100%", textAlign: "left" }}>
          <label
            htmlFor="heading_input"
            style={{
              display: "block",
              fontSize: "0.75rem",
              lineHeight: 1.6,
              marginBottom: "0.5rem",
              color: "#fff",
            }}
          >
            Where are we heading? (e.g. 15-min nature stroll, or nearest quiet park)
          </label>
          <input
            type="text"
            id="heading_input"
            className="nes-input is-dark"
            placeholder="15-min nature stroll, or nearest quiet park"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <button
            type="button"
            className="nes-btn is-primary"
            onClick={handleStartQuest}
            disabled={isLoading}
          >
            {isLoading ? "Exploring..." : "Start Quest"}
          </button>
          <button
            type="button"
            className="nes-btn is-error"
            onClick={() => {
              try {
                throw new Error("PORI test error: Sentry trace verification");
              } catch (testError) {
                Sentry.captureException(testError);
                setStatus("Status: Sentry test trace emitted.");
              }
            }}
            disabled={isLoading}
            style={{ fontSize: "0.75rem" }}
          >
            Test Sentry
          </button>
        </div>
        <p className="status" role="status">
          {status}
        </p>
      </section>
    </main>
  );
}
