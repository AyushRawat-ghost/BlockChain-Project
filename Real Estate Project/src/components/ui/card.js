import React from "react";

export function Card({ className = "", children, ...props }) {
  return (
    <div className={`rounded-3xl bg-white/95 shadow-2xl border-0 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className = "", children, ...props }) {
  return (
    <div className={`p-0 mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className = "", children, ...props }) {
  return (
    <h1 className={`text-3xl font-bold text-dark mb-2 ${className}`} {...props}>
      {children}
    </h1>
  );
}

export function CardContent({ className = "", children, ...props }) {
  return (
    <div className={`p-8 flex flex-col gap-4 ${className}`} {...props}>
      {children}
    </div>
  );
}
