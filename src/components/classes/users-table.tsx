"use client";

import { DataTable } from "../ui/data-table";
import { Row, type ColumnDef } from "@tanstack/react-table";
import { type GymClass, type UnenrollResponse } from "@/types";
import { columns } from "./columns";
import { Button } from "../ui/button";
import { ClerkLoaded, ClerkLoading, useAuth } from "@clerk/nextjs";
import apiService, { ApiValidationError } from "@/services/api.service";
import { toast } from "react-hot-toast";
import { useEffect, useMemo, useState } from "react";
import { Skeleton } from "../ui/skeleton";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/store/useStore";
import { useEvaluateChallenges } from "@/hooks/use-evaluate-challenge";
import { ClassCancelConfirmDialog } from "@/components/classes/class-cancel-confirm-dialog";
import bookingService from "@/services/booking.service";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardAction,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { showWaitlistPromotionToast } from "@/lib/waitlist-promotion-toast";
import { showStrikeAlertToast } from "@/lib/strike-alert-toast";
import {
  formatRemainingMmSs,
  getRestrictionRemainingMs,
  isNoShowRestricted,
} from "@/lib/no-show-policy-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MEDICAL_EXAM_URL =
  "https://medi-book-web.onrender.com/patient/reservation-turns";

const getApiErrorMessage = (error: unknown) => {
  if (error instanceof ApiValidationError && error.details?.length) {
    return error.details[0]?.message ?? null;
  }

  return null;
};

