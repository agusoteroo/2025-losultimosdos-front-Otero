"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import bookingService from "@/services/booking.service";
import { BookingStatus, ClassBooking, GymClass } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const statusOptions: BookingStatus[] = ["RESERVED", "ATTENDED", "ABSENT", "CANCELLED", "WAITLIST"];

const labels: Record<BookingStatus, string> = {
  RESERVED: "Reservado",
  ATTENDED: "Asistió",
  ABSENT: "Ausente",
  CANCELLED: "Cancelado",
  WAITLIST: "En espera",
};

export const ClassAttendanceManager = ({ classes }: { classes: GymClass[] }) => {
  const queryClient = useQueryClient();
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id?.toString() ?? "");

  const selectedClass = useMemo(
    () => classes.find((c) => c.id.toString() === selectedClassId),
    [classes, selectedClassId]
  );

  const { data: bookings = [] } = useQuery({
    queryKey: ["classBookings", selectedClassId],
    queryFn: () => bookingService.getClassBookings(Number(selectedClassId)),
    enabled: !!selectedClassId,
  });

  const updateMutation = useMutation({
    mutationFn: ({ bookingId, status }: { bookingId: number; status: BookingStatus }) =>
      bookingService.updateStatus(bookingId, status),
    onSuccess: () => {
      toast.success("Estado actualizado");
      queryClient.invalidateQueries({ queryKey: ["classBookings", selectedClassId] });
      queryClient.invalidateQueries({ queryKey: ["myBookings"] });
    },
    onError: () => toast.error("No pudimos actualizar el estado"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asistencia, no-shows y lista de espera</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar clase" />
          </SelectTrigger>
          <SelectContent>
            {classes.map((gymClass) => (
              <SelectItem key={gymClass.id} value={gymClass.id.toString()}>
                {gymClass.name} - {new Date(gymClass.date).toLocaleDateString("es-AR")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {!selectedClass ? null : (
          <p className="text-sm text-muted-foreground">
            Clase seleccionada: {selectedClass.name}. Marcá asistencia manualmente o mové usuarios en espera.
          </p>
        )}

        <div className="space-y-2">
          {bookings.map((booking: ClassBooking & { user?: { fullName?: string; email?: string } }) => (
            <div key={booking.id} className="rounded-md border p-3 flex flex-wrap items-center gap-2 justify-between">
              <div>
                <p className="font-medium">{booking.user?.fullName ?? booking.userId}</p>
                <p className="text-xs text-muted-foreground">{booking.user?.email ?? "Sin email"}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">{labels[booking.status as BookingStatus]}</Badge>
                {statusOptions.map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={booking.status === status ? "default" : "outline"}
                    disabled={updateMutation.isPending}
                    onClick={() => updateMutation.mutate({ bookingId: booking.id, status })}
                  >
                    {labels[status]}
                  </Button>
                ))}
              </div>
            </div>
          ))}
          {bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay reservas para esta clase.</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};
