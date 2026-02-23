"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import apiService, { ApiValidationError } from "@/services/api.service";
import { BookingStatus, GymClass, User } from "@/types";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { useEnrollClass } from "@/hooks/use-class-mutations";
import { formatRemainingMmSs } from "@/lib/no-show-policy-utils";

interface AvailableClassesModalProps {
  user: User;
}

type AdminUserClassListItem = GymClass & { bookingStatus?: BookingStatus };

const VISIBLE_BOOKING_STATUSES = new Set<BookingStatus>([
  "RESERVED",
  "ATTENDED",
  "ABSENT",
  "CANCELLED",
]);

const getStatusPriority = (status?: BookingStatus) => {
  if (status === "RESERVED" || status === "ATTENDED" || status === "ABSENT") {
    return 2;
  }
  if (status === "CANCELLED") {
    return 1;
  }
  return 0;
};

const normalizeAdminUserClasses = (
  items: unknown[],
  userId: string
): AdminUserClassListItem[] => {
  const byId = new Map<number, AdminUserClassListItem>();

  for (const raw of items as any[]) {
    const status =
      typeof raw?.status === "string" ? (raw.status as BookingStatus) : undefined;
    if (status && !VISIBLE_BOOKING_STATUSES.has(status)) {
      continue;
    }

    const maybeClass = raw?.class ?? raw;
    if (!maybeClass || typeof maybeClass.id !== "number") {
      continue;
    }

    const users = Array.isArray(maybeClass.users) ? maybeClass.users : undefined;
    const shouldValidateUsersMembership = status !== "CANCELLED";
    if (
      shouldValidateUsersMembership &&
      users &&
      users.length > 0 &&
      !users.includes(userId)
    ) {
      continue;
    }

    const nextItem: AdminUserClassListItem = {
      ...(maybeClass as GymClass),
      bookingStatus: status,
    };
    const current = byId.get(maybeClass.id);
    if (
      !current ||
      getStatusPriority(nextItem.bookingStatus) >=
        getStatusPriority(current.bookingStatus)
    ) {
      byId.set(maybeClass.id, nextItem);
    }
  }

  return Array.from(byId.values());
};

const getApiErrorMessage = (error: unknown) => {
  if (error instanceof ApiValidationError && error.details?.length) {
    return error.details[0]?.message ?? null;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return null;
};

const getDateOnly = (value: string | Date | undefined) => {
  if (!value) return null;
  const raw = typeof value === "string" ? value : value.toISOString();
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
};

const getTimeMinutes = (time?: string | null) => {
  if (!time) return null;
  const match = time.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
};

const getNowDateOnly = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const isUpcomingClass = (gymClass: GymClass) => {
  const classDateOnly = getDateOnly(gymClass.date as string | Date);
  if (!classDateOnly) return false;

  const today = getNowDateOnly();
  if (classDateOnly > today) return true;
  if (classDateOnly < today) return false;

  const classMinutes = getTimeMinutes(gymClass.time);
  if (classMinutes === null) return true;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return classMinutes >= nowMinutes;
};

const getClassDateTimeMs = (gymClass: GymClass) => {
  const rawDateValue = gymClass.date as string | Date;
  const rawDate =
    typeof rawDateValue === "string"
      ? rawDateValue
      : new Date(rawDateValue).toISOString();
  const dateOnly = rawDate.includes("T") ? rawDate.split("T")[0] : rawDate;
  const timeMatch =
    typeof gymClass.time === "string" ? gymClass.time.match(/(\d{1,2}:\d{2})/) : null;
  const time = timeMatch?.[1] ?? "00:00";
  return new Date(`${dateOnly}T${time}`).getTime();
};

const isRestrictionError = (error: unknown) => {
  const status = (error as any)?.status;
  const message = (getApiErrorMessage(error) ?? "").toLowerCase();

  if (status === 421) {
    return true;
  }

  if (status === 403) {
    return (
      message.includes("strikes") ||
      message.includes("no pod") ||
      message.includes("reservar clases")
    );
  }

  return false;
};

const getRestrictionUntilFromError = (error: unknown) => {
  if (!(error instanceof ApiValidationError)) {
    return null;
  }

  const payload = error.payload ?? {};
  const candidates = [
    payload.restrictionUntil,
    payload.policy?.currentWindow?.restrictionUntil,
    payload.currentWindow?.restrictionUntil,
    payload.strikeAlert?.restrictionUntil,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && Number.isFinite(new Date(candidate).getTime())) {
      return candidate;
    }
  }

  return null;
};

