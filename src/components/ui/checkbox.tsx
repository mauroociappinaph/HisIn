"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/shared/lib/cn";

/** shadcn Checkbox over Radix: real form semantics instead of a button pretending. */
export function Checkbox({ className, ...props }: CheckboxPrimitive.CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "grid h-4 w-4 shrink-0 place-items-center rounded-[3px] border border-slate-400 bg-white transition",
        "data-[state=checked]:border-indigo-600 data-[state=checked]:bg-indigo-600 data-[state=checked]:text-white",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator>
        <Check className="h-3 w-3" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
