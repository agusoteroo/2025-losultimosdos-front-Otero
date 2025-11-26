// src/app/(user)/gamification/page.tsx
"use client";

import { useEffect } from "react";
import { UserChallengesSection } from "@/components/challenges/UserChallengesSection";
import { TrainingCalendar } from "@/components/challenges/TrainingCalendar";
import { useEvaluateChallenges } from "@/hooks/use-evaluate-challenge";

export default function GamificationPage() {

  return (
    <div className="space-y-6">
      

      <div className="grid gap-6 lg:grid-cols-[1.2fr,2fr]">
        <TrainingCalendar />
        <UserChallengesSection />
      </div>
    </div>
  );
}
