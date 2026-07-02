import React, { ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "accent" | "outline" | "ghost" | "nav";
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  isLoading?: boolean;
}

export default function Button({
  variant = "primary",
  icon,
  iconPosition = "left",
  isLoading,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyle = "transition-colors group uppercase tracking-widest font-bold flex items-center justify-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed";

  const getVariantStyle = () => {
    switch (variant) {
      case "accent":
        return "bg-blue-600 text-white hover:bg-blue-700";
      case "nav":
        return "bg-foreground text-background hover:bg-blue-600 dark:hover:bg-blue-500";
      case "outline":
        return "border border-border hover:border-muted text-foreground bg-transparent hover:bg-surface";
      case "ghost":
        return "bg-transparent text-secondary hover:text-foreground hover:bg-surface";
      case "primary":
      default:
        return "bg-foreground text-background hover:bg-blue-600 dark:hover:bg-blue-500 transition-all";
    }
  };

  const renderIcon = () => {
    if (isLoading) {
      return <Loader2 className="w-4 h-4 animate-spin" />;
    }
    return icon;
  };

  return (
    <button 
      className={`${baseStyle} ${getVariantStyle()} ${className}`} 
      disabled={isLoading || disabled} 
      {...props}
    >
      {iconPosition === "left" && renderIcon()}
      <span>{children}</span>
      {iconPosition === "right" && renderIcon()}
    </button>
  );
}
