import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Button Component with Enhanced Interactions
 *
 * Design principles:
 * - Consistent height: h-10 (40px) standard, h-9 (36px) compact
 * - Border radius: rounded-lg (8px) for modern feel
 * - Font: text-sm font-medium
 * - Transitions: 200ms for smooth interactions
 * - Subtle scale on active state
 * - Shadow for depth on primary buttons
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        // Primary: Solid dark background with shadow
        default: "bg-gray-900 text-white shadow-sm hover:bg-gray-800 hover:shadow-md active:bg-gray-950",
        // Destructive: For dangerous actions
        destructive:
          "bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-md active:bg-red-800",
        // Outline: Border with subtle background on hover
        outline:
          "border border-gray-200 bg-white shadow-sm hover:bg-gray-50 hover:border-gray-300 hover:shadow active:bg-gray-100",
        // Secondary: Light background with depth
        secondary:
          "bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300",
        // Ghost: No background until hover
        ghost: "text-gray-700 hover:bg-gray-100/80 hover:text-gray-900 active:bg-gray-200/80",
        // Link: Text only, underlined
        link: "text-gray-900 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3.5 text-sm",
        lg: "h-11 px-6 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
