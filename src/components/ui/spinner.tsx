import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const spinnerVariants = cva(
  "relative block opacity-[0.65]",
  {
    variants: {
      size: {
        sm: "w-4 h-4",
        md: "w-6 h-6",
        lg: "w-8 h-8",
      },
    },
    defaultVariants: {
      size: "sm",
    },
  }
);

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLSpanElement>,
  VariantProps<typeof spinnerVariants> {
  loading?: boolean;
  asChild?: boolean;
}

const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(
  ({ className, size, loading = true, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "span";

    if (!loading) return null;

    return (
      <Comp
        className={cn(spinnerVariants({ size, className }))}
        ref={ref}
        {...props}
      >
        {/* Two large concentric rings: orange (outer) and blue (inner) */}
        <span className="relative block w-full h-full">
          <span
            className="absolute inset-0 rounded-full border-[3px] border-t-transparent border-orange-500 animate-spin"
            style={{ animationDuration: '1.2s' }}
          />
          <span
            className="absolute inset-1/4 rounded-full border-[3px] border-t-transparent border-blue-500 animate-spin"
            style={{ animationDuration: '0.9s', animationDirection: 'reverse' as any }}
          />
        </span>
      </Comp>
    );
  }
);

Spinner.displayName = "Spinner";

export { Spinner, spinnerVariants };
