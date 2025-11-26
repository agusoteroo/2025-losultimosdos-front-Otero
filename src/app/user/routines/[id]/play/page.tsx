"use client";

import { use, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Exercise, Routine, RoutineExercise } from "@/types";
import { IconBarbell, IconClock } from "@tabler/icons-react";
import toast from "react-hot-toast";
import routineService, { BestPerformance } from "@/services/routine.service";
import { useBestPerformances } from "@/hooks/use-best-performance";
import { useCompleteRoutine } from "@/hooks/use-completeRoutine";
import { TrainingMascot } from "@/components/routines/mascot/trainingMascot"; // 🐾
import { useMyGamification } from "@/hooks/use-my-gamification";           // ⭐
import { getLevelForPoints } from "@/lib/levels";                           // ⭐

type Params = Promise<{ id: string }>;

type RoutineWithExercises = Routine & {
  exercises: (RoutineExercise & { exercise?: Exercise })[];
};

type ExerciseState = {
  exerciseId: number;
  completed: boolean;
  weight: string;
  reps: string;
};

function calc1RM(weight: number, reps: number): number {
  if (!weight || !reps) return 0;
  return weight * (1 + reps / 30);
}

export default function RoutinePlayPage({ params }: { params: Params }) {
  const { getToken } = useAuth();
  const router = useRouter();
  const { id } = use(params);
  const routineId = Number(id);

  const [exercisesState, setExercisesState] = useState<ExerciseState[]>([]);

  // 🔹 Gamificación del usuario para saber el nivel
  const { totalPoints } = useMyGamification();
  const { level } = getLevelForPoints(totalPoints);
  const isLegendOrHigher = level.level >= 4; // ⚡ nivel 4+

  const {
    data: routine,
    isLoading: isRoutineLoading,
    error: routineError,
  } = useQuery({
    queryKey: ["routine", routineId],
    queryFn: async () => {
      const token = await getToken();
      return routineService.getRoutine(
        Number(routineId),
        token
      ) as Promise<RoutineWithExercises>;
    },
  });

  const { data: bestPerformances = [], isLoading: isBestLoading } =
    useBestPerformances(routineId);

  const { mutateAsync: completeRoutine, isPending: isSaving } =
    useCompleteRoutine(routineId);

  useEffect(() => {
    if (!routine) return;
    setExercisesState((prev) => {
      if (prev.length > 0) return prev;
      return routine.exercises.map((re) => ({
        exerciseId: re.exerciseId,
        completed: false,
        weight: "",
        reps: "",
      }));
    });
  }, [routine]);

  const handleChangeField = (
    exerciseId: number,
    field: "completed" | "weight" | "reps",
    value: boolean | string
  ) => {
    setExercisesState((prev) =>
      prev.map((ex) =>
        ex.exerciseId === exerciseId ? { ...ex, [field]: value as any } : ex
      )
    );
  };

  const handleSave = async () => {
    const payload = exercisesState.filter(
      (ex) => ex.completed && ex.weight && ex.reps
    );

    if (payload.length === 0) {
      toast.error("Marcá al menos un ejercicio completado con peso y reps.");
      return;
    }

    const data = await completeRoutine(exercisesState);
    const pts = data.pointsAwarded ?? 0;

    if (pts > 0) {
      toast.success(`Rutina guardada. Ganaste ${pts} puntos 🏅`);
    } else {
      toast.success("Rutina guardada 💪");
    }

    router.push("/user/routines");
  };

  if (isRoutineLoading || isBestLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-[250px]" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (routineError || !routine) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-500">
            No se pudo cargar la rutina. Intenta de nuevo más tarde.
          </div>
        </CardContent>
      </Card>
    );
  }

  const completedCount = exercisesState.filter((e) => e.completed).length;
  const total = exercisesState.length || routine.exercises.length;
  const progress = total ? Math.round((completedCount / total) * 100) : 0;

  const getBestForExercise = (
    exerciseId: number
  ): BestPerformance | undefined =>
    bestPerformances.find((b) => b.exerciseId === exerciseId);

  return (
    <div className="space-y-6">
      {/* 🔥 Card de progreso con borde glowing para nivel 4+ */}
      <Card
        className={cn(
          "relative overflow-hidden border bg-background",
          isLegendOrHigher &&
            "border-transparent bg-[radial-gradient(circle_at_top,_#a855f733,_transparent_55%),_radial-gradient(circle_at_bottom,_#ec489933,_transparent_55%)] before:absolute before:inset-0 before:-z-10 before:bg-[conic-gradient(at_top,_#a855f7,_#ec4899,_#f97316,_#a855f7)] before:opacity-60 before:animate-[spin_10s_linear_infinite]"
        )}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{routine.name}</CardTitle>
              <p className="text-muted-foreground">
                Registrá tu mejor serie de hoy y comparala con tu PR.
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant="outline">{routine.level}</Badge>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <IconClock size={18} />
                <span>{routine.duration} min</span>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progreso de la rutina</span>
              <span>
                {completedCount}/{total} ejercicios · {progress}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      {/* Card de ejercicios con mascota condicional */}
      <Card className="relative overflow-hidden">
        {/* 🐾 Mascota SOLO si sos nivel 4+ */}
        <TrainingMascot visible={isLegendOrHigher} />

        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconBarbell />
            Ejercicios de hoy
          </CardTitle>
          <CardDescription>
            Marcá cada ejercicio que hagas y registrá tu mejor serie. Si es la
            primera vez, la mejor histórica aparece como <strong>–</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {routine.exercises.map((re) => {
            const state = exercisesState.find(
              (e) => e.exerciseId === re.exerciseId
            );
            const best = getBestForExercise(re.exerciseId);

            const best1RM =
              best && best.weight && best.reps
                ? calc1RM(best.weight, best.reps)
                : 0;

            const today1RM =
              state && state.weight && state.reps
                ? calc1RM(Number(state.weight), Number(state.reps))
                : 0;

            const isPR = today1RM > 0 && today1RM > best1RM;

            return (
              <Card
                key={re.id}
                className={cn(
                  "transition-all border border-border",
                  state?.completed &&
                    "border-green-500/80 bg-green-50/40 dark:bg-green-950/20",
                  isPR &&
                    "border-emerald-500/90 shadow-[0_0_15px_rgba(16,185,129,0.6)]"
                )}
              >
                <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">
                        {re.exercise?.name ?? "Ejercicio"}
                      </CardTitle>
                      {isPR && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-2 py-0.5 border-emerald-500/70 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
                        >
                          🎯 Nuevo récord 1RM
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-xs">
                      {re.sets && re.reps
                        ? `${re.sets} x ${re.reps} reps`
                        : "Series libres"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">
                      Completado
                    </span>
                    <Checkbox
                      checked={state?.completed ?? false}
                      onCheckedChange={(checked) =>
                        handleChangeField(
                          re.exerciseId,
                          "completed",
                          Boolean(checked)
                        )
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <div className="text-[11px] text-muted-foreground mb-1">
                        Mejor serie de hoy
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="Peso (kg)"
                          value={state?.weight ?? ""}
                          onChange={(e) =>
                            handleChangeField(
                              re.exerciseId,
                              "weight",
                              e.target.value
                            )
                          }
                          className="text-sm"
                        />
                        <Input
                          type="number"
                          inputMode="numeric"
                          placeholder="Reps"
                          value={state?.reps ?? ""}
                          onChange={(e) =>
                            handleChangeField(
                              re.exerciseId,
                              "reps",
                              e.target.value
                            )
                          }
                          className="text-sm"
                        />
                      </div>
                      {today1RM > 0 && (
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          1RM estimado hoy:{" "}
                          <span className="font-semibold">
                            {today1RM.toFixed(1)} kg
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="w-full sm:w-48">
                      <div className="text-[11px] text-muted-foreground mb-1">
                        Mejor histórica
                      </div>
                      {best ? (
                        <div className="text-sm">
                          <span className="font-semibold">
                            {best.weight} kg
                          </span>{" "}
                          · {best.reps} reps
                          {best1RM > 0 && (
                            <div className="text-[11px] text-muted-foreground">
                              1RM estimado: {best1RM.toFixed(1)} kg
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">–</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Guardando..." : "Guardar rutina"}
        </Button>
      </div>
    </div>
  );
}
