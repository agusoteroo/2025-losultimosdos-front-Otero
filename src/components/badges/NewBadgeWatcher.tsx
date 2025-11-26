"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import BadgeService from "@/services/badges.service";
import { UserBadgeStatus } from "@/types";
import { NewBadgeModal } from "@/components/badges/NewBadgeModal";

export function NewBadgeWatcher() {
  const { userId, getToken } = useAuth();

  const { data: badges = [] } = useQuery<UserBadgeStatus[]>({
    queryKey: ["userBadges", userId],
    enabled: !!userId,
    queryFn: async () => {
      const token = await getToken();
      return BadgeService.getUserBadges(token);
    },
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [newBadge, setNewBadge] = useState<UserBadgeStatus | null>(null);

  const isUnlocked = (b: UserBadgeStatus) =>
    b.earned || b.progress >= 1 || b.currentValue >= b.threshold;

  const prevEarnedIdsRef = useRef<Set<number>>(new Set());
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!userId || !badges || badges.length === 0) return;

    const currentEarnedIds = new Set(
      badges.filter(isUnlocked).map((b) => b.badgeId)
    );

    if (!initializedRef.current) {
      initializedRef.current = true;
      prevEarnedIdsRef.current = currentEarnedIds;
      return;
    }

    const prevEarnedIds = prevEarnedIdsRef.current;

    const newlyEarned = badges.find(
      (b) => isUnlocked(b) && !prevEarnedIds.has(b.badgeId)
    );

    prevEarnedIdsRef.current = currentEarnedIds;

    if (newlyEarned) {
      setNewBadge(newlyEarned);
      setModalOpen(true);
    }
  }, [badges, userId]);

  if (!userId || !newBadge) return null;

  return (
    <NewBadgeModal
      badge={newBadge}
      open={modalOpen}
      onClose={(open) => {
        setModalOpen(open);
        if (!open) {
          setNewBadge(null);
        }
      }}
    />
  );
}
