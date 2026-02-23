import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GymClass, UnenrollResponse } from "@/types";
import apiService from "@/services/api.service";
import { toast } from "react-hot-toast";
import { useStore } from "@/store/useStore";
import { showWaitlistPromotionToast } from "@/lib/waitlist-promotion-toast";

interface MutationContext {
  prevUserClasses?: GymClass[];
  prevClasses?: GymClass[];
}

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
      await queryClient.cancelQueries({ queryKey: ["userClasses", userId] });
      await queryClient.cancelQueries({ queryKey: ["classes"] });

      toast.loading("Asignando clase...", { id: "enroll-class" });
      const prevUserClasses = queryClient.getQueryData<GymClass[]>([
        "userClasses",
        userId,
      ]);
      const prevClasses = queryClient.getQueryData<GymClass[]>(["classes"]);

      queryClient.setQueryData<GymClass[]>(
        ["userClasses", userId],
        (old = []) => [...old, classItem]
      );

      queryClient.setQueryData<GymClass[]>(["classes"], (old = []) =>
        old.map((c) =>
          c.id === classItem.id
            ? { ...c, enrolled: c.enrolled + 1, users: [...c.users, userId] }
            : c
        )
      );

      return { prevUserClasses, prevClasses };
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
        queryClient.setQueryData(["classes"], context.prevClasses);
      }
      console.log("err", err);
      if ((err as any).status === 403) {
        toast.error("El usuario ya esta inscrito en el maximo de clases", {
          id: "enroll-class",
        });
      } else {
        toast.error("Error al asignar la clase", { id: "enroll-class" });
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["userClasses", userId] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
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
      await queryClient.cancelQueries({ queryKey: ["userClasses", userId] });
      await queryClient.cancelQueries({ queryKey: ["classes"] });

      const prevUserClasses = queryClient.getQueryData<GymClass[]>([
        "userClasses",
        userId,
      ]);
      const prevClasses = queryClient.getQueryData<GymClass[]>(["classes"]);

      queryClient.setQueryData<GymClass[]>(
        ["userClasses", userId],
        (old = []) => old.filter((c) => c.id !== classItem.id)
      );

      queryClient.setQueryData<GymClass[]>(["classes"], (old = []) =>
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

      return { prevUserClasses, prevClasses };
    },

    onSuccess: (response) => {
      toast.success("Clase desasignada correctamente", {
        id: "unenroll-class",
      });
      showWaitlistPromotionToast(response?.waitlistPromotion);
    },

    onError: (err, classItem, context) => {
      if (context?.prevUserClasses) {
        queryClient.setQueryData(
          ["userClasses", userId],
          context.prevUserClasses
        );
      }
      if (context?.prevClasses) {
        queryClient.setQueryData(["classes"], context.prevClasses);
      }
      toast.error("Error al desasignar la clase", { id: "unenroll-class" });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["userClasses", userId] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["goals", selectedSede.id] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard-users"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard-sedes"] });
    },
  });
};
