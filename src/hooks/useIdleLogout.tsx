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

  // 4.5 menit muncul warning
  const WARNING_TIME = 1000 * 60 * 4.5;

  // 5 menit logout
  const LOGOUT_TIME = 1000 * 60 * 5;

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

    return () => {

      clearAllTimers();

      events.forEach((event) => {
        window.removeEventListener(event, activityHandler);
      });
    };

  }, [user]);

  return {
    showModal,
    countdown,
    stayLoggedIn: resetTimer,
  };
}