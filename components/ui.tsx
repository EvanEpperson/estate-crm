import * as React from "react";
import { cn, avatarColor, initials } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 pt-6 pb-2", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 pb-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-lg font-semibold tracking-tight", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-[var(--color-muted-foreground)]", className)} {...props} />;
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
    primary:
      "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90 shadow-sm shadow-[color-mix(in_oklch,var(--color-primary)_30%,transparent)]",
    secondary: "bg-[var(--color-accent)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]",
    ghost: "hover:bg-[var(--color-accent)] text-[var(--color-foreground)]",
    outline:
      "border border-[var(--color-border)] bg-transparent hover:bg-[var(--color-accent)] text-[var(--color-foreground)]",
    destructive: "bg-[var(--color-destructive)] text-white hover:opacity-90",
  };
  const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-11 px-6 text-base",
    icon: "h-10 w-10",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3.5 text-sm",
        "placeholder:text-[var(--color-muted-foreground)]",
        "focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color-mix(in_oklch,var(--color-primary)_25%,transparent)] focus:outline-none",
        "transition-colors",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3.5 py-2.5 text-sm",
        "placeholder:text-[var(--color-muted-foreground)]",
        "focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color-mix(in_oklch,var(--color-primary)_25%,transparent)] focus:outline-none",
        "transition-colors",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("block text-sm font-medium mb-1.5 text-[var(--color-foreground)]", className)}
      {...props}
    />
  );
}

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "outline" | "success" | "warning" }) {
  const variants = {
    default: "bg-[var(--color-accent)] text-[var(--color-foreground)]",
    outline: "border border-[var(--color-border)] text-[var(--color-foreground)]",
    success: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    warning: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export function Avatar({ first, last, className }: { first: string; last: string; className?: string }) {
  return (
    <div
      className={cn(
        "grid place-items-center rounded-full text-white font-semibold shrink-0",
        avatarColor(`${first}${last}`),
        className ?? "size-10 text-sm"
      )}
    >
      {initials(first, last)}
    </div>
  );
}
