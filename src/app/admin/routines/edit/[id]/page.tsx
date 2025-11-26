"use client";
import { RoutineForm } from "@/components/forms/routine";
import routineService from "@/services/routine.service";
import { Routine, RoutineExercise } from "@/types";
import { RoutineFormValues } from "@/components/forms/routine";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import RoutineSkeleton from "@/components/skeletons/routine-skeleton";
import { toast } from "react-hot-toast";
import { useStore } from "@/store/useStore";

const transformRoutineData = (routineData: any) => {
  return {
    id: routineData.id,
    name: routineData.name,
    description: routineData.description,
    level: routineData.level as "Beginner" | "Intermediate" | "Advanced",
    duration: routineData.duration,
    icon: routineData.icon,
    sedeId: routineData.sedeId,
    exercises: routineData.exercises.map((ex: any) => ({
      exerciseId: ex.exerciseId,
      sets: ex.sets,
      reps: ex.reps,
      restTime: ex.restTime,
      exerciseData: {
        id: ex.exercise.id,
        name: ex.exercise.name,
        equipment: ex.exercise.equipment,
        videoUrl: ex.exercise.videoUrl,
        muscleGroupId: ex.exercise.muscleGroupId,
        muscleGroup: {
          id: ex.exercise.muscleGroup.id,
          name: ex.exercise.muscleGroup.name,
        },
      },
    })),
  };
};

const EditRoutinePage = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { id } = useParams();
  const idNumber = parseInt(id as string);
  const { selectedSede } = useStore();
  const { data: defaultValues, isLoading } = useQuery<
    Routine & { exercises: RoutineExercise[] }
  >({
    queryKey: ["routine", id],
    queryFn: async () => {
      const token = await getToken();
      const response = await routineService.getRoutine(idNumber, token);
      return response;
    },
  });

  const { mutate: updateRoutine, isPending: isUpdating } = useMutation({
    mutationFn: async (values: RoutineFormValues) => {
      const token = await getToken();
      if (!token) return;
      const updatedRoutine = await routineService.updateRoutine(
        idNumber,
        {
          id: values.id as number,
          name: values.name,
          description: values.description,
          level: values.level,
          duration: values.duration,
          icon: values.icon,
          users: [],
          sedeId: values.sedeId,
        },
        values.exercises.map((exercise) => ({
          id: exercise.exerciseData.id,
          routineId: idNumber,
          exerciseId: exercise.exerciseData.id,
          sets: exercise.sets,
          reps: exercise.reps,
          restTime: exercise.restTime,
        })),
        token
      );
      return updatedRoutine;
    },
    onMutate: async (newRoutine) => {
      await queryClient.cancelQueries({ queryKey: ["routine", id] });

      const previousRoutine = queryClient.getQueryData(["routine", id]);

      queryClient.setQueryData(["routine", id], {
        id: idNumber,
        name: newRoutine.name,
        description: newRoutine.description,
        level: newRoutine.level,
        duration: newRoutine.duration,
        icon: newRoutine.icon,
        sedeId: newRoutine.sedeId,
        exercises: newRoutine.exercises.map((exercise) => ({
          exerciseId: exercise.exerciseData.id,
          sets: exercise.sets,
          reps: exercise.reps,
          restTime: exercise.restTime,
          exercise: {
            id: exercise.exerciseData.id,
            name: exercise.exerciseData.name,
            equipment: exercise.exerciseData.equipment,
            videoUrl: exercise.exerciseData.videoUrl,
            muscleGroupId: exercise.exerciseData.muscleGroupId,
            muscleGroup: exercise.exerciseData.muscleGroup,
          },
        })),
      });

      return { previousRoutine };
    },
    onSuccess: (updatedRoutine) => {
      queryClient.setQueryData(["routine", id], updatedRoutine);
      queryClient.refetchQueries({ queryKey: ["routines", selectedSede.id] });
      toast.success("Rutina actualizada correctamente");
    },
    onError: (error, newRoutine, context) => {
      console.error("Error updating routine:", error);

      if (context?.previousRoutine) {
        queryClient.setQueryData(["routine", id], context.previousRoutine);
      }
      toast.error("Failed to update routine");
    },
  });

  if (isLoading) {
    return <RoutineSkeleton />;
  }

  return (
    <RoutineForm
      onSubmit={async (values) => {
        updateRoutine(values);
      }}
      defaultValues={transformRoutineData(defaultValues)}
      isEdit={true}
      isEditing={isUpdating}
    />
  );
};

export default EditRoutinePage;
