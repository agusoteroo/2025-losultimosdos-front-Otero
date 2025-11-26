"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import BadgeService from "@/services/badges.service";
import { UserBadgeStatus } from "@/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge as UiBadge } from "@/components/ui/badge";
import { NewBadgeModal } from "@/components/badges/NewBadgeModal";

export default function UserBadgesPage() {
  const { getToken, userId } = useAuth();

  const { data: badges = [], isLoading } = useQuery<UserBadgeStatus[]>({
    queryKey: ["userBadges", userId],
    enabled: !!userId,
    queryFn: async () => {
      const token = await getToken();
      return BadgeService.getUserBadges(token);
    },
  });

  // Modal de nuevo badge
  const [modalOpen, setModalOpen] = useState(false);
  const [newBadge, setNewBadge] = useState<UserBadgeStatus | null>(null);

  // Lógica centralizada de "desbloqueado"
  const isUnlocked = (b: UserBadgeStatus) =>
    b.earned || b.progress >= 1 || b.currentValue >= b.threshold;

  const earned = badges.filter(isUnlocked);
  const locked = badges.filter((b) => !isUnlocked(b));

  // Refs para detectar badges nuevos
  const prevEarnedIdsRef = useRef<Set<number>>(new Set());
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!badges || badges.length === 0) return;

    const currentEarnedIds = new Set(
      badges.filter(isUnlocked).map((b) => b.badgeId)
    );

    // Primera vez: solo inicializamos, no mostramos modal
    if (!initializedRef.current) {
      initializedRef.current = true;
      prevEarnedIdsRef.current = currentEarnedIds;
      return;
    }

    const prevEarnedIds = prevEarnedIdsRef.current;

    // Badge que antes no estaba desbloqueado y ahora sí
    const newlyEarned = badges.find(
      (b) => isUnlocked(b) && !prevEarnedIds.has(b.badgeId)
    );

    // Actualizamos el ref para la próxima comparación
    prevEarnedIdsRef.current = currentEarnedIds;

    if (newlyEarned) {
      setNewBadge(newlyEarned);
      setModalOpen(true);
    }
  }, [badges]);

  return (
    <div className="container mx-auto space-y-4 p-4">
      {/* Modal de nuevo logro */}
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

      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-lg font-bold">Tus logros</h1>
          <p className="text-sm text-muted-foreground">
            Badges obtenidos por tu actividad en GymCloud
          </p>
        </div>
        <UiBadge variant="secondary">
          {earned.length}/{badges.length} desbloqueados
        </UiBadge>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando logros...</p>
      ) : badges.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Todavía no hay badges configurados.
        </p>
      ) : (
        <>
          {/* Desbloqueados */}
          {earned.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold mb-2">Desbloqueados</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {earned.map((b) => (
                  <BadgeCard key={b.badgeId} badge={b} unlocked />
                ))}
              </div>
            </section>
          )}

          {/* Bloqueados */}
          {locked.length > 0 && (
            <section className="mt-6">
              <h2 className="text-sm font-semibold mb-2">Por desbloquear</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {locked.map((b) => (
                  <BadgeCard key={b.badgeId} badge={b} unlocked={false} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
function BadgeCard({
  badge,
  unlocked,
}: {
  badge: UserBadgeStatus;
  unlocked: boolean;
}) {
  const pct = Math.round(badge.progress * 100);

  return (
    <Card
      className={
        unlocked
          ? ""
          : "relative overflow-hidden opacity-60 border-dashed border-muted-foreground/40"
      }
    >
      {/* Nubes borrosas solo si está bloqueado */}
      {!unlocked && (
        <>
          <div className="pointer-events-none absolute -top-6 -left-4 h-16 w-24 rounded-full bg-white/30 blur-xl" />
          <div className="pointer-events-none absolute top-2 left-10 h-10 w-20 rounded-full bg-white/20 blur-lg" />
          <div className="pointer-events-none absolute -bottom-4 right-0 h-16 w-28 rounded-full bg-white/25 blur-xl" />
          <div className="pointer-events-none absolute bottom-2 right-10 h-10 w-16 rounded-full bg-white/15 blur-lg" />
        </>
      )}

      {/* Contenido real del badge */}
      <div className={unlocked ? "" : "relative z-10 grayscale"}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">
                {badge.icon ?? (unlocked ? "🏅" : "🔒")}
              </span>
              <div>
                <CardTitle className="text-sm">{badge.name}</CardTitle>
                {badge.description && (
                  <CardDescription className="text-xs">
                    {badge.description}
                  </CardDescription>
                )}
              </div>
            </div>
            {unlocked ? (
              <UiBadge variant="default" className="text-[10px]">
                Desbloqueado
              </UiBadge>
            ) : (
              <UiBadge variant="outline" className="text-[10px]">
                Bloqueado
              </UiBadge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span>
              {badge.currentValue}/{badge.threshold}
            </span>
            <span>{pct}%</span>
          </div>
          <Progress value={pct} className="h-1.5" />
        </CardContent>
      </div>
    </Card>
  );
}