const UsersActionColumn = ({
  row,
  onClassesChanged,
}: {
  row: Row<GymClass>;
  onClassesChanged?: () => void;
}) => {
  const { userId } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [showMedicalModal, setShowMedicalModal] = useState(false);
  const [showCancelAlert, setShowCancelAlert] = useState(false);
  const queryClient = useQueryClient();
  const { selectedSede } = useStore();
  const { mutate: evaluateChallenges } = useEvaluateChallenges();
  const { data: policy } = useQuery({
    queryKey: ["noShowPolicy"],
    queryFn: () => bookingService.getNoShowPolicy(),
    enabled: !!userId,
    refetchOnWindowFocus: true,
  });
  const [restrictionNow, setRestrictionNow] = useState(Date.now());

  useEffect(() => {
    if (!isNoShowRestricted(policy) || !policy?.currentWindow?.restrictionUntil) {
      return;
    }
    const interval = window.setInterval(() => setRestrictionNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [policy]);

  const restrictionRemainingMs = getRestrictionRemainingMs(policy, restrictionNow);
  const isRestrictionActive = isNoShowRestricted(policy);
  const enrollButtonLabel = useMemo(() => {
    if (enrolled) {
      return isLoading ? "Cancelando..." : "Cancelar inscripciÃ³n";
    }
    if (isRestrictionActive) {
      return restrictionRemainingMs > 0
        ? `Restringido (${formatRemainingMmSs(restrictionRemainingMs)})`
        : "Restringido";
    }
    return isLoading ? "Inscribiendo..." : "Inscribirse";
  }, [enrolled, isLoading, isRestrictionActive, restrictionRemainingMs]);

  useEffect(() => {
    if (userId) {
      setEnrolled(row.original.users.includes(userId));
    }
  }, [userId, row.original.users]);

  const handleEnroll = async (classId: number) => {
    try {
      setIsLoading(true);
      const response = await apiService.post(
        enrolled ? "/user/unenroll" : "/user/enroll",
        {
          classId,
        }
      );

      const points = response.pointsAwarded;

      const wasEnrolled = enrolled;
      setEnrolled(!enrolled);

      toast.success(
        enrolled
          ? "Inscripción cancelada con éxito"
          : `Inscripción realizada con éxito\n Puntos obtenidos: ${
              points ?? 10
            }`,
        { id: "enroll-class" }
      );
      if (enrolled) {
        showWaitlistPromotionToast((response as UnenrollResponse)?.waitlistPromotion);
        showStrikeAlertToast((response as UnenrollResponse)?.strikeAlert);
      }

      onClassesChanged?.();

      queryClient.invalidateQueries({
        queryKey: [
          "leaderboard-users",
          { period: "all", sedeId: selectedSede.id },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "leaderboard-users",
          { period: "30d", sedeId: selectedSede.id },
        ],
      });

      if (userId) {
        queryClient.invalidateQueries({
          queryKey: ["userBadges", userId],
        });
      }

      if (!wasEnrolled) {
        evaluateChallenges();
      }

      router.refresh();
    } catch (error: any) {
      const backendMessage = getApiErrorMessage(error);
      if (backendMessage && error?.status !== 421) {
        toast.error(backendMessage, { id: "enroll-class" });
        return;
      }
      if (error?.status === 403) {
        queryClient.invalidateQueries({ queryKey: ["noShowPolicy"] });
        toast.error("Con el plan básico solo puedes inscribirte en 3 clases", {
          id: "enroll-class",
        });
      } else if (error?.status === 421) {
        setShowMedicalModal(true);
      } else {
        toast.error("Hubo un error al procesar tu solicitud", {
          id: "enroll-class",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenMedicalExam = () => {
    window.open(MEDICAL_EXAM_URL, "_blank", "noopener,noreferrer");
    setShowMedicalModal(false);
  };

  return (
    <>
      <ClassCancelConfirmDialog
        open={showCancelAlert}
        onOpenChange={setShowCancelAlert}
        className={`"${row.original.name}"`}
        classDateLabel={
          row.original.date
            ? new Date(row.original.date).toLocaleDateString("es-AR")
            : undefined
        }
        classTime={row.original.time}
        isPending={isLoading}
        onConfirm={() => {
          handleEnroll(row.original.id).finally(() => setShowCancelAlert(false));
        }}
      />
      <Dialog open={showMedicalModal} onOpenChange={setShowMedicalModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apto Médico Requerido</DialogTitle>
            <DialogDescription>
              Para inscribirte en una clase debes realizar el apto médico.
              Puedes hacerlo en este link.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowMedicalModal(false)}
              aria-label="Cerrar modal"
            >
              Cerrar
            </Button>
            <Button
              onClick={handleOpenMedicalExam}
              aria-label="Ir a realizar apto médico"
            >
              Realizar Apto Médico
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="px-4 py-2 flex gap-2 items-center justify-end">
        <ClerkLoading>
          <Skeleton className="w-[150px] h-[36px]" />
        </ClerkLoading>
        <ClerkLoaded>
          {enrolled ? (
            <Button
              variant="destructive"
              onClick={() => setShowCancelAlert(true)}
              disabled={isLoading}
              className="w-[150px]"
            >
              {isLoading ? "Cancelando..." : "Cancelar inscripción"}
            </Button>
          ) : (
            <Button
              variant="default"
              onClick={() => handleEnroll(row.original.id)}
              disabled={isLoading || isRestrictionActive}
              className="w-[150px]"
            >
              {enrollButtonLabel}
            </Button>
          )}
        </ClerkLoaded>
      </div>
    </>
  );
};
const MobileActionButton = ({
  gymClass,
  onClassesChanged,
}: {
  gymClass: GymClass;
  onClassesChanged?: () => void;
}) => {
  const { userId } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [showMedicalModal, setShowMedicalModal] = useState(false);
  const [showCancelAlert, setShowCancelAlert] = useState(false);
  const queryClient = useQueryClient();
  const { selectedSede } = useStore();
  const { mutate: evaluateChallenges } = useEvaluateChallenges();
  const { data: policy } = useQuery({
    queryKey: ["noShowPolicy"],
    queryFn: () => bookingService.getNoShowPolicy(),
    enabled: !!userId,
    refetchOnWindowFocus: true,
  });
  const [restrictionNow, setRestrictionNow] = useState(Date.now());

  useEffect(() => {
    if (!isNoShowRestricted(policy) || !policy?.currentWindow?.restrictionUntil) {
      return;
    }
    const interval = window.setInterval(() => setRestrictionNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [policy]);

  const restrictionRemainingMs = getRestrictionRemainingMs(policy, restrictionNow);
  const isRestrictionActive = isNoShowRestricted(policy);
  const enrollButtonLabel = useMemo(() => {
    if (enrolled) {
      return isLoading ? "Cancelando..." : "Cancelar inscripciÃ³n";
    }
    if (isRestrictionActive) {
      return restrictionRemainingMs > 0
        ? `Restringido (${formatRemainingMmSs(restrictionRemainingMs)})`
        : "Restringido";
    }
    return isLoading ? "Inscribiendo..." : "Inscribirse";
  }, [enrolled, isLoading, isRestrictionActive, restrictionRemainingMs]);

  useEffect(() => {
    if (userId) {
      setEnrolled(gymClass.users.includes(userId));
    }
  }, [userId, gymClass.users]);

  const handleEnroll = async (classId: number) => {
    try {
      setIsLoading(true);
      const response = await apiService.post(
        enrolled ? "/user/unenroll" : "/user/enroll",
        {
        classId,
        }
      );

      const wasEnrolled = enrolled;
      setEnrolled(!enrolled);

      toast.success(
        enrolled
          ? "Inscripción cancelada con éxito"
          : "Inscripción realizada con éxito",
        { id: "enroll-class" }
      );
      if (enrolled) {
        showWaitlistPromotionToast((response as UnenrollResponse)?.waitlistPromotion);
        showStrikeAlertToast((response as UnenrollResponse)?.strikeAlert);
      }

      onClassesChanged?.();

      queryClient.invalidateQueries({
        queryKey: [
          "leaderboard-users",
          { period: "all", sedeId: selectedSede.id },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "leaderboard-users",
          { period: "30d", sedeId: selectedSede.id },
        ],
      });

      if (userId) {
        queryClient.invalidateQueries({
          queryKey: ["userBadges", userId],
        });
      }

      if (!wasEnrolled) {
        evaluateChallenges();
      }

      router.refresh();
    } catch (error: any) {
      const backendMessage = getApiErrorMessage(error);
      if (backendMessage && error?.status !== 421) {
        toast.error(backendMessage, { id: "enroll-class" });
        return;
      }
      if (error?.status === 403) {
        queryClient.invalidateQueries({ queryKey: ["noShowPolicy"] });
        toast.error("Con el plan básico solo puedes inscribirte en 3 clases", {
          id: "enroll-class",
        });
      } else if (error?.status === 421) {
        setShowMedicalModal(true);
      } else {
        toast.error("Hubo un error al procesar tu solicitud", {
          id: "enroll-class",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenMedicalExam = () => {
    window.open(MEDICAL_EXAM_URL, "_blank", "noopener,noreferrer");
    setShowMedicalModal(false);
  };

  return (
    <>
      <ClassCancelConfirmDialog
        open={showCancelAlert}
        onOpenChange={setShowCancelAlert}
        className={`"${gymClass.name}"`}
        classDateLabel={
          gymClass.date ? new Date(gymClass.date).toLocaleDateString("es-AR") : undefined
        }
        classTime={gymClass.time}
        isPending={isLoading}
        onConfirm={() => {
          handleEnroll(gymClass.id).finally(() => setShowCancelAlert(false));
        }}
      />
      <Dialog open={showMedicalModal} onOpenChange={setShowMedicalModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apto Médico Requerido</DialogTitle>
            <DialogDescription>
              Para inscribirte en una clase debes realizar el apto médico.
              Puedes hacerlo en este link.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowMedicalModal(false)}
              aria-label="Cerrar modal"
            >
              Cerrar
            </Button>
            <Button
              onClick={handleOpenMedicalExam}
              aria-label="Ir a realizar apto médico"
            >
              Realizar Apto Médico
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CardAction className="mt-2">
        <ClerkLoading>
          <Skeleton className="w-full h-[36px]" />
        </ClerkLoading>
        <ClerkLoaded>
          {enrolled ? (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setShowCancelAlert(true)}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Cancelando..." : "Cancelar inscripción"}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="default"
              onClick={() => handleEnroll(gymClass.id)}
              disabled={isLoading || isRestrictionActive}
              className="w-full"
            >
              {enrollButtonLabel}
            </Button>
          )}
        </ClerkLoaded>
      </CardAction>
    </>
  );
};

export const UsersClassesTable = ({
  classes,
  onClassesChanged,
}: {
  classes: GymClass[];
  onClassesChanged?: () => void;
}) => {
  const usersColumns: ColumnDef<GymClass>[] = [
    ...columns,
    {
      accessorKey: "actions",
      header: () => (
        <div className="w-min px-4 py-2 flex gap-2 items-center justify-center">
          Acciones
        </div>
      ),
      cell: ({ row }) => (
        <UsersActionColumn row={row} onClassesChanged={onClassesChanged} />
      ),
    },
  ];

  const getRowClassName = (gymClass: GymClass): string => {
    if (gymClass.isBoostedForPoints) {
      return "boosted-row";
    }
    return "";
  };

  const sortedClasses = classes.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden sm:block">
        <DataTable
          columns={usersColumns}
          data={sortedClasses}
          headerClassName="last:items-center last:justify-end last:w-min last:w-[100px] last:min-w-[100px]"
          getRowClassName={getRowClassName}
        />
      </div>

      {/* Mobile */}
      <div className="sm:hidden space-y-3">
        {sortedClasses.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-gray-500 dark:text-gray-400">
                No hay clases disponibles.
              </p>
            </CardContent>
          </Card>
        ) : (
          sortedClasses.map((cls) => (
            <Card
              key={cls.id}
              className={cn("overflow-hidden", getRowClassName(cls))}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{cls.name}</CardTitle>
                    {cls.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {cls.description}
                      </p>
                    )}
                  </div>
                </div>

                <MobileActionButton
                  gymClass={cls}
                  onClassesChanged={onClassesChanged}
                />
              </CardHeader>

              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-500 dark:text-gray-400">Fecha</div>
                  <div className="text-gray-900 dark:text-gray-100 text-right">
                    {cls.date
                      ? new Date(cls.date).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "-"}
                  </div>

                  <div className="text-gray-500 dark:text-gray-400">Hora</div>
                  <div className="text-gray-900 dark:text-gray-100 text-right">
                    {cls.time ?? "-"}
                  </div>

                  <div className="text-gray-500 dark:text-gray-400">
                    Capacidad
                  </div>
                  <div className="text-gray-900 dark:text-gray-100 text-right">
                    {typeof cls.capacity === "number" ? cls.capacity : "-"}
                  </div>

                  <div className="text-gray-500 dark:text-gray-400">
                    Inscritos
                  </div>
                  <div className="text-gray-900 dark:text-gray-100 text-right">
                    {typeof cls.enrolled === "number" ? cls.enrolled : "-"}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
};
