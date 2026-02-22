"use client";
import apiService from "@/services/api.service";
import { UsersClassesTable } from "@/components/classes/users-table";
import { GymClass } from "@/types";
import { FullClasses } from "@/components/classes/full-classes";
import { useStore } from "@/store/useStore";
import { useQuery } from "@tanstack/react-query";
import TableSkeleton from "@/components/skeletons/table-skeleton";
import { MyBookingsCard } from "@/components/classes/my-bookings-card";

const UserPage = () => {
  const { selectedSede } = useStore();

  const {
    data: classes,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["classes", selectedSede.id],
    queryFn: async () => {
      const response = await apiService.get(
        `/classes?sedeId=${selectedSede.id}`,
      );
      return response.classes as GymClass[];
    },
  });

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (!classes) {
    return (
      <div className="container mx-auto space-y-4 p-4">
        <h1 className="text-lg font-bold">Clases Disponibles</h1>
        <UsersClassesTable classes={[]} onClassesChanged={refetch} />
      </div>
    );
  }

  const available = classes.filter((c) => c.enrolled < c.capacity);
  const full = classes.filter((c) => c.enrolled >= c.capacity);

  return (
    <div className="container mx-auto space-y-4 p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-lg font-bold">Clases Disponibles</h1>
      </div>

      <UsersClassesTable classes={available} onClassesChanged={refetch} />

      {full.length > 0 && <FullClasses fullClasses={full} />}

      <MyBookingsCard />
    </div>
  );
};

export default UserPage;
