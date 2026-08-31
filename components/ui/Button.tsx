import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-amber text-bg hover:bg-amber-dark disabled:bg-[#5A5348] disabled:text-[#8b8578]",
  secondary: "border border-line text-text hover:bg-panel-2",
  ghost: "text-text-soft hover:bg-panel-2",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`min-h-[44px] px-5 rounded font-semibold text-sm disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
