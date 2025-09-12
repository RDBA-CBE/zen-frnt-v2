import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import "react-day-picker/dist/style.css";

interface DatePickerProps {
  selectedDate?: Date | null;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  title?: string;
  required?: boolean;
  error?: string;
  closeIcon?: boolean;
  // disablePastDates?: boolean; // Added prop to disable past dates
  fromDate?: Date;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  selectedDate,
  onChange,
  placeholder = "Pick a date",
  title,
  required,
  error,
  closeIcon,
  // disablePastDates = false, // Default value is false
  fromDate,
}) => {
  return (
    <div className="w-full relative">
      {title && (
        <label className="block text-sm font-bold text-gray-700 mb-2">
          {title} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-between text-left font-normal pr-10 relative",
              !selectedDate && "text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <CalendarIcon height={20} width={20} />
              {selectedDate ? (
                format(selectedDate, "PPP")
              ) : (
                <span>{placeholder}</span>
              )}
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          {/* <Calendar
            fromDate={fromDate ? fromDate : null}
            mode="single"
            selected={selectedDate || undefined}
            onSelect={(date) => onChange?.(date ?? null)}
            initialFocus
            disabled={
              disablePastDates
                ? (date) => date <= new Date() // Disable dates before today
                : undefined
            }
            captionLayout="dropdown" // <-- Enables month & year dropdowns
            fromYear={1900} // <-- Earliest year allowed
            toYear={new Date().getFullYear() + 5} // <-- Latest year
          /> */}
          <Calendar
            // fromDate={fromDate ?? null}
            mode="single"
            selected={selectedDate || undefined}
            onSelect={(date) => onChange?.(date ?? null)}
            initialFocus
            disabled={(date) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);

              // If fromDate is selected, disable all dates before it
              if (fromDate) {
                const from = new Date(fromDate);
                from.setHours(0, 0, 0, 0);
                return date < from;
              }

              // Else disable past dates before today
              const current = new Date(date);
              current.setHours(0, 0, 0, 0);
              return current < today;
            }}
            captionLayout="dropdown"
            fromYear={1900}
            toYear={new Date().getFullYear() + 5}
          />
        </PopoverContent>
      </Popover>

      {selectedDate && closeIcon && (
        <button
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          onClick={(e) => {
            e.stopPropagation();
            onChange?.(null);
          }}
        >
          <X size={18} />
        </button>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
};
