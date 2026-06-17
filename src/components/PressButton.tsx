import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";

type PressButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children?: ReactNode;
  full?: boolean;
  label?: string;
  size?: "md" | "lg";
  to?: string;
  variant?: "primary" | "secondary" | "danger";
};

export function PressButton({
  children,
  className = "",
  disabled = false,
  full = false,
  label,
  onClick,
  size = "md",
  to,
  type = "button",
  variant = "primary",
  ...buttonProps
}: PressButtonProps) {
  const classes = [
    "press-button",
    `press-button--${variant}`,
    `press-button--${size}`,
    full ? "press-button--full" : "",
    className,
  ].filter(Boolean).join(" ");
  const content = children ?? label;

  if (to) {
    return (
      <Link
        aria-disabled={disabled || undefined}
        className={classes}
        onClick={disabled ? (event) => event.preventDefault() : onClick as never}
        tabIndex={disabled ? -1 : undefined}
        to={to}
      >
        {content}
      </Link>
    );
  }

  return (
    <button className={classes} disabled={disabled} onClick={onClick} type={type} {...buttonProps}>
      {content}
    </button>
  );
}
