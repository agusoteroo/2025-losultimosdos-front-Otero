"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import bookingService from "@/services/booking.service";
import { BookingStatus, ClassBooking } from "@/types";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATUS_LABELS: Record<BookingStatus, string> = {
  RESERVED: "Reservado",
  ATTENDED: "Asistió",
  ABSENT: "Ausente",
  CANCELLED: "Cancelado",
  WAITLIST: "En espera",
};

const STATUS_VARIANTS: Record<BookingStatus, "default" | "secondary" | "destructive" | "outline"> = {
  RESERVED: "default",
  ATTENDED: "secondary",
  ABSENT: "destructive",
  CANCELLED: "outline",
  WAITLIST: "outline",
};

const getBookingDateTime = (booking: ClassBooking) =>
  new Date(`${booking.class.date}T${booking.class.time}`);

export const MyBookingsCard = () => {
  const { selectedSede } = useStore();
  const queryClient = useQueryClient();

  const { data: bookings = [] } = useQuery({
    queryKey: ["myBookings", selectedSede.id],
    queryFn: () => bookingService.getMyBookings(selectedSede.id),
  });

  const { data: policy } = useQuery({
    queryKey: ["noShowPolicy"],
    queryFn: () => bookingService.getNoShowPolicy(),
  });

  const checkInMutation = useMutation({
    mutationFn: (bookingId: number) => bookingService.checkIn(bookingId),
    onSuccess: () => {
      toast.success("Check-in realizado");
      queryClient.invalidateQueries({ queryKey: ["myBookings", selectedSede.id] });
      queryClient.invalidateQueries({ queryKey: ["classes", selectedSede.id] });
    },
    onError: () => toast.error("No pudimos registrar la asistencia"),
  });

  const upcoming = useMemo(
    () => bookings.filter((b) => getBookingDateTime(b).getTime() >= Date.now()),
    [bookings]
  );

  const past = useMemo(
    () => bookings.filter((b) => getBookingDateTime(b).getTime() < Date.now()),
    [bookings]
  );

  const renderBooking = (booking: ClassBooking) => {
    const classDate = new Date(booking.class.date).toLocaleDateString("es-AR");
    const canCheckIn = booking.status === "RESERVED";

    return (
      <div key={booking.id} className="border rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium">{booking.class.name}</p>
          <Badge variant={STATUS_VARIANTS[booking.status]}>{STATUS_LABELS[booking.status]}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {classDate} - {booking.class.time}
        </p>
        {booking.status === "WAITLIST" && booking.waitlistPosition ? (
          <p className="text-xs text-muted-foreground">
            Posición en lista de espera: #{booking.waitlistPosition}
          </p>
        ) : null}
        {canCheckIn ? (
          <Button
            size="sm"
            onClick={() => checkInMutation.mutate(booking.id)}
            disabled={checkInMutation.isPending}
          >
            Hacer check-in
          </Button>
        ) : null}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mis turnos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {policy?.isRestricted ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
            Superaste el límite de no-shows del mes ({policy.monthlyNoShows}/{policy.monthlyThreshold}).
            Tus nuevas reservas pueden estar restringidas.
          </div>
        ) : null}

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Próximos</h3>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin turnos próximos.</p>
          ) : (
            <div className="space-y-2">{upcoming.map(renderBooking)}</div>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Pasados</h3>
          {past.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin turnos pasados.</p>
          ) : (
            <div className="space-y-2">{past.map(renderBooking)}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
