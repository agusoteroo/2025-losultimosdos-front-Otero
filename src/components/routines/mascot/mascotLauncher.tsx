// components/MascotLauncher.tsx
"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type MascotLauncherProps = {
  level: number;
  onClick: () => void;
};

export function MascotLauncher({ level, onClick }: MascotLauncherProps) {
  const isMax = level >= 4;

  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 flex items-center gap-4 rounded-full pl-3 pr-5 py-2",
        "bg-slate-900/90 backdrop-blur-xl border border-slate-700 shadow-xl",
        "hover:shadow-2xl hover:-translate-y-1 transition-all duration-300",
        isMax &&
          "border-violet-400/80 shadow-[0_0_35px_rgba(167,139,250,0.75)]"
      )}
    >
      {/* Avatar grande */}
      <div
        className={cn(
          "relative h-20 w-20 rounded-full overflow-hidden flex items-center justify-center",
          "bg-gradient-to-br from-slate-800 to-slate-900",
          isMax && "ring-4 ring-violet-400/60"
        )}
      >
        <Image
          src="/gorila-legendario.png"
          alt="Gorila legendario"
          width={140}
          height={140}
          className="object-cover"
        />
      </div>

      {/* Nombre y badge */}
      <div className="flex flex-col items-start">
        <span className="text-xs uppercase tracking-wide text-slate-400">
          Mascota
        </span>

        <span className="text-lg font-semibold text-slate-50">
          {isMax ? "Gorila Legendario" : "Gorila Entrenando"}
        </span>
      </div>
    </button>
  );
}
