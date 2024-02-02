import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "shadow-sm focus:ring-zinc-500 focus:border-zinc-500 block w-full sm:text-sm border-gray-300 rounded-md",
  {
    variants: {
      variant: {
        // Leaving room for more variants later on.
        default: "border border-zinc-800 bg-gray-100 text-zinc-800",
      },
      size: {
        default: "py-2 px-3",
        sm: "py-1 px-2 text-sm",
        lg: "py-3 px-4 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  asChild?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "input";
    return (
      <Comp
        className={cn(inputVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input, inputVariants };
