"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export interface DatePickerProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  className?: string;
  placeholder?: string;
  minDate?: Date;
}

export function DatePicker({
  date,
  onDateChange,
  className,
  placeholder = "Pick a date",
  minDate,
}: DatePickerProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const normalizedMinDate = minDate ? new Date(minDate) : today;
  normalizedMinDate.setHours(0, 0, 0, 0);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!date}
          className={cn(
            "w-[280px] justify-start text-left font-normal",
            "data-[empty=true]:text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? date.toLocaleDateString() : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(nextDate) => {
            if (!nextDate) return;
            onDateChange?.(nextDate);
          }}
          disabled={(date) => {
            const candidate = new Date(date);
            candidate.setHours(0, 0, 0, 0);
            return candidate < normalizedMinDate;
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
