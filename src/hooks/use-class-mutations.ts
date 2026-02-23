import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminBookingStrikeAlert, GymClass, UnenrollResponse } from "@/types";
import apiService, { ApiValidationError } from "@/services/api.service";
import { toast } from "react-hot-toast";
import { useStore } from "@/store/useStore";
import { showWaitlistPromotionToast } from "@/lib/waitlist-promotion-toast";

interface MutationContext {
  prevUserClasses?: GymClass[];
  prevClasses?: GymClass[];
  classesQueryKey?: readonly [string, number];
}

const getApiErrorMessage = (error: unknown) => {
  if (error instanceof ApiValidationError && error.details?.length) {
    return error.details[0]?.message ?? null;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return null;
};

const getClassSedeId = (classItem: GymClass, fallbackSedeId: number) =>
  typeof classItem.sedeId === "number" ? classItem.sedeId : fallbackSedeId;

const showAdminUnenrollStrikeToast = (
  strikeAlert?: AdminBookingStrikeAlert | null
) => {
  if (!strikeAlert || strikeAlert.type !== "LATE_CANCELLATION_STRIKE") {
    return;
  }

  if (strikeAlert.isRestricted) {
    const unlockAt = strikeAlert.restrictionUntil
      ? new Date(strikeAlert.restrictionUntil).toLocaleTimeString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

    toast(
      unlockAt
        ? `La desasignacion fue tardia y el usuario quedo bloqueado temporalmente para reservar (hasta ${unlockAt}).`
        : "La desasignacion fue tardia y el usuario quedo bloqueado temporalmente para reservar.",
      { icon: "⚠️", id: `late-cancel-strike-${strikeAlert.userId}` }
    );
    return;
  }

  toast(
    `La desasignacion fue tardia y se registro un strike al usuario (${strikeAlert.strikes}/${strikeAlert.threshold}).`,
    { icon: "ℹ️", id: `late-cancel-strike-${strikeAlert.userId}` }
  );
};

export const useEnrollClass = (userId: string, onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  const { selectedSede } = useStore();
  return useMutation<GymClass, Error, GymClass, MutationContext>({
    mutationFn: async (classItem: GymClass) => {
      const response = await apiService.post<{ class: GymClass }>(
        `/admin/class/${classItem.id}/enroll`,
        { userId }
      );
      return response.class;
    },

    onMutate: async (classItem) => {
      const classSedeId = getClassSedeId(classItem, selectedSede.id);
      const classesQueryKey = ["classes", classSedeId] as const;
      await queryClient.cancelQueries({ queryKey: ["userClasses", userId] });
      await queryClient.cancelQueries({ queryKey: classesQueryKey });

      toast.loading("Asignando clase...", { id: "enroll-class" });
      const prevUserClasses = queryClient.getQueryData<GymClass[]>([
        "userClasses",
        userId,
      ]);
      const prevClasses = queryClient.getQueryData<GymClass[]>(classesQueryKey);

      queryClient.setQueryData<GymClass[]>(
        ["userClasses", userId],
        (old = []) => [...old, classItem]
      );

      queryClient.setQueryData<GymClass[]>(classesQueryKey, (old = []) =>
        old.map((c) =>
          c.id === classItem.id
            ? { ...c, enrolled: c.enrolled + 1, users: [...c.users, userId] }
            : c
        )
      );

      return { prevUserClasses, prevClasses, classesQueryKey };
    },

    onSuccess: () => {
      toast.success("Clase asignada correctamente", { id: "enroll-class" });
    },

    onError: (err, classItem, context) => {
      if (context?.prevUserClasses) {
        queryClient.setQueryData(
          ["userClasses", userId],
          context.prevUserClasses
        );
      }
      if (context?.prevClasses) {
        queryClient.setQueryData(
          context.classesQueryKey ??
            (["classes", getClassSedeId(classItem, selectedSede.id)] as const),
          context.prevClasses
        );
      }
      const backendMessage = getApiErrorMessage(err);
      if ((err as any).status === 403) {
        toast.error(
          backendMessage ?? "El usuario ya esta inscrito en el maximo de clases",
          { id: "enroll-class" }
        );
      } else {
        toast.error(backendMessage ?? "Error al asignar la clase", {
          id: "enroll-class",
        });
      }
    },

    onSettled: (_data, _error, classItem) => {
      const classSedeId = getClassSedeId(classItem, selectedSede.id);
      const classesQueryKey = ["classes", classSedeId] as const;
      queryClient.invalidateQueries({ queryKey: ["userClasses", userId] });
      queryClient.invalidateQueries({ queryKey: classesQueryKey });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["goals", classSedeId] });
      queryClient.invalidateQueries({ queryKey: ["goals", selectedSede.id] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard-users"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard-sedes"] });
    },
  });
};

export const useUnenrollClass = (userId: string) => {
  const queryClient = useQueryClient();
  const { selectedSede } = useStore();
  return useMutation<UnenrollResponse, Error, GymClass, MutationContext>({
    mutationFn: async (classItem: GymClass) => {
      const response = await apiService.post<UnenrollResponse>(
        `/admin/class/${classItem.id}/unenroll`,
        { userId }
      );
      return response;
    },

    onMutate: async (classItem) => {
      const classSedeId = getClassSedeId(classItem, selectedSede.id);
      const classesQueryKey = ["classes", classSedeId] as const;
      await queryClient.cancelQueries({ queryKey: ["userClasses", userId] });
      await queryClient.cancelQueries({ queryKey: classesQueryKey });

      const prevUserClasses = queryClient.getQueryData<GymClass[]>([
        "userClasses",
        userId,
      ]);
      const prevClasses = queryClient.getQueryData<GymClass[]>(classesQueryKey);

      queryClient.setQueryData<GymClass[]>(
        ["userClasses", userId],
        (old = []) => old.filter((c) => c.id !== classItem.id)
      );

      queryClient.setQueryData<GymClass[]>(classesQueryKey, (old = []) =>
        old.map((c) =>
          c.id === classItem.id
            ? {
                ...c,
                enrolled: c.enrolled - 1,
                users: c.users.filter((u) => u !== userId),
              }
            : c
        )
      );

      return { prevUserClasses, prevClasses, classesQueryKey };
    },

    onSuccess: (response) => {
      toast.success("Clase desasignada correctamente", {
        id: "unenroll-class",
      });
      showWaitlistPromotionToast(response?.waitlistPromotion);
      showAdminUnenrollStrikeToast(response?.strikeAlert);
    },

    onError: (err, classItem, context) => {
      if (context?.prevUserClasses) {
        queryClient.setQueryData(
          ["userClasses", userId],
          context.prevUserClasses
        );
      }
      if (context?.prevClasses) {
        queryClient.setQueryData(
          context.classesQueryKey ??
            (["classes", getClassSedeId(classItem, selectedSede.id)] as const),
          context.prevClasses
        );
      }
      const backendMessage = getApiErrorMessage(err);
      toast.error(backendMessage ?? "Error al desasignar la clase", {
        id: "unenroll-class",
      });
    },

    onSettled: (_data, _error, classItem) => {
      const classSedeId = getClassSedeId(classItem, selectedSede.id);
      const classesQueryKey = ["classes", classSedeId] as const;
      queryClient.invalidateQueries({ queryKey: ["userClasses", userId] });
      queryClient.invalidateQueries({ queryKey: classesQueryKey });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["goals", classSedeId] });
      queryClient.invalidateQueries({ queryKey: ["goals", selectedSede.id] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard-users"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard-sedes"] });
    },
  });
};