const AvailableClassesModal = ({ user }: AvailableClassesModalProps) => {
  const [open, setOpen] = useState(false);
  const [isUserRestricted, setIsUserRestricted] = useState(false);
  const [restrictionMessage, setRestrictionMessage] = useState<string | null>(
    null
  );
  const [restrictionUntil, setRestrictionUntil] = useState<string | null>(null);
  const [restrictionNow, setRestrictionNow] = useState(Date.now());
  const { id: userId, sedeId } = user;
  const { data: availableClasses = [], isLoading } = useQuery({
    queryKey: ["classes", sedeId],
    queryFn: async () => {
      const response = await apiService.get(`/classes?sedeId=${sedeId}`);
      return response.classes || [];
    },
    enabled: open,
  });
  const { data: userClasses = [] } = useQuery({
    queryKey: ["userClasses", userId],
    queryFn: async () => {
      const response = await apiService.get(
        `/admin/users/${userId}/bookings?sedeId=${sedeId}`
      );
      return normalizeAdminUserClasses(
        response.bookings || response.items || response.classes || [],
        userId
      );
    },
    enabled: open,
  });
  const assignedClassIds = new Set(
    (userClasses as AdminUserClassListItem[])
      .filter((c) =>
        c.bookingStatus !== "CANCELLED" &&
        (Array.isArray(c.users) && c.users.length > 0 ? c.users.includes(userId) : true)
      )
      .map((c) => c.id)
  );
  const cancelledClassIds = new Set(
    (userClasses as AdminUserClassListItem[])
      .filter((c) => c.bookingStatus === "CANCELLED")
      .map((c) => c.id)
  );

  const { mutate: assignClass, isPending: isAssigning } =
    useEnrollClass(userId);
  const restrictionRemainingMs = useMemo(() => {
    if (!restrictionUntil) {
      return 0;
    }
    const endMs = new Date(restrictionUntil).getTime();
    if (!Number.isFinite(endMs)) {
      return 0;
    }
    return Math.max(0, endMs - restrictionNow);
  }, [restrictionNow, restrictionUntil]);
  const isRestrictionActive = isUserRestricted && (!restrictionUntil || restrictionRemainingMs > 0);

  useEffect(() => {
    if (!open || !isUserRestricted || !restrictionUntil) {
      return;
    }

    const endMs = new Date(restrictionUntil).getTime();
    if (!Number.isFinite(endMs)) {
      return;
    }

    if (endMs <= Date.now()) {
      setIsUserRestricted(false);
      setRestrictionMessage(null);
      setRestrictionUntil(null);
      return;
    }

    const interval = window.setInterval(() => setRestrictionNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [isUserRestricted, open, restrictionUntil]);

  useEffect(() => {
    if (!isUserRestricted || !restrictionUntil) {
      return;
    }

    if (restrictionRemainingMs > 0) {
      return;
    }

    setIsUserRestricted(false);
    setRestrictionMessage(null);
    setRestrictionUntil(null);
  }, [isUserRestricted, restrictionRemainingMs, restrictionUntil]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Cargando clases...</p>
      </div>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setIsUserRestricted(false);
          setRestrictionMessage(null);
          setRestrictionUntil(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Asignar Clase
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Asignar Clase al Usuario</DialogTitle>
          <DialogDescription>
            Selecciona una clase para asignar al usuario
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[400px] overflow-y-auto">
          {isRestrictionActive ? (
            <div className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
              <div>
                {restrictionMessage ??
                  "Este usuario tiene una restriccion activa y no puede reservar clases por el momento."}
              </div>
              {restrictionUntil && restrictionRemainingMs > 0 ? (
                <div className="mt-1 font-medium">
                  Se habilita en {formatRemainingMmSs(restrictionRemainingMs)}.
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="space-y-2">
            {availableClasses
              .filter((gymClass: GymClass) => {
                return isUpcomingClass(gymClass);
              })
              .sort(
                (a: GymClass, b: GymClass) =>
                  getClassDateTimeMs(a) - getClassDateTimeMs(b)
              )
              .map((gymClass: GymClass) => (
                <div
                  key={gymClass.id}
                  className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {gymClass.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {new Date(gymClass.date).toLocaleDateString("es-ES")} -{" "}
                      {gymClass.time}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {gymClass.enrolled}/{gymClass.capacity} inscritos
                    </p>
                  </div>
                  {assignedClassIds.has(gymClass.id) ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Asignada
                    </p>
                  ) : cancelledClassIds.has(gymClass.id) ? (
                    <span className="inline-flex items-center rounded-md border border-red-200 bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                      Clase cancelada
                    </span>
                  ) : (
                    <Button
                      onClick={() =>
                        assignClass(gymClass, {
                          onError: (error) => {
                            if (isRestrictionError(error)) {
                              setIsUserRestricted(true);
                              setRestrictionNow(Date.now());
                              setRestrictionMessage(
                                getApiErrorMessage(error) ??
                                  "Este usuario tiene una restriccion activa y no puede reservar clases por el momento."
                              );
                              setRestrictionUntil(getRestrictionUntilFromError(error));
                            }
                          },
                        })
                      }
                      disabled={
                        isAssigning ||
                        isRestrictionActive ||
                        gymClass.enrolled >= gymClass.capacity
                      }
                      size="sm"
                    >
                      {isRestrictionActive
                        ? restrictionUntil && restrictionRemainingMs > 0
                          ? `Restringido (${formatRemainingMmSs(restrictionRemainingMs)})`
                          : "Restringido"
                        : gymClass.enrolled >= gymClass.capacity
                        ? "Llena"
                        : "Asignar"}
                    </Button>
                  )}
                </div>
              ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AvailableClassesModal;
