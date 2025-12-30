import * as React from "react";
import { format, setMonth, setYear, getYear, getMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface PeriodDatePickerProps {
  value: string; // "MM/YYYY" or "todos"
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function PeriodDatePicker({
  value,
  onChange,
  placeholder = "Selecionar período",
  className,
  disabled = false,
}: PeriodDatePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Convert "MM/YYYY" to Date
  const periodToDate = (period: string): Date | undefined => {
    if (period === "todos" || !period) return undefined;
    const match = period.match(/^(\d{1,2})[\/\-](\d{4})$/);
    if (!match) return undefined;
    const [, month, year] = match;
    return new Date(parseInt(year), parseInt(month) - 1, 1);
  };

  // Convert Date to "MM/YYYY"
  const dateToPeriod = (date: Date): string => {
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear().toString();
    return `${month}/${year}`;
  };

  const selectedDate = periodToDate(value);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(dateToPeriod(date));
      setOpen(false);
    }
  };

  const handleClear = () => {
    onChange("todos");
    setOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    onChange(dateToPeriod(today));
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "justify-start text-left font-normal",
            !selectedDate && value === "todos" && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate
            ? format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })
            : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-50 bg-popover" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          defaultMonth={selectedDate || new Date()}
          locale={ptBR}
          className="p-3 pointer-events-auto"
        />
        <div className="flex justify-between p-3 pt-0 border-t">
          <Button variant="ghost" size="sm" onClick={handleClear}>
            Limpar
          </Button>
          <Button variant="ghost" size="sm" onClick={handleToday}>
            Hoje
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
