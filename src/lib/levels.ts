// lib/levels.ts

export type LevelConfig = {
  level: number;
  minPoints: number;
  name: string;
  icon: string;
  colorClass: string; // Tailwind classes
  perks: string[];
};

export const LEVELS: LevelConfig[] = [
  {
    level: 1,
    minPoints: 0,
    name: "Calentando motores",
    icon: "🔥",
    colorClass: "bg-slate-700 text-white",
    perks: [
      "Acceso al sistema de puntos y experiencia",
      "Seguimiento básico del progreso",
      "Visualización del perfil gamificado",
    ],
  },
  {
    level: 2,
    minPoints: 20,
    name: "Entrenando en serio",
    icon: "💪",
    colorClass: "bg-emerald-600 text-white",
    perks: ["Multiplicador de puntos +5% en clases seleccionadas"],
  },
  {
    level: 3,
    minPoints: 60,
    name: "Modo atleta",
    icon: "🏆",
    colorClass: "bg-yellow-500 text-black",
    perks: [
      "Acceso a desafíos especiales",
      "Multiplicador de puntos +10% en rutinas completas",
    ],
  },
  {
    level: 4,
    minPoints: 120,
    name: "Leyenda del Gym",
    icon: "⚡",
    colorClass: "bg-purple-600 text-white",
    perks: [
      "Acceso a desafíos especiales",
      "Multiplicador de puntos +20% en toda la actividad",
      "Perfil de progreso destacado",
      "Mascota de entrenamiento virtual",
    ],
  },
  {
    level: 5,
    minPoints: 200,
    name: "Élite GymCloud",
    icon: "👑",
    colorClass: "bg-rose-600 text-white",
    perks: [
      "Acceso a desafíos especiales",
      "Multiplicador de puntos +30% en toda la actividad",
      "Perfil de progreso destacado",
      "Mascota de entrenamiento virtual",

    ],
  },
];

export function getLevelForPoints(points: number) {
  const current =
    [...LEVELS].reverse().find((l) => points >= l.minPoints) ?? LEVELS[0];

  const idx = LEVELS.findIndex((l) => l.level === current.level);
  const next = LEVELS[idx + 1];

  const nextLevelPoints = next?.minPoints ?? null;

  const progressToNext =
    nextLevelPoints == null
      ? 100
      : Math.min(
          100,
          Math.round(
            ((points - current.minPoints) /
              (nextLevelPoints - current.minPoints)) *
              100
          )
        );

  return {
    level: current,
    progressToNext,
    nextLevelPoints,
  };
}

// 🧮 Multiplicador de puntos según contexto + nivel
export type PointsContext =
  | { type: "class"; isBoostedClass?: boolean }
  | { type: "routine" }
  | { type: "generic" }; // para "toda la actividad"

export function getPointsMultiplier(level: LevelConfig, ctx: PointsContext) {
  // base = 1.0 → sin bonus
  let multiplier = 1.0;

  if (level.level === 5) {
    multiplier += 0.3; // +30% en nivel 5
  } else if (level.level === 4) {
    multiplier += 0.2; // +20% en nivel 4
  } else if (level.level === 3) {
    if (ctx.type === "routine") {
      multiplier += 0.1; // +10% en nivel 3 para rutinas completas
    }
  } else if (level.level === 2) {
    if (ctx.type === "class" && ctx.isBoostedClass) {
      multiplier += 0.05; // +5% en nivel 2 para clases seleccionadas
    }
  }
  return multiplier;
}
