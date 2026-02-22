export interface GymClass {
  id: number;
  name: string;
  description: string;
  date: Date;
  time: string;
  capacity: number;
  enrolled: number;
  sedeId: number;
  createdById: string;
  users: string[];
  isBoostedForPoints: boolean;

}
export type BookingStatus =
  | "RESERVED"
  | "ATTENDED"
  | "ABSENT"
  | "CANCELLED"
  | "WAITLIST";

export interface ClassBooking {
  id: number;
  classId: number;
  userId: string;
  status: BookingStatus;
  waitlistPosition?: number | null;
  checkedInAt?: string | null;
  cancelledAt?: string | null;
  noShowCountMonth?: number;
  class: GymClass;
}

export interface NoShowPolicy {
  monthlyNoShows: number;
  monthlyThreshold: number;
  isRestricted: boolean;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  imageUrl: string;
  createdAt: string;
  role: "admin" | "user" | "medibook";
  plan: "basic" | "premium";
  sedeId: number;
}

export interface ApiKey {
  id: string;
  key: string;
  isActive: boolean;
  createdAt: string;
  lastUsed?: string;
}

export interface Routine {
  id: number;
  name: string;
  description: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  duration: number;
  icon: string;
  users: string[];
  sedeId: number;
}

export interface MuscleGroup {
  id: number;
  name: string;
}
export interface Exercise {
  id: number;
  name: string;
  equipment?: string | null;
  videoUrl?: string | null;
  muscleGroupId: number;
  muscleGroup: MuscleGroup;
}

export interface RoutineExercise {
  id: number;
  routineId: number;
  exerciseId: number;
  sets?: number;
  reps?: number;
  restTime?: number;
}

export interface Sede {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export type GoalCategory =
  | "CLASS_ENROLLMENTS"
  | "ROUTINE_ASSIGNMENTS"
  | "USER_REGISTRATIONS";

export interface Goal {
  id: number;
  title: string;
  description?: string;
  category: GoalCategory;
  targetValue: number;
  currentValue: number;
  startDate: Date;
  endDate: Date;
  sedeId: number;
  targetClassId?: number;
  targetClass?: GymClass;
  targetRoutineId?: number;
  targetRoutine?: Routine;
  createdAt: Date;
  updatedAt: Date;
}

export type LeaderboardPeriod = "all" | "30d" | "7d";

export interface UserLeaderboardItem {
  rank: number;
  userId: string;
  totalPoints: number;
  user?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    fullName: string;
  };
}

export interface SedeLeaderboardItem {
  rank: number;
  sedeId: number;
  sedeName: string;
  totalPoints: number;
}

export type BadgeMetric =
  | "TOTAL_POINTS"
  | "CLASS_ENROLL_COUNT"
  | "ROUTINE_COMPLETE_COUNT";

export interface UserBadgeStatus {
  badgeId: number;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  metric: BadgeMetric;
  threshold: number;
  currentValue: number;
  progress: number; // 0–1
  earned: boolean;
  earnedAt: string | null;
}

export type ChallengeFrequency = "DAILY" | "WEEKLY";

export interface Challenge {
  id: number;
  title: string;
  description?: string | null;
  frequency: ChallengeFrequency;
  pointsReward: number;
  minLevel: number;
  sedeId?: number | null;
  isActive: boolean;
  createdAt: string; // Date serializado
  updatedAt: string;
  currentLevel: number; // viene del back
  isCompleted: boolean; // viene del back
}