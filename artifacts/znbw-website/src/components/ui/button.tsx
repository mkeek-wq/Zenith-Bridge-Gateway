import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline";
};

export function Button({
  size,
  variant,
  className = "",
  ...props
}: ButtonProps) {
  return <button className={className} {...props} />;
}
