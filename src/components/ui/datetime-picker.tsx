import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import React, { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Types
export type TimePickerType = "minutes" | "seconds" | "hours" | "12hours";
export type Period = "AM" | "PM";

// Utility functions
export function isValidHour(value: string) {
  return /^(0[0-9]|1[0-9]|2[0-3])$/.test(value);
}

export function isValidMinuteSecond(value: string) {
  return /^(0[0-9]|[1-5][0-9])$/.test(value);
}

export function isValid12Hour(value: string) {
  return /^(0[1-9]|1[0-2])$/.test(value);
}

// Time Picker Component
function TimePicker({
  type = "hours",
  value,
  onChange,
}: {
  type?: TimePickerType;
  value: string;
  onChange: (newValue: string) => void;
}) {
  const options = React.useMemo(() => {
    const arr: string[] = [];
    const max = type === "minutes" || type === "seconds" ? 59 : type === "12hours" ? 12 : 23;
    const pad = type === "12hours" ? 2 : 2;
    for (let i = 0; i <= max; i++) {
      const val = i.toString().padStart(pad, "0");
      arr.push(val);
    }
    return arr;
  }, [type]);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[80px]">
        <SelectValue placeholder="Select" />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function DateTimePicker({
  label,
  date,
  onDateChange,
  hour = "",
  minute = "",
  second = "",
  period = "AM",
  onTimeChange,
}: {
  label?: string;
  date: string;
  onDateChange: (d: string) => void;
  hour?: string;
  minute?: string;
  second?: string;
  period?: Period;
  onTimeChange: (t: { hour: string; minute: string; second: string; period?: Period }) => void;
}) {
  const [showTime, setShowTime] = useState(false);

  const handleTimeChange = (type: TimePickerType, val: string) => {
    const newTime = { hour, minute, second, period };
    newTime[type] = val;
    onTimeChange(newTime);
  };

  return (
    <div className={cn("flex flex-col space-y-2")}>
      {label && <Label>{label}</Label>}
      <div className="flex items-center space-x-2">
        <Input
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="flex-1"
        />
        <button
          type="button"
          onClick={() => setShowTime(!showTime)}
          className="btn btn-outline btn-sm"
        >
          {showTime ? "Hide Time" : "Show Time"}
        </button>
      </div>
      {showTime && (
        <div className="flex items-center space-x-2 mt-2">
          <TimePicker type="hours" value={hour} onChange={(v) => handleTimeChange("hours", v)} />
          <span>:</span>
          <TimePicker type="minutes" value={minute} onChange={(v) => handleTimeChange("minutes", v)} />
          <span>:</span>
          <TimePicker type="seconds" value={second} onChange={(v) => handleTimeChange("seconds", v)} />
          <Select value={period} onValueChange={(v) => handleTimeChange("12hours", v as any)}>
            <SelectTrigger className="w-[70px]">
              <SelectValue placeholder="AM/PM" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AM">AM</SelectItem>
              <SelectItem value="PM">PM</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

export default DateTimePicker;
