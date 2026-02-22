"use client";

import { DataTable } from "@/components/ui/data-table";
import { columns } from "@/components/classes/columns";
import { GymClass } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import bookingService from "@/services/booking.service";
import { useStore } from "@/store/useStore";
import { ColumnDef } from "@tanstack/react-table";

export const FullClasses = ({ fullClasses }: { fullClasses: GymClass[] }) => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const { selectedSede } = useStore();

  const waitlistMutation = useMutation({
    mutationFn: (classId: number) => bookingService.joinWaitlist(classId),
    onSuccess: () => {
      toast.success("Te sumaste a la lista de espera");
      queryClient.invalidateQueries({
        queryKey: ["myBookings", selectedSede.id],
      });
      queryClient.invalidateQueries({ queryKey: ["classes", selectedSede.id] });
    },
    onError: () => toast.error("No pudimos sumarte a la lista de espera"),
  });

  const fullColumns: ColumnDef<GymClass>[] = [
    ...columns.slice(0, 3),
    {
      id: "actions",
      header: "Acción",
      cell: ({ row }) => {
        const isEnrolled = userId ? row.original.users.includes(userId) : false;
        return (
          <Button
            size="sm"
            variant="outline"
            disabled={!userId || isEnrolled || waitlistMutation.isPending}
            onClick={() => waitlistMutation.mutate(row.original.id)}
          >
            {isEnrolled ? "Ya inscripto" : "Entrar en espera"}
          </Button>
        );
      },
    },
  ];
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-lg font-bold">Clases Completas</h1>
      </div>
      <DataTable
        columns={fullColumns}
        data={fullClasses || []}
        headerClassName="last:items-center last:justify-end last:w-min"
      />
    </>
  );
};
