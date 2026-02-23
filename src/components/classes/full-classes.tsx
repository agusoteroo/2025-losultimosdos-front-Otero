"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "@/components/classes/columns";
import { BookingStatus, ClassBooking, GymClass, UnenrollResponse } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import bookingService from "@/services/booking.service";
import apiService, { ApiValidationError } from "@/services/api.service";
import { useStore } from "@/store/useStore";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { ClassCancelConfirmDialog } from "@/components/classes/class-cancel-confirm-dialog";
import { useEvaluateChallenges } from "@/hooks/use-evaluate-challenge";
import { showWaitlistPromotionToast } from "@/lib/waitlist-promotion-toast";
import { showStrikeAlertToast } from "@/lib/strike-alert-toast";
import {
  addTrackedWaitlistClass,
  removeTrackedWaitlistClass,
} from "@/lib/user-waitlist-tracker";
import {
  formatRemainingMmSs,
  getRestrictionRemainingMs,
  isNoShowRestricted,
} from "@/lib/no-show-policy-utils";

const getErrorMessage = (error: unknown) => {
  if (error instanceof ApiValidationError && error.details?.length) {
    return error.details[0]?.message ?? "No pudimos procesar la solicitud";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "No pudimos procesar la solicitud";
};

export const FullClasses = ({ fullClasses }: { fullClasses: GymClass[] }) => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const { selectedSede } = useStore();
  const router = useRouter();
  const [classToCancel, setClassToCancel] = useState<GymClass | null>(null);
  const previousWaitlistedIdsRef = useRef<Set<number> | null>(null);
  const previousBookingStatusByClassRef = useRef<Map<number, BookingStatus>>(new Map());
  const { mutate: evaluateChallenges } = useEvaluateChallenges();

  const { data: myWaitlists = [] } = useQuery({
    queryKey: ["myWaitlists", selectedSede.id],
    queryFn: () => bookingService.getMyWaitlists(selectedSede.id),
    enabled: !!userId,
  });

  const { data: myBookings = [] } = useQuery({
    queryKey: ["myBookings", selectedSede.id],
    queryFn: () => bookingService.getMyBookings(selectedSede.id),
    enabled: !!userId,
  });
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

  const waitlistedClassIds = useMemo(() => {
    const ids = new Set<number>();

    myWaitlists.forEach((booking: ClassBooking) => {
      if (booking.status !== "WAITLIST") {
        return;
      }

      if (typeof booking.classId === "number") {
        ids.add(booking.classId);
        return;
      }

      if (typeof booking.class?.id === "number") {
        ids.add(booking.class.id);
      }
    });

    return ids;
  }, [myWaitlists]);

  useEffect(() => {
    if (!userId) {
      previousWaitlistedIdsRef.current = new Set();
      return;
    }

    const previousWaitlisted = previousWaitlistedIdsRef.current;
    const previousStatuses = previousBookingStatusByClassRef.current;
    const currentStatuses = new Map<number, BookingStatus>();
    const currentNames = new Map<number, string>();
    let detectedPromotion = false;

    myBookings.forEach((booking) => {
      if (typeof booking.classId !== "number") {
        return;
      }

      currentStatuses.set(booking.classId, booking.status);
      if (booking.class?.name) {
        currentNames.set(booking.classId, booking.class.name);
      }
    });

    const finalStatusesThatMeanEnrolled: BookingStatus[] = ["RESERVED", "ATTENDED", "ABSENT"];

    currentStatuses.forEach((status, classId) => {
      const previousStatus = previousStatuses.get(classId);
      const wasWaitlistedBefore =
        previousStatus === "WAITLIST" || previousWaitlisted?.has(classId);
      const isNowEnrolled = finalStatusesThatMeanEnrolled.includes(status);

      if (!wasWaitlistedBefore || !isNowEnrolled) {
        return;
      }

      const className =
        currentNames.get(classId) ??
        fullClasses.find((gymClass) => gymClass.id === classId)?.name ??
        "tu clase";

      detectedPromotion = true;
    });

    previousWaitlistedIdsRef.current = new Set(waitlistedClassIds);
    previousBookingStatusByClassRef.current = currentStatuses;

    if (detectedPromotion) {
      queryClient.invalidateQueries({
        queryKey: ["leaderboard-users", { period: "all", sedeId: selectedSede.id }],
      });
      queryClient.invalidateQueries({
        queryKey: ["leaderboard-users", { period: "30d", sedeId: selectedSede.id }],
      });
      queryClient.invalidateQueries({ queryKey: ["leaderboard-sedes"] });
      queryClient.invalidateQueries({ queryKey: ["my-gamification", selectedSede.id] });
      queryClient.invalidateQueries({ queryKey: ["noShowPolicy"] });
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ["userBadges", userId] });
      }
      evaluateChallenges();
    }
  }, [evaluateChallenges, fullClasses, myBookings, queryClient, selectedSede.id, userId, waitlistedClassIds]);

  const joinWaitlistMutation = useMutation({
    mutationFn: (classId: number) => bookingService.joinWaitlist(classId),
    onSuccess: (_response, classId) => {
      toast.success("Te sumaste a la lista de espera");
      addTrackedWaitlistClass(userId, selectedSede.id, classId);
      queryClient.invalidateQueries({
        queryKey: ["myBookings", selectedSede.id],
      });
      queryClient.invalidateQueries({ queryKey: ["myWaitlists", selectedSede.id] });
      queryClient.invalidateQueries({ queryKey: ["classes", selectedSede.id] });
      queryClient.invalidateQueries({ queryKey: ["noShowPolicy"] });
    },
    onError: (error: any) => {
      if (error?.status === 403) {
        queryClient.invalidateQueries({ queryKey: ["noShowPolicy"] });
      }
      toast.error(getErrorMessage(error));
    },
  });

  const leaveWaitlistMutation = useMutation({
    mutationFn: (classId: number) => bookingService.leaveWaitlist(classId),
    onSuccess: (_response, classId) => {
      toast.success("Saliste de la lista de espera");
      removeTrackedWaitlistClass(userId, selectedSede.id, classId);
      queryClient.invalidateQueries({
        queryKey: ["myBookings", selectedSede.id],
      });
      queryClient.invalidateQueries({ queryKey: ["myWaitlists", selectedSede.id] });
      queryClient.invalidateQueries({ queryKey: ["classes", selectedSede.id] });
      queryClient.invalidateQueries({ queryKey: ["noShowPolicy"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const cancelEnrollmentMutation = useMutation({
    mutationFn: (classId: number) =>
      apiService.post<UnenrollResponse>("/user/unenroll", { classId }),
    onSuccess: (response) => {
      toast.success("Clase cancelada");
      showWaitlistPromotionToast(response?.waitlistPromotion);
      showStrikeAlertToast(response?.strikeAlert);
      if (classToCancel) {
        removeTrackedWaitlistClass(userId, selectedSede.id, classToCancel.id);
      }
      queryClient.invalidateQueries({ queryKey: ["myBookings", selectedSede.id] });
      queryClient.invalidateQueries({ queryKey: ["myWaitlists", selectedSede.id] });
      queryClient.invalidateQueries({ queryKey: ["classes", selectedSede.id] });
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
      setClassToCancel(null);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const fullColumns: ColumnDef<GymClass>[] = [
    ...columns.slice(0, 3),
    {
      id: "actions",
      header: "Accion",
      cell: ({ row }) => {
        const isEnrolled = userId ? row.original.users.includes(userId) : false;
        const isWaitlisted = waitlistedClassIds.has(row.original.id);
        const isMutating =
          joinWaitlistMutation.isPending ||
          leaveWaitlistMutation.isPending ||
          cancelEnrollmentMutation.isPending;
        const isJoinWaitlistAction = !isEnrolled && !isWaitlisted;
        const disableForRestriction = isJoinWaitlistAction && isRestrictionActive;

        return (
          <Button
            size="sm"
            variant={isEnrolled ? "destructive" : "outline"}
            disabled={!userId || isMutating || disableForRestriction}
            onClick={() =>
              isEnrolled
                ? setClassToCancel(row.original)
                : isWaitlisted
                ? leaveWaitlistMutation.mutate(row.original.id)
                : joinWaitlistMutation.mutate(row.original.id)
            }
          >
            {isEnrolled
              ? "Cancelar inscripcion"
              : isWaitlisted
              ? "Salir de lista de espera"
              : isRestrictionActive
              ? restrictionRemainingMs > 0
                ? `Restringido (${formatRemainingMmSs(restrictionRemainingMs)})`
                : "Restringido"
              : "Sumarme a lista de espera"}
          </Button>
        );
      },
    },
  ];

  return (
    <>
      <ClassCancelConfirmDialog
        open={!!classToCancel}
        onOpenChange={(open) => !open && setClassToCancel(null)}
        className={classToCancel ? `"${classToCancel.name}"` : undefined}
        classDateLabel={
          classToCancel ? new Date(classToCancel.date).toLocaleDateString("es-AR") : undefined
        }
        classTime={classToCancel?.time}
        isPending={cancelEnrollmentMutation.isPending}
        onConfirm={() => {
          if (!classToCancel) {
            return;
          }
          cancelEnrollmentMutation.mutate(classToCancel.id);
        }}
      />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-lg font-bold">Clases Completas</h1>
      </div>
      <DataTable
        columns={fullColumns}
        data={fullClasses || []}
        headerClassName="last:items-center last:justify-end last:w-min"
      />
    </>
  );
};
