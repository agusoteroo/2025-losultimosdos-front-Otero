"use client";

import * as React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { DatePicker } from "../ui/date-picker";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Switch } from "../ui/switch";

import { toast } from "react-hot-toast";
import { ApiValidationError } from "@/services/api.service";
import { useStore } from "@/store/useStore";
import { useQueryClient } from "@tanstack/react-query";
import { getArgentinaNowParts, getLocalDateOnly } from "@/lib/argentina-time";

const classFormSchema = z.object({
  id: z.number(),
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z
    .string()
    .min(10, "La descripcion debe tener al menos 10 caracteres"),
  date: z.date().refine((date) => {
    const selectedDateOnly = getLocalDateOnly(date);
    const argentinaNow = getArgentinaNowParts();
    return selectedDateOnly >= argentinaNow.dateOnly;
  }, "La fecha tiene que ser en el futuro"),
  time: z.string().refine(
    (time) => {
      const match = time.match(/^(\d{1,2}):(\d{2})$/);
      if (!match) return false;
      const hours = Number(match[1]);
      const minutes = Number(match[2]);
      return (
        Number.isFinite(hours) &&
        Number.isFinite(minutes) &&
        minutes >= 0 &&
        minutes <= 59 &&
        hours >= 8 &&
        hours < 21
      );
    },
    {
      message: "La hora tiene que ser entre las 8:00 y 21:00",
    }
  ),
  capacity: z
    .number("La capacidad debe ser un número")
    .min(1, "La capacidad debe ser al menos 1")
    .max(50, "La capacidad no puede ser mayor a 50"),
  enrolled: z.number(),
  createdById: z.string(),
  users: z.array(z.string()),
  sedeId: z.number(),
  isBoostedForPoints: z.boolean(),
}).superRefine((values, ctx) => {
  const timeMatch = values.time.match(/^(\d{1,2}):(\d{2})$/);
  if (!timeMatch) return;

  const argentinaNow = getArgentinaNowParts();
  const selected = new Date(values.date);
  const isToday = getLocalDateOnly(selected) === argentinaNow.dateOnly;

  if (!isToday) return;

  const selectedMinutes = Number(timeMatch[1]) * 60 + Number(timeMatch[2]);
  const nowMinutes = argentinaNow.totalMinutes;

  if (selectedMinutes < nowMinutes) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["time"],
      message: "Para hoy, la hora no puede ser anterior a la actual",
    });
  }
});

export type ClassFormValues = z.infer<typeof classFormSchema>;

interface ClassFormProps {
  onSubmit: (values: ClassFormValues) => Promise<void>;
  isLoading?: boolean;
  defaultValues?: Partial<ClassFormValues>;
  isEdit?: boolean;
}

export const ClassForm = ({
  onSubmit,
  defaultValues,
  isEdit = false,
}: ClassFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { selectedSede } = useStore();
  const queryClient = useQueryClient();

  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      id: defaultValues?.id ?? 0,
      name: defaultValues?.name ?? "",
      description: defaultValues?.description ?? "",
      date: defaultValues?.date ? new Date(defaultValues.date) : new Date(),
      time: defaultValues?.time ?? "",
      capacity: defaultValues?.capacity ?? 1,
      enrolled: defaultValues?.enrolled ?? 0,
      createdById: defaultValues?.createdById ?? "",
      users: defaultValues?.users ?? [],
      sedeId: defaultValues?.sedeId ?? selectedSede.id,
      isBoostedForPoints: defaultValues?.isBoostedForPoints ?? false,
    },
  });
  const handleSubmit = async (values: ClassFormValues) => {
    try {
      setIsLoading(true);
      await onSubmit(values);
      toast.success(
        isEdit ? "Clase editada correctamente" : "Clase creada correctamente",
        { id: "create-class" }
      );
      queryClient.invalidateQueries({ queryKey: ["classes", selectedSede.id] });
    } catch (error) {
      console.error(error);
      if (error instanceof ApiValidationError) {
        toast.error(error.details[0].message, { id: "create-class" });
      } else {
        toast.error(
          isEdit ? "Error al editar la clase" : "Error al crear la clase",
          { id: "create-class" }
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto py-2 px-2 sm:px-4">
      <Card className="w-full max-w-2xl mx-auto p-4 sm:p-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* Nombre */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la clase</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ejemplo: Yoga, Pilates, Spinning..."
                      {...field}
                      aria-label="Nombre de la clase"
                    />
                  </FormControl>
                  {!form.formState.errors.name && (
                    <FormDescription>
                      Ingresa un nombre descriptivo para tu clase
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descripción */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Descripción de la clase"
                      {...field}
                      aria-label="Descripción de la clase"
                    />
                  </FormControl>
                  {!form.formState.errors.description && (
                    <FormDescription>
                      Describe los detalles y objetivos de la clase
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Fecha y hora */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Fecha */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value}
                        onDateChange={field.onChange}
                        className="w-full"
                        placeholder="Fecha"
                      />
                    </FormControl>
                    {!form.formState.errors.date && (
                      <FormDescription>
                        Selecciona la fecha de la clase
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Hora */}
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        aria-label="Hora de la clase"
                        className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                        {...field}
                      />
                    </FormControl>
                    {!form.formState.errors.time && (
                      <FormDescription>
                        Selecciona la hora de inicio
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Capacidad */}
            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacidad</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      {...field}
                      value={field.value || ""}
                      onChange={(event) => {
                        const value = event.target.value
                          ? parseInt(event.target.value, 10)
                          : "";
                        field.onChange(value);
                      }}
                      aria-label="Capacidad de la clase"
                    />
                  </FormControl>
                  {!form.formState.errors.capacity && (
                    <FormDescription>
                      Número máximo de participantes (1-50)
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isBoostedForPoints"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-3">
                  <div className="space-y-1">
                    <FormLabel>Clase boosteada</FormLabel>
                    <FormDescription>Resalta esta clase</FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading || !form.formState.isDirty}
              className="w-full"
              aria-label={
                isLoading
                  ? isEdit
                    ? "Editando clase..."
                    : "Creando clase..."
                  : isEdit
                  ? "Editar clase"
                  : "Crear clase"
              }
            >
              {isLoading
                ? isEdit
                  ? "Editando clase..."
                  : "Creando clase..."
                : isEdit
                ? "Editar clase"
                : "Crear clase"}
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  );
};
