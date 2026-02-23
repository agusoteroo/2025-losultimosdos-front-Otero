"use client";
import { useEffect, useState } from "react";
import apiService from "@/services/api.service";
import bookingService from "@/services/booking.service";
import { UsersClassesTable } from "@/components/classes/users-table";
import { GymClass } from "@/types";
import { FullClasses } from "@/components/classes/full-classes";
import { useStore } from "@/store/useStore";
import { useQuery } from "@tanstack/react-query";
import TableSkeleton from "@/components/skeletons/table-skeleton";
import { MyBookingsCard } from "@/components/classes/my-bookings-card";
import { WaitlistPromotionWatcher } from "@/components/classes/waitlist-promotion-watcher";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CircleHelp } from "lucide-react";
import {
  formatRemainingMmSs,
  getRestrictionRemainingMs,
  isNoShowRestricted,
} from "@/lib/no-show-policy-utils";

const getClassDateTime = (gymClass: GymClass) => {
  const rawDateValue = gymClass.date as string | Date;
  const rawDate =
    typeof rawDateValue === "string"
      ? rawDateValue
      : new Date(rawDateValue).toISOString();
  const dateOnly = rawDate.includes("T") ? rawDate.split("T")[0] : rawDate;
  return new Date(`${dateOnly}T${gymClass.time}`);
};

const UserPage = () => {
  const { selectedSede } = useStore();
  const [restrictionNow, setRestrictionNow] = useState(Date.now());

  const {
    data: classes,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["classes", selectedSede.id],
    queryFn: async () => {
      const response = await apiService.get(
        `/classes?sedeId=${selectedSede.id}`,
      );
      return response.classes as GymClass[];
    },
  });

  const { data: policy, refetch: refetchNoShowPolicy } = useQuery({
    queryKey: ["noShowPolicy"],
    queryFn: () => bookingService.getNoShowPolicy(),
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!isNoShowRestricted(policy) || !policy?.currentWindow?.restrictionUntil) {
      return;
    }

    const interval = window.setInterval(() => setRestrictionNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [policy]);

  const noShowCount = policy?.currentWindow?.noShows ?? policy?.monthlyNoShows;
  const noShowThreshold = policy?.currentWindow?.threshold ?? policy?.monthlyThreshold;
  const restrictionRemainingMs = getRestrictionRemainingMs(policy, restrictionNow);
  const restrictionActive = isNoShowRestricted(policy);

  useEffect(() => {
    if (!restrictionActive || restrictionRemainingMs <= 0) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void refetchNoShowPolicy();
    }, restrictionRemainingMs + 150);

    return () => window.clearTimeout(timeout);
  }, [refetchNoShowPolicy, restrictionActive, restrictionRemainingMs]);

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (!classes) {
    return (
      <div className="container mx-auto space-y-4 p-4">
        <h1 className="text-lg font-bold">Clases Disponibles</h1>
        <UsersClassesTable classes={[]} onClassesChanged={refetch} />
      </div>
    );
  }

  const now = Date.now();
  const futureClasses = classes.filter((c) => {
    const classTime = getClassDateTime(c).getTime();
    return Number.isFinite(classTime) && classTime >= now;
  });

  const available = futureClasses.filter((c) => c.enrolled < c.capacity);
  const full = futureClasses.filter((c) => c.enrolled >= c.capacity);

  return (
    <div className="container mx-auto space-y-4 p-4">
      <WaitlistPromotionWatcher />
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold">Clases Disponibles</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full"
                aria-label="Ver informacion sobre politica de reservas"
              >
                <CircleHelp className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Politica de reservas</DialogTitle>
                <DialogDescription>
                  Si acumulas cancelaciones tardias o ausencias, podes quedar
                  temporalmente restringido para reservar clases o entrar a lista
                  de espera.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    Strikes actuales: {typeof noShowCount === "number" ? noShowCount : "-"}
                  </Badge>
                  <Badge variant="outline">
                    Umbral (maximo de strikes):{" "}
                    {typeof noShowThreshold === "number" ? noShowThreshold : "-"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={restrictionActive ? "destructive" : "outline"}>
                    {restrictionActive ? "Restringido" : "Sin restriccion activa"}
                  </Badge>
                  {restrictionActive && restrictionRemainingMs > 0 ? (
                    <span className="font-medium text-destructive">
                      {formatRemainingMmSs(restrictionRemainingMs)}
                    </span>
                  ) : null}
                </div>
                {restrictionActive && policy?.currentWindow?.restrictionUntil ? (
                  <p className="text-muted-foreground">
                    Tenes una restriccion temporal para reservar hasta{" "}
                    {new Date(policy.currentWindow.restrictionUntil).toLocaleTimeString(
                      "es-AR",
                      { hour: "2-digit", minute: "2-digit" }
                    )}
                    .
                  </p>
                ) : null}
                {policy?.currentWindow?.minutes ? (
                  <p className="text-muted-foreground">
                    Ventana actual: {policy.currentWindow.minutes} minuto
                    {policy.currentWindow.minutes === 1 ? "" : "s"}.
                  </p>
                ) : null}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <UsersClassesTable classes={available} onClassesChanged={refetch} />

      {full.length > 0 && <FullClasses fullClasses={full} />}

      <MyBookingsCard />
    </div>
  );
};

export default UserPage;
