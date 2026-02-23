"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useAuth } from "@clerk/nextjs";

import bookingService from "@/services/booking.service";
import apiService, { ApiValidationError } from "@/services/api.service";
import { BookingStatus, ClassBooking, UnenrollResponse } from "@/types";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClassCancelConfirmDialog } from "@/components/classes/class-cancel-confirm-dialog";
import { showWaitlistPromotionToast } from "@/lib/waitlist-promotion-toast";
import { showStrikeAlertToast } from "@/lib/strike-alert-toast";
import {
  formatRemainingMmSs,
  getRestrictionRemainingMs,
  isNoShowRestricted,
} from "@/lib/no-show-policy-utils";

const DAY_MS = 24 * 60 * 60 * 1000;
const VISIBLE_BOOKING_STATUSES: BookingStatus[] = [
  "RESERVED",
  "ATTENDED",
  "ABSENT",
  "CANCELLED",
  "WAITLIST",
];

const STATUS_LABELS: Record<BookingStatus, string> = {
  RESERVED: "Reservado",
  ATTENDED: "Presente",
  ABSENT: "Ausente",
  CANCELLED: "Cancelado",
  WAITLIST: "Lista de espera",
};

const STATUS_VARIANTS: Record<
  BookingStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  RESERVED: "default",
  ATTENDED: "secondary",
  ABSENT: "destructive",
  CANCELLED: "outline",
  WAITLIST: "outline",
};

const getDateOnly = (value: ClassBooking["class"]["date"] | string) => {
  if (typeof value === "string") {
    return value.includes("T") ? value.split("T")[0] : value;
  }

  return new Date(value).toISOString().split("T")[0];
};

const getBookingDateTime = (booking: ClassBooking) =>
  new Date(`${getDateOnly(booking.class.date)}T${booking.class.time}`);

