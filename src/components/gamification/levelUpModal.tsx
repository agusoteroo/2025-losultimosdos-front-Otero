"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useEffect, useRef } from "react";
import { LevelConfig } from "@/lib/levels";
import { Button } from "@/components/ui/button";

export function LevelUpModal({
  level,
  open,
  onClose,
}: {
  level: LevelConfig;
  open: boolean;
  onClose: (open: boolean) => void;
}) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (open && !firedRef.current) {
      firedRef.current = true;
      confetti({
        particleCount: 220,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
    if (!open) {
      firedRef.current = false;
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-background border border-primary max-w-md text-center p-8">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="space-y-4"
        >
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full shadow-lg ${level.colorClass}`}
          >
            <span className="text-3xl">{level.icon}</span>
          </div>

          <h2 className="text-2xl font-bold text-primary">
            ¡Subiste al nivel {level.level}!
          </h2>

          <p className="text-lg font-semibold">{level.name}</p>

          {level.perks.length > 0 && (
            <div className="text-sm text-muted-foreground">
              <p className="mb-1">A partir de ahora:</p>
              <ul className="space-y-1 text-left inline-block">
                {level.perks.map((perk) => (
                  <li key={perk}>• {perk}</li>
                ))}
              </ul>
            </div>
          )}

          <Button className="mt-2" onClick={() => onClose(false)}>
            Seguir entrenando 💪
          </Button>
        </motion.div>
        <VisuallyHidden>
          <DialogTitle>Subiste de nivel</DialogTitle>
        </VisuallyHidden>
      </DialogContent>
    </Dialog>
  );
}
