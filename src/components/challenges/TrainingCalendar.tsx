// src/components/gamification/TrainingCalendar.tsx
"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTrainingDays } from "@/hooks/use-training-days";
import { ChevronLeft, ChevronRight } from "lucide-react";

function getMonthLabel(date: Date) {
  return date.toLocaleDateString("es-AR", {
    year: "numeric",
    month: "long",
  });
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay(); // 0 domingo
}

export function TrainingCalendar() {
  const [viewDate, setViewDate] = useState(() => new Date());
  const { year, month, trainingDays, isLoading } = useTrainingDays(viewDate);

  const totalDays = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month); // 0 = domingo
  const offset = (firstDay + 6) % 7; // ajustar para que la semana arranque en lunes

  const tiles: { day: number | null; dateKey?: string }[] = [];

  for (let i = 0; i < offset; i++) {
    tiles.push({ day: null });
  }

  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(year, month - 1, day);
    const dateKey = date.toISOString().slice(0, 10);
    tiles.push({ day, dateKey });
  }

  const trainingSet = new Set(trainingDays);

  const goToPrevMonth = () => {
    const d = new Date(viewDate);
    d.setMonth(d.getMonth() - 1);
    setViewDate(d);
  };

  const goToNextMonth = () => {
    const d = new Date(viewDate);
    d.setMonth(d.getMonth() + 1);
    setViewDate(d);
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-50 dark:opacity-30 bg-[radial-gradient(circle_at_top,_#22c55e15,_transparent_60%),_radial-gradient(circle_at_bottom,_#3b82f615,_transparent_60%)]" />
      <CardHeader className="relative flex items-center justify-between">
        <CardTitle className="text-lg font-bold">
          Calendario de entrenamientos
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={goToPrevMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {getMonthLabel(viewDate)}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={goToNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="relative">
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-7 text-[11px] text-muted-foreground mb-1">
              <div className="text-center">L</div>
              <div className="text-center">M</div>
              <div className="text-center">M</div>
              <div className="text-center">J</div>
              <div className="text-center">V</div>
              <div className="text-center">S</div>
              <div className="text-center">D</div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-sm">
              {tiles.map((tile, idx) => {
                if (tile.day === null) {
                  return <div key={idx} />;
                }

                const isTrained =
                  tile.dateKey && trainingSet.has(tile.dateKey);

                return (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-center justify-center rounded-md border text-xs h-8",
                      isTrained
                        ? "bg-emerald-500/90 text-white border-emerald-600 shadow-sm"
                        : "bg-background/80 text-foreground"
                    )}
                  >
                    {tile.day}
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Los días en verde indican que registraste al menos una rutina
              completa ese día.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
