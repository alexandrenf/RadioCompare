"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type SliderValue = readonly number[] | number[];

interface SliderProps
  extends Omit<
    React.ComponentProps<"input">,
    "type" | "value" | "defaultValue" | "min" | "max" | "step" | "onChange"
  > {
  value?: SliderValue;
  defaultValue?: SliderValue;
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (
    value: number[],
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getFirstValue(values: SliderValue | undefined, fallback: number) {
  const nextValue = values?.[0];
  return typeof nextValue === "number" ? nextValue : fallback;
}

function Slider({
  className,
  value,
  defaultValue,
  min = 0,
  max = 100,
  step = 1,
  disabled,
  onValueChange,
  ...props
}: SliderProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState(() =>
    clamp(getFirstValue(defaultValue, min), min, max)
  );

  const currentValue = clamp(
    isControlled ? getFirstValue(value, min) : internalValue,
    min,
    max
  );
  const percentage =
    max === min ? 0 : ((currentValue - min) / (max - min)) * 100;

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = clamp(Number(event.target.value), min, max);

      if (!isControlled) {
        setInternalValue(nextValue);
      }

      onValueChange?.([nextValue], event);
    },
    [isControlled, max, min, onValueChange]
  );

  return (
    <input
      {...props}
      type="range"
      data-slot="slider"
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      value={currentValue}
      onChange={handleChange}
      className={cn(
        "h-2 w-full cursor-pointer appearance-none rounded-full border border-border/60 bg-transparent accent-primary disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-ring [&::-moz-range-thumb]:bg-background [&::-moz-range-thumb]:shadow-sm",
        "[&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full",
        "[&::-webkit-slider-thumb]:-mt-1 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-ring [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:shadow-sm",
        className
      )}
      style={{
        background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${percentage}%, var(--muted) ${percentage}%, var(--muted) 100%)`,
      }}
    />
  );
}

export { Slider };
