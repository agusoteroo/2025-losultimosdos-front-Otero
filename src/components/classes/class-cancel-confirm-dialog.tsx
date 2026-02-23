"use client";

import { useQuery } from "@tanstack/react-query";

import bookingService from "@/services/booking.service";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ClassCancelConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
  classDateLabel?: string;
  classTime?: string;
  isPending?: boolean;
  onConfirm: () => void;
};

export const ClassCancelConfirmDialog = ({
  open,
  onOpenChange,
  className,
  classDateLabel,
  classTime,
  isPending = false,
  onConfirm,
}: ClassCancelConfirmDialogProps) => {
  const { data: policy } = useQuery({
    queryKey: ["noShowPolicy"],
    queryFn: () => bookingService.getNoShowPolicy(),
    refetchOnWindowFocus: true,
  });

  const noShowCount = policy?.currentWindow?.noShows ?? policy?.monthlyNoShows ?? 0;
  const noShowThreshold =
    policy?.currentWindow?.threshold ?? policy?.monthlyThreshold ?? 0;
  const strikesLeft = Math.max(noShowThreshold - noShowCount, 0);

  const classDetail = [className, classDateLabel, classTime ? `a las ${classTime}` : null]
    .filter(Boolean)
    .join(" ");

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar cancelacion de clase</AlertDialogTitle>
          <AlertDialogDescription>
            {classDetail
              ? `Vas a cancelar tu inscripcion en ${classDetail}. `
              : "Vas a cancelar tu inscripcion en una clase. "}
            Si la cancelacion cuenta como tardia, puede sumar un strike. Te quedan{" "}
            {strikesLeft} strike{strikesLeft === 1 ? "" : "s"} antes de una
            restriccion temporal. Ademas, no vas a poder volver a inscribirte a esta
            misma clase.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Volver</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {isPending ? "Cancelando..." : "Confirmar cancelacion"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
