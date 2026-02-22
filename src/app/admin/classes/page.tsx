"use client";

import CreateClassSheet from "@/components/classes/create-class";
import apiService from "@/services/api.service";
import AdminTable from "@/components/classes/admin-table";
import { GymClass } from "@/types";
import { useStore } from "@/store/useStore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import TableSkeleton from "@/components/skeletons/table-skeleton";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "@/components/classes/columns";
import { ClassAttendanceManager } from "@/components/classes/class-attendance-manager";

const AdminPage = () => {
  const { selectedSede } = useStore();
  const queryClient = useQueryClient();

  const { data: classes, isLoading } = useQuery({
    queryKey: ["classes", selectedSede.id],
    queryFn: async () => {
      const response = await apiService.get(
        `/classes?sedeId=${selectedSede.id}`
      );
      return response.classes as GymClass[];
    },
  });

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (!classes) {
    return <DataTable data={[]} columns={columns} />;
  }

  return (
    <div className="container mx-auto space-y-4 p-4">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-lg font-bold">Clases Disponibles</h1>

        <CreateClassSheet
          onCreated={() =>
            queryClient.invalidateQueries({
              queryKey: ["classes", selectedSede.id],
            })
          }
        />
      </div>

      <AdminTable
        classes={
          classes.sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          ) || []
        }
        
      />
      <ClassAttendanceManager classes={classes} />
    </div>
  );
};

export default AdminPage;
