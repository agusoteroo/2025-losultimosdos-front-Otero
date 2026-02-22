"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import bookingService from "@/services/booking.service";
import { ApiValidationError } from "@/services/api.service";
import { BookingStatus, ClassBooking, GymClass } from "@/types";
import { useStore } from "@/store/useStore";
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

const attendanceStatusOptions: BookingStatus[] = ["ATTENDED", "ABSENT"];

const labels: Record<BookingStatus, string> = {
  RESERVED: "Reservado",
  ATTENDED: "Presente",
  ABSENT: "Ausente",
  CANCELLED: "Cancelado",
  WAITLIST: "Pendiente",
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof ApiValidationError && error.details?.length) {
    return error.details[0]?.message ?? "No pudimos actualizar el estado";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "No pudimos actualizar el estado";
};

const getUserDisplayName = (booking: ClassBooking) =>
  booking.user?.fullName?.trim() || booking.user?.email || booking.userId;

const getUserSecondaryText = (booking: ClassBooking) => {
  if (booking.user?.fullName?.trim()) {
    return booking.user?.email || booking.userId;
  }

  if (booking.user?.email) {
    return booking.userId;
  }

  return null;
};

export const ClassAttendanceManager = ({ classes }: { classes: GymClass[] }) => {
  const queryClient = useQueryClient();
  const { selectedSede } = useStore();
  const [selectedClassId, setSelectedClassId] = useState<string>(
    classes[0]?.id?.toString() ?? ""
  );

  useEffect(() => {
    if (!classes.length) {
      setSelectedClassId("");
      return;
    }

    setSelectedClassId((current) =>
      classes.some((gymClass) => gymClass.id.toString() === current)
        ? current
        : classes[0].id.toString()
    );
  }, [classes]);

  const selectedClass = useMemo(
    () => classes.find((gymClass) => gymClass.id.toString() === selectedClassId),
    [classes, selectedClassId]
  );

  const { data: bookings = [] } = useQuery({
    queryKey: ["classBookings", selectedClassId, "RESERVED"],
    queryFn: () => bookingService.getClassBookings(Number(selectedClassId), "RESERVED"),
    enabled: !!selectedClassId,
  });

  const pendingBookings = useMemo(
    () => bookings.filter((booking) => booking.status === "RESERVED"),
    [bookings]
  );

  const updateMutation = useMutation({
    mutationFn: ({
      bookingId,
      status,
    }: {
      bookingId: number;
      status: BookingStatus;
    }) => bookingService.updateStatus(bookingId, status),
    onSuccess: () => {
      toast.success("Asistencia actualizada");
      queryClient.invalidateQueries({
        queryKey: ["classBookings", selectedClassId, "RESERVED"],
      });
      queryClient.invalidateQueries({
        queryKey: ["adminAttendanceClasses", selectedSede.id],
      });
      queryClient.invalidateQueries({ queryKey: ["myBookings"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Toma de asistencia</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar clase" />
          </SelectTrigger>
          <SelectContent>
            {classes.map((gymClass) => (
              <SelectItem key={gymClass.id} value={gymClass.id.toString()}>
                {gymClass.name} - {new Date(gymClass.date).toLocaleDateString("es-AR")}{" "}
                {gymClass.time}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {!selectedClass ? null : (
          <p className="text-sm text-muted-foreground">
            Clase seleccionada: {selectedClass.name}. Solo se muestran pendientes
            de marcar.
          </p>
        )}

        <div className="space-y-2">
          {pendingBookings.map((booking) => (
            <div
              key={booking.id}
              className="rounded-md border p-3 flex flex-wrap items-center gap-2 justify-between"
            >
              <div>
                <p className="font-medium">{getUserDisplayName(booking)}</p>
                {getUserSecondaryText(booking) ? (
                  <p className="text-xs text-muted-foreground">
                    {getUserSecondaryText(booking)}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">Pendiente</Badge>
                {attendanceStatusOptions.map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant="outline"
                    disabled={updateMutation.isPending}
                    onClick={() =>
                      updateMutation.mutate({ bookingId: booking.id, status })
                    }
                  >
                    {labels[status]}
                  </Button>
                ))}
              </div>
            </div>
          ))}
          {pendingBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay pendientes de asistencia para esta clase.
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};
