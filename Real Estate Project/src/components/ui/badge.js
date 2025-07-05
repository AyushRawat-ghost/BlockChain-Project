import React from "react";

export function Badge({ className = "", children, ...props }) {
  return (
    <span className={`inline-block bg-accent/90 text-white text-base px-3 py-1 rounded-lg ${className}`} {...props}>
      {children}
    </span>
  );
}
