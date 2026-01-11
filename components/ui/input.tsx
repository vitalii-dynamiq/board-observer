import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Input Component with Depth
 *
 * Design principles:
 * - Height: h-10 (40px) for better touch targets
 * - Border: border-gray-200, focus: border-gray-300
 * - Background: bg-gray-50/50 with inner shadow for depth
 * - Placeholder: text-gray-400
 * - Border radius: rounded-lg (8px)
 * - Focus: Subtle glow ring effect
 */
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-sm text-gray-900",
          "shadow-inner-sm",
          "placeholder:text-gray-400",
          "transition-all duration-200",
          "focus:border-gray-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:shadow-none",
          "hover:border-gray-300 hover:bg-gray-50/30",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
