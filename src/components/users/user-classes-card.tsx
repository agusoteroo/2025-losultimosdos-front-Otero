"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import apiService from "@/services/api.service";
import { BookingStatus, GymClass, User } from "@/types";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import AvailableClassesModal from "../classes/available-classes-modal";
import { useUnenrollClass } from "@/hooks/use-class-mutations";

interface UserClassesCardProps {
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
    if (users && users.length > 0 && !users.includes(userId)) {
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

const getClassDateTimeMs = (gymClass: GymClass) => {
  const rawDateValue = gymClass.date as string | Date;
  const rawDate =
    typeof rawDateValue === "string"
      ? rawDateValue
      : new Date(rawDateValue).toISOString();
  const dateOnly = rawDate.includes("T") ? rawDate.split("T")[0] : rawDate;
  const time = typeof gymClass.time === "string" && gymClass.time ? gymClass.time : "00:00";
  return new Date(`${dateOnly}T${time}`).getTime();
};

const useIsMobile = (query = "(max-width: 640px)") => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsMobile("matches" in e ? e.matches : (e as MediaQueryList).matches);

    onChange(mql);
    mql.addEventListener?.("change", onChange as any);
    return () => mql.removeEventListener?.("change", onChange as any);
  }, [query]);

  return isMobile;
};

const CancelledLabel = ({ mobile = false }: { mobile?: boolean }) => (
  <div
    className={
      mobile
        ? "w-full rounded-md border border-red-200 bg-red-100 px-3 py-2 text-center text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
        : "inline-flex items-center rounded-md border border-red-200 bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
    }
  >
    Clase cancelada
  </div>
);

const ReadOnlyStatusLabel = ({ mobile = false }: { mobile?: boolean }) => (
  <div
    className={
      mobile
        ? "w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-center text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        : "inline-flex items-center rounded-md border border-gray-200 bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
    }
  >
    Sin accion disponible
  </div>
);

const UserClassesCard = ({ user }: UserClassesCardProps) => {
  const { id: userId, sedeId } = user;
  const isMobile = useIsMobile();
  const [unenrollingClassId, setUnenrollingClassId] = useState<number | null>(
    null
  );

  const { data: userClasses = [], isLoading: isLoadingClasses } = useQuery({
    queryKey: ["userClasses", user.id],
    queryFn: async () => {
      const response = await apiService.get(
        `/admin/users/${userId}/bookings?sedeId=${sedeId}`
      );
      return normalizeAdminUserClasses(
        response.bookings || response.items || response.classes || [],
        userId
      );
    },
  });

  const visibleUserClasses = useMemo(() => {
    const seen = new Set<number>();
    const now = Date.now();

    return (userClasses as AdminUserClassListItem[])
      .filter((c) => {
        if (!c || typeof c.id !== "number" || seen.has(c.id)) {
          return false;
        }
        seen.add(c.id);
        return true;
      })
      .filter((c) => c.bookingStatus !== "CANCELLED")
      .filter((c) => {
        const classDateTimeMs = getClassDateTimeMs(c);
        return Number.isFinite(classDateTimeMs) && classDateTimeMs >= now;
      })
      .filter((c) =>
        Array.isArray(c.users) && c.users.length > 0
          ? c.users.includes(userId)
          : true
      );
  }, [userClasses, userId]);

  const { mutate: unenrollClass } = useUnenrollClass(userId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clases del Usuario</CardTitle>
        <CardAction>
          <AvailableClassesModal user={user} />
        </CardAction>
      </CardHeader>
      <CardContent>
        {isLoadingClasses ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              Cargando clases del usuario...
            </p>
          </div>
        ) : visibleUserClasses.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No hay clases registradas para este usuario
          </p>
        ) : isMobile ? (
          <div className="space-y-3">
            {visibleUserClasses.map((c) => {
              const fecha = c.date
                ? new Date(c.date).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "-";

              return (
                <div
                  key={c.id}
                  className="grid grid-cols-2 gap-2 rounded-lg border p-3 text-sm"
                >
                  <div className="text-gray-500 dark:text-gray-400">Clase</div>
                  <div className="text-right text-gray-900 dark:text-gray-100">
                    {c.name}
                  </div>

                  <div className="text-gray-500 dark:text-gray-400">Fecha</div>
                  <div className="text-right text-gray-900 dark:text-gray-100">
                    {fecha}
                  </div>

                  <div className="text-gray-500 dark:text-gray-400">Hora</div>
                  <div className="text-right text-gray-900 dark:text-gray-100">
                    {c.time ?? "-"}
                  </div>

                  <div className="col-span-2 pt-2">
                    {c.bookingStatus === "CANCELLED" ? (
                      <CancelledLabel mobile />
                    ) : c.bookingStatus !== "RESERVED" ? (
                      <ReadOnlyStatusLabel mobile />
                    ) : (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setUnenrollingClassId(c.id);
                          unenrollClass(c, {
                            onSettled: () => setUnenrollingClassId(null),
                          });
                        }}
                        disabled={unenrollingClassId === c.id}
                      >
                        {unenrollingClassId === c.id
                          ? "Cancelando..."
                          : "Cancelar inscripcion"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader className="border-b dark:border-gray-700">
                <TableRow>
                  <TableHead className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Clase
                  </TableHead>
                  <TableHead className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Fecha
                  </TableHead>
                  <TableHead className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Hora
                  </TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleUserClasses.map((c) => (
                  <TableRow
                    key={c.id}
                    className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <TableCell className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                      {c.name}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {c.date
                        ? new Date(c.date).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "-"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {c.time ?? "-"}
                    </TableCell>
                    <TableCell className="flex items-center justify-center px-4 py-3">
                      {c.bookingStatus === "CANCELLED" ? (
                        <CancelledLabel />
                      ) : c.bookingStatus !== "RESERVED" ? (
                        <ReadOnlyStatusLabel />
                      ) : (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setUnenrollingClassId(c.id);
                            unenrollClass(c, {
                              onSettled: () => setUnenrollingClassId(null),
                            });
                          }}
                          disabled={unenrollingClassId === c.id}
                        >
                          {unenrollingClassId === c.id
                            ? "Cancelando..."
                            : "Cancelar inscripcion"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserClassesCard;