const getErrorMessage = (error: unknown) => {
  if (error instanceof ApiValidationError && error.details?.length) {
    return error.details[0]?.message ?? "No pudimos procesar la solicitud";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "No pudimos procesar la solicitud";
};

export const MyBookingsCard = () => {
  const { selectedSede } = useStore();
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [bookingToCancel, setBookingToCancel] = useState<ClassBooking | null>(null);

  const {
    data: bookings = [],
    isLoading: isBookingsLoading,
    isError: isBookingsError,
    error: bookingsError,
  } = useQuery({
    queryKey: ["myBookings", selectedSede.id],
    queryFn: () => bookingService.getMyBookings(selectedSede.id),
    enabled: !!selectedSede.id,
  });

  const { data: policy } = useQuery({
    queryKey: ["noShowPolicy"],
    queryFn: () => bookingService.getNoShowPolicy(),
    refetchOnWindowFocus: true,
  });

  const noShowCount = policy?.currentWindow?.noShows ?? policy?.monthlyNoShows;
  const noShowThreshold = policy?.currentWindow?.threshold ?? policy?.monthlyThreshold;
  const [restrictionNow, setRestrictionNow] = useState<number>(Date.now());

  useEffect(() => {
    if (!isNoShowRestricted(policy) || !policy?.currentWindow?.restrictionUntil) {
      return;
    }

    const interval = window.setInterval(() => setRestrictionNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [policy]);

  const restrictionRemainingMs = getRestrictionRemainingMs(policy, restrictionNow);
  const showRestrictionCountdown = isNoShowRestricted(policy) && restrictionRemainingMs > 0;

  const cancelBookingMutation = useMutation({
    mutationFn: (classId: number) =>
      apiService.post<UnenrollResponse>("/user/unenroll", { classId }),
    onSuccess: (response) => {
      toast.success("Clase cancelada");
      showWaitlistPromotionToast(response?.waitlistPromotion);
      showStrikeAlertToast(response?.strikeAlert);
      queryClient.invalidateQueries({ queryKey: ["myBookings", selectedSede.id] });
      queryClient.invalidateQueries({ queryKey: ["classes", selectedSede.id] });
      queryClient.invalidateQueries({ queryKey: ["myWaitlists", selectedSede.id] });
      queryClient.invalidateQueries({ queryKey: ["noShowPolicy"] });
      queryClient.invalidateQueries({
        queryKey: ["leaderboard-users", { period: "all", sedeId: selectedSede.id }],
      });
      queryClient.invalidateQueries({
        queryKey: ["leaderboard-users", { period: "30d", sedeId: selectedSede.id }],
      });
      queryClient.invalidateQueries({ queryKey: ["leaderboard-sedes"] });
      queryClient.invalidateQueries({ queryKey: ["my-gamification", selectedSede.id] });
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ["userBadges", userId] });
      }
      router.refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const visibleBookings = useMemo(
    () => bookings.filter((booking) => VISIBLE_BOOKING_STATUSES.includes(booking.status)),
    [bookings]
  );

  const upcoming = useMemo(() => {
    const now = Date.now();

    return visibleBookings
      .filter((booking) => {
        const time = getBookingDateTime(booking).getTime();
        return Number.isFinite(time) && time >= now;
      })
      .sort(
        (a, b) => getBookingDateTime(a).getTime() - getBookingDateTime(b).getTime()
      );
  }, [visibleBookings]);

  const past = useMemo(() => {
    const now = Date.now();
    const pastWindowStart = now - 30 * DAY_MS;

    return visibleBookings
      .filter((booking) => {
        const time = getBookingDateTime(booking).getTime();
        return Number.isFinite(time) && time < now && time >= pastWindowStart;
      })
      .sort(
        (a, b) => getBookingDateTime(b).getTime() - getBookingDateTime(a).getTime()
      );
  }, [visibleBookings]);

  const renderBooking = (booking: ClassBooking) => {
    const classDate = new Date(
      `${getDateOnly(booking.class.date)}T00:00:00`
    ).toLocaleDateString("es-AR");
    const classDateTime = getBookingDateTime(booking).getTime();
    const isPastClass = Number.isFinite(classDateTime) && classDateTime < Date.now();
    const canCancel = !isPastClass && booking.status === "RESERVED";
    const derivedStatusLabel =
      booking.status === "RESERVED" && isPastClass
        ? "En espera de confirmacion"
        : STATUS_LABELS[booking.status];

    return (
      <div key={booking.id} className="border rounded-lg p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium leading-tight">{booking.class.name}</p>
            <p className="text-xs text-muted-foreground">
              {isPastClass ? "Clase pasada" : "Clase proxima"}
            </p>
          </div>
          <Badge variant={STATUS_VARIANTS[booking.status]}>
            {derivedStatusLabel}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <p className="text-muted-foreground">Fecha</p>
          <p className="text-right">{classDate}</p>
          <p className="text-muted-foreground">Hora</p>
          <p className="text-right">{booking.class.time}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canCancel ? (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setBookingToCancel(booking)}
              disabled={cancelBookingMutation.isPending}
            >
              Cancelar inscripcion
            </Button>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mis clases</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isBookingsLoading ? (
          <p className="text-sm text-muted-foreground">Cargando clases...</p>
        ) : null}

        {isBookingsError ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
            No pudimos cargar tus clases.
            <div className="mt-1 opacity-80">{getErrorMessage(bookingsError)}</div>
          </div>
        ) : null}

        {isNoShowRestricted(policy) ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
            Tenes una restriccion temporal para reservar clases o entrar a lista de espera.
            {typeof noShowCount === "number" && typeof noShowThreshold === "number" ? (
              <div className="mt-1">
                Strikes actuales: {noShowCount}/{noShowThreshold}
              </div>
            ) : null}
            {showRestrictionCountdown ? (
              <div className="mt-1 font-medium">
                Restriccion activa por {formatRemainingMmSs(restrictionRemainingMs)}.
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Proximas</h3>
            <Badge variant="outline">{upcoming.length}</Badge>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin clases proximas.</p>
          ) : (
            <div className="space-y-2">{upcoming.map(renderBooking)}</div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Pasadas</h3>
            <Badge variant="outline">{past.length}</Badge>
          </div>
          {past.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin clases pasadas del ultimo mes.
            </p>
          ) : (
            <div className="space-y-2">{past.map(renderBooking)}</div>
          )}
        </div>
      </CardContent>
      <ClassCancelConfirmDialog
        open={!!bookingToCancel}
        onOpenChange={(open) => !open && setBookingToCancel(null)}
        className={bookingToCancel ? `"${bookingToCancel.class.name}"` : undefined}
        classDateLabel={
          bookingToCancel
            ? new Date(
                `${getDateOnly(bookingToCancel.class.date)}T00:00:00`
              ).toLocaleDateString("es-AR")
            : undefined
        }
        classTime={bookingToCancel?.class.time}
        isPending={cancelBookingMutation.isPending}
        onConfirm={() => {
          if (!bookingToCancel) {
            return;
          }

          cancelBookingMutation.mutate(bookingToCancel.classId, {
            onSuccess: () => {
              setBookingToCancel(null);
            },
          });
        }}
      />
    </Card>
  );
};
