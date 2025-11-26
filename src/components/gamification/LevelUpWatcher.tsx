"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useMyGamification } from "@/hooks/use-my-gamification";
import { getLevelForPoints, LevelConfig } from "@/lib/levels";
import { LevelUpModal } from "@/components/gamification/levelUpModal";

const COOKIE_NAME = "gymcloud_levelup_shown";
const COOKIE_DAYS = 365;

const getShownLevelFromCookie = (userId: string): number | null => {
  const cookies = document.cookie.split("; ");
  const cookie = cookies.find((c) => c.startsWith(`${COOKIE_NAME}_${userId}=`));
  if (!cookie) return null;
  const value = parseInt(cookie.split("=")[1], 10);
  return isNaN(value) ? null : value;
};

const setShownLevelCookie = (userId: string, level: number): void => {
  const expires = new Date();
  expires.setDate(expires.getDate() + COOKIE_DAYS);
  document.cookie = `${COOKIE_NAME}_${userId}=${level}; expires=${expires.toUTCString()}; path=/`;
};

export function LevelUpWatcher() {
  const { userId } = useAuth();
  const { totalPoints } = useMyGamification();

  const [open, setOpen] = useState(false);
  const [levelConfig, setLevelConfig] = useState<LevelConfig | null>(null);

  const { level } = getLevelForPoints(totalPoints);

  useEffect(() => {
    if (!userId) return;

    const currentLevel = level.level;
    const lastShownLevel = getShownLevelFromCookie(userId);

    // Only show modal if current level is higher than what we've shown before
    if (lastShownLevel === null) {
      // First time user - store current level without showing modal
      setShownLevelCookie(userId, currentLevel);
      return;
    }

    if (currentLevel > lastShownLevel) {
      setLevelConfig(level);
      setOpen(true);
      setShownLevelCookie(userId, currentLevel);
    }
  }, [userId, level]);

  if (!userId || !levelConfig) return null;

  return (
    <LevelUpModal
      level={levelConfig}
      open={open}
      onClose={(o) => {
        setOpen(o);
        if (!o) setLevelConfig(null);
      }}
    />
  );
}
