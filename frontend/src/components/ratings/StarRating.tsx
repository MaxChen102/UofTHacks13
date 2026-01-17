"use client";

import * as React from "react";

function Star({
  filled,
  className,
}: {
  filled: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 17.3l-5.07 2.66 0.97-5.65L3.8 9.94l5.66-0.82L12 4l2.54 5.12 5.66 0.82-4.1 4.37 0.97 5.65L12 17.3Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StarRatingDisplay({
  rating,
  className,
}: {
  rating: number;
  className?: string;
}) {
  const filledCount = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div className={`flex items-center gap-1 ${className ?? ""}`.trim()}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} filled={i < filledCount} />
      ))}
    </div>
  );
}

export function StarRatingInput({
  value,
  onChange,
  className,
  label = "Your rating",
}: {
  value: number;
  onChange: (next: number) => void;
  className?: string;
  label?: string;
}) {
  return (
    <div className={`flex items-center gap-1 ${className ?? ""}`.trim()}>
      <span className="sr-only">{label}</span>
      {Array.from({ length: 5 }).map((_, i) => {
        const v = i + 1;
        const active = v <= value;
        return (
          <button
            key={v}
            type="button"
            className="rounded p-0.5 text-amber-500 focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label={`${label}: ${v} star${v === 1 ? "" : "s"}`}
            onClick={() => onChange(v === value ? 0 : v)}
          >
            <Star filled={active} />
          </button>
        );
      })}
    </div>
  );
}

