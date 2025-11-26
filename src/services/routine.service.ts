import { Routine, RoutineExercise, Exercise } from "@/types";
import apiService from "./api.service";

export type BestPerformance = {
  exerciseId: number;
  weight: number;
  reps: number;
};
export type RoutineCompleteResponse = {
  ok: boolean;
  pointsAwarded: number;
  completionRatio: number;
  completedCount: number;
  totalExercises: number;
};

class RoutineService {
  private readonly apiService = apiService;

  async getAllRoutines(sedeId: number) {
    const data = await this.apiService.get(`/routines?sedeId=${sedeId}`);
    return data.items as (Routine & { exercises: RoutineExercise[] })[];
  }

  async getRoutinesUsersCount(sedeId: number) {
    const data = await this.apiService.get(
      `/routines/users-count?sedeId=${sedeId}`
    );
    return (data.items ?? []) as {
      name: string;
      usersCount: number;
      sede: { id: number; name: string };
    }[];
  }

  async getAllRoutinesUsersCount() {
    const data = await this.apiService.get(`/routines/users-count`);
    return (data.items ?? []) as {
      name: string;
      usersCount: number;
      sede: { id: number; name: string };
    }[];
  }

  async createRoutine(
    routine: Omit<Routine, "id">,
    exercises: RoutineExercise[],
    token: string | null
  ) {
    if (!token) {
      throw new Error("No authentication token available");
    }

    const transformedExercises = exercises.map((exercise) => ({
      exerciseId: exercise.exerciseId,
      sets: exercise.sets,
      reps: exercise.reps,
      restTime: exercise.restTime,
    }));

    const data = await this.apiService.post(
      "/admin/routines",
      { ...routine, exercises: transformedExercises },
      token
    );
    return data as Routine;
  }

  async getRoutine(id: number, token: string | null) {
    if (!token) {
      throw new Error("No authentication token available");
    }
    const data = await this.apiService.get(`/routines/${id}`, token);

    // el back devuelve Routine + exercises con exercise anidado
    return data as Routine & {
      exercises: (RoutineExercise & { exercise?: Exercise })[];
    };
  }

  async deleteRoutine(id: number, token: string | null) {
    if (!token) {
      throw new Error("No authentication token available");
    }

    await this.apiService.delete(`/admin/routines/${id}`, token);
  }

  async updateRoutine(
    id: number,
    routine: Routine,
    exercises: RoutineExercise[],
    token: string | null
  ) {
    if (!token) {
      throw new Error("No authentication token available");
    }
    const transformedExercises = this.transformExercises(exercises);
    await this.apiService.put(
      `/admin/routines/${id}`,
      { ...routine, exercises: transformedExercises },
      token
    );
  }

  async assignRoutine(userId: string, routineId: number, token: string | null) {
    if (!token) {
      throw new Error("No authentication token available");
    }
    await this.apiService.post(
      `/admin/routines/${routineId}/assign`,
      { userId },
      token
    );
  }

  async unassignRoutine(
    userId: string,
    routineId: number,
    token: string | null
  ) {
    if (!token) {
      throw new Error("No authentication token available");
    }
    await this.apiService.post(
      `/admin/routines/${routineId}/unassign`,
      { userId },
      token
    );
  }

  async getUserRoutines(userId: string, token: string | null) {
    if (!token) {
      throw new Error("No authentication token available");
    }
    const data = await this.apiService.get(`/user/routines`, token);
    return data.routines as (Routine & {
      exercises: RoutineExercise[];
    })[];
  }

  async getBestPerformances(
    routineId: number,
    token: string | null
  ): Promise<BestPerformance[]> {
    if (!token) {
      throw new Error("No authentication token available");
    }
    const data = await this.apiService.get(
      `/user/routines/${routineId}/best-performances`,
      token
    );
    return (data.items ?? []) as BestPerformance[];
  }

  async completeRoutine(
    routineId: number,
    performances: { exerciseId: number; weight: number; reps: number }[],
    token: string | null
  ): Promise<RoutineCompleteResponse> {
    if (!token) {
      throw new Error("No authentication token available");
    }

    const data = await this.apiService.post(
      `/user/routines/${routineId}/complete`,
      { performances },
      token
    );

    return data as RoutineCompleteResponse;
  }

  private transformExercises(exercises: RoutineExercise[]) {
    return exercises.map((exercise) => ({
      exerciseId: exercise.exerciseId,
      sets: exercise.sets,
      reps: exercise.reps,
      restTime: exercise.restTime,
    }));
  }
}

export default new RoutineService();
