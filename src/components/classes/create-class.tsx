"use client";

import { useState } from "react";
import { ClassForm, type ClassFormValues } from "../forms/class";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import apiService from "@/services/api.service";

interface CreateClassSheetProps {
  onCreated?: () => void;
}

const CreateClassSheet = ({ onCreated }: CreateClassSheetProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // 👇 ahora usamos ClassFormValues, no GymClass
  const onCreate = async (values: ClassFormValues) => {
    // armamos el payload que el back espera
    const payload = {
      name: values.name,
      description: values.description,
      date: values.date.toISOString(), // el back hace Date.parse(date)
      time: values.time,
      capacity: values.capacity,
      sedeId: values.sedeId,
      isBoostedForPoints: values.isBoostedForPoints,
    };

    await apiService.post(`/admin/class`, payload);

    // avisamos a la página que hay una nueva clase
    onCreated?.();

    // cerramos el sheet
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        Crear Clase
      </Button>
      <SheetContent
        className="w-[95vw] sm:w-[540px] max-w-[95vw] overflow-y-auto"
        side="right"
      >
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold">Crear Clase</SheetTitle>
        </SheetHeader>
        <ClassForm onSubmit={onCreate} />
      </SheetContent>
    </Sheet>
  );
};

export default CreateClassSheet;
