import React from "react";

export function Button({ className = "", variant = "default", children, ...props }) {
  let base =
    "px-6 py-3 rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 ";
  let variants = {
    default: "bg-primary text-white hover:bg-secondary/90",
    outline: "border-2 border-primary text-primary bg-white hover:bg-primary/10",
  };
  return (
    <button className={`${base} ${variants[variant] || ""} ${className}`} {...props}>
      {children}
    </button>
  );
}
