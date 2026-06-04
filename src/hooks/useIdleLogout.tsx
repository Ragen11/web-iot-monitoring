import { useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { useNavigate } from "react-router-dom";

export default function useIdleLogout() {

  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [countdown, setCountdown] = useState(30);

  const warningTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // 11.5 menit muncul warning modal
  const WARNING_TIME = 1000 * 60 * 11.5;

  // 12 menit total → auto-logout (warning muncul 30 detik sebelumnya)
  const LOGOUT_TIME = 1000 * 60 * 12;

  const clearAllTimers = () => {

    if (warningTimeout.current)
      clearTimeout(warningTimeout.current);

    if (logoutTimeout.current)
      clearTimeout(logoutTimeout.current);

    if (countdownInterval.current)
      clearInterval(countdownInterval.current);
  };

  const doLogout = async () => {

    clearAllTimers();

    await logout();

    navigate("/login", {
      state: {
        expired: true,
      },
    });
  };

  const resetTimer = () => {

    if (!user) return;

    clearAllTimers();

    setShowModal(false);
    setCountdown(30);

    // warning
    warningTimeout.current = setTimeout(() => {

      setShowModal(true);

      let timeLeft = 30;

      setCountdown(timeLeft);

      countdownInterval.current = setInterval(() => {

        timeLeft--;

        setCountdown(timeLeft);

        if (timeLeft <= 0) {
          clearInterval(countdownInterval.current!);
        }

      }, 1000);

    }, WARNING_TIME);

    // logout
    logoutTimeout.current = setTimeout(async () => {
      await doLogout();
    }, LOGOUT_TIME);
  };

  useEffect(() => {

    if (!user) return;

    const events = [
      "mousemove",
      "mousedown",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    const activityHandler = () => {
      resetTimer();
    };

    events.forEach((event) => {
      window.addEventListener(event, activityHandler);
    });

    resetTimer();

    // ──────────────────────────────────────────────────────────
    // Track lastActiveTime untuk inactivity check di AuthContext
    // - update setiap 30 detik selama user aktif
    // - update juga saat tab ditutup (beforeunload)
    // ──────────────────────────────────────────────────────────
    const saveLastActive = () => {
      localStorage.setItem("lastActiveTime", String(Date.now()));
    };

    // initial save
    saveLastActive();

    // periodic save
    const lastActiveInterval = setInterval(saveLastActive, 30 * 1000);

    // save saat tab/browser ditutup
    window.addEventListener("beforeunload", saveLastActive);

    return () => {

      clearAllTimers();

      events.forEach((event) => {
        window.removeEventListener(event, activityHandler);
      });

      clearInterval(lastActiveInterval);
      window.removeEventListener("beforeunload", saveLastActive);
    };

  }, [user]);

  return {
    showModal,
    countdown,
    stayLoggedIn: resetTimer,
  };
}