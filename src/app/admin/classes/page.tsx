"use client";

import { useMemo } from "react";
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

const getClassDateTime = (gymClass: GymClass) => {
  const rawDateValue = gymClass.date as string | Date;
  const rawDate =
    typeof rawDateValue === "string"
      ? rawDateValue
      : new Date(rawDateValue).toISOString();
  const dateOnly = rawDate.includes("T") ? rawDate.split("T")[0] : rawDate;
  return new Date(`${dateOnly}T${gymClass.time}`);
};

const AdminPage = () => {
  const { selectedSede } = useStore();
  const queryClient = useQueryClient();

  const { data: futureApiClasses, isLoading: isLoadingFuture } = useQuery({
    queryKey: ["classes", selectedSede.id],
    queryFn: async () => {
      const response = await apiService.get(`/classes?sedeId=${selectedSede.id}`);
      return (response.classes ?? response.items ?? []) as GymClass[];
    },
  });

  const { data: attendanceApiClasses, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ["adminAttendanceClasses", selectedSede.id],
    queryFn: async () => {
      const response = await apiService.get(`/admin/class?sedeId=${selectedSede.id}`);
      return (response.classes ?? response.items ?? []) as GymClass[];
    },
  });

  const futureClasses = useMemo(() => {
    if (!futureApiClasses) {
      return [];
    }

    return [...futureApiClasses].sort(
      (a, b) => getClassDateTime(a).getTime() - getClassDateTime(b).getTime()
    );
  }, [futureApiClasses]);

  const attendanceClasses = useMemo(() => {
    if (!attendanceApiClasses) {
      return [];
    }

    return [...attendanceApiClasses].sort(
      (a, b) => getClassDateTime(a).getTime() - getClassDateTime(b).getTime()
    );
  }, [attendanceApiClasses]);

  if (isLoadingFuture || isLoadingAttendance) {
    return <TableSkeleton />;
  }

  if (!futureApiClasses && !attendanceApiClasses) {
    return <DataTable data={[]} columns={columns} />;
  }

  return (
    <div className="container mx-auto space-y-4 p-4">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-lg font-bold">Clases Disponibles</h1>

        <CreateClassSheet
          onCreated={() =>
            Promise.all([
              queryClient.invalidateQueries({
                queryKey: ["classes", selectedSede.id],
              }),
              queryClient.invalidateQueries({
                queryKey: ["adminAttendanceClasses", selectedSede.id],
              }),
            ])
          }
        />
      </div>

      <AdminTable classes={futureClasses} />
      <ClassAttendanceManager classes={attendanceClasses} />
    </div>
  );
};

export default AdminPage;
