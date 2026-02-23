import { NoShowPolicy } from "@/types";

export const isNoShowRestricted = (policy: NoShowPolicy | null | undefined) =>
  Boolean(policy?.currentWindow?.restricted ?? policy?.isRestricted);

export const getRestrictionRemainingMs = (
  policy: NoShowPolicy | null | undefined,
  now = Date.now()
) => {
  const restrictionUntil = policy?.currentWindow?.restrictionUntil;
  if (!restrictionUntil) {
    return 0;
  }

  const endMs = new Date(restrictionUntil).getTime();
  if (!Number.isFinite(endMs)) {
    return 0;
  }

  return Math.max(0, endMs - now);
};

export const formatRemainingMmSs = (ms: number) => {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

