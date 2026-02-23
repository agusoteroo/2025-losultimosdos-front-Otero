"use client";

const KEY_PREFIX = "waitlist-tracking";

const getKey = (userId: string, sedeId: number) => `${KEY_PREFIX}:${userId}:${sedeId}`;

const readSet = (key: string) => {
  if (typeof window === "undefined") {
    return new Set<number>();
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return new Set<number>();
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return new Set<number>();
    }

    return new Set(parsed.filter((value) => typeof value === "number"));
  } catch {
    return new Set<number>();
  }
};

const writeSet = (key: string, values: Set<number>) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify([...values]));
};

export const addTrackedWaitlistClass = (
  userId: string | null | undefined,
  sedeId: number | null | undefined,
  classId: number
) => {
  if (!userId || typeof sedeId !== "number") {
    return;
  }

  const key = getKey(userId, sedeId);
  const current = readSet(key);
  current.add(classId);
  writeSet(key, current);
};

export const removeTrackedWaitlistClass = (
  userId: string | null | undefined,
  sedeId: number | null | undefined,
  classId: number
) => {
  if (!userId || typeof sedeId !== "number") {
    return;
  }

  const key = getKey(userId, sedeId);
  const current = readSet(key);
  current.delete(classId);
  writeSet(key, current);
};

export const getTrackedWaitlistClasses = (
  userId: string | null | undefined,
  sedeId: number | null | undefined
) => {
  if (!userId || typeof sedeId !== "number") {
    return new Set<number>();
  }

  return readSet(getKey(userId, sedeId));
};

