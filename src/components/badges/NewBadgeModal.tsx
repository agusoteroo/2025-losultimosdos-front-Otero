"use client";

import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export function NewBadgeModal({
  badge,
  open,
  onClose,
}: {
  badge: any;
  open: boolean;
  onClose: (open: boolean) => void;
}) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (open && badge && !firedRef.current) {
      firedRef.current = true;
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
    if (!open) {
      firedRef.current = false;
    }
  }, [open, badge]);

  if (!badge) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-background border border-primary max-w-md text-center p-8">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="space-y-4"
        >
          <div className="text-5xl">{badge.icon ?? "🏅"}</div>

          <h2 className="text-2xl font-bold text-primary">
            ¡Nuevo logro desbloqueado!
          </h2>

          <p className="text-lg font-semibold">{badge.name}</p>

          {badge.description && (
            <p className="text-muted-foreground">{badge.description}</p>
          )}

          <div className="pt-4 flex justify-center">
            <Link href="/user/badges">
              <Button onClick={() => onClose(false)}>
                Ver todos los logros
              </Button>
            </Link>
          </div>
        </motion.div>
        <VisuallyHidden>
          <DialogTitle>Subiste de nivel</DialogTitle>
        </VisuallyHidden>
      </DialogContent>
    </Dialog>
  );
}
