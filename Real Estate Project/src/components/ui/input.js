import React from "react";

export function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full max-w-xl px-6 py-4 rounded-xl border-none shadow-xl text-lg focus:ring-4 focus:ring-accent/40 transition-all bg-white/90 placeholder-gray ${className}`}
      {...props}
    />
  );
}
