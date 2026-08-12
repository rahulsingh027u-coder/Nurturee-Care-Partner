'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, Timer } from 'lucide-react';

interface ShiftProgressBarProps {
  /** "HH:mm" — e.g. "09:00" */
  startTime: string;
  /** "HH:mm" — e.g. "17:00" */
  endTime: string;
  /** ISO date string for the shift — e.g. "2026-08-11T..." */
  date: string;
  /** Compact variant for timeline-style cards (default: full) */
  compact?: boolean;
}

/**
 * Converts "HH:mm" to minutes-since-midnight.
 */
function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Format a duration in minutes into "Xh Ym" or "Ym" text.
 */
function formatDuration(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * A self-contained live progress bar for in-progress shifts.
 * Calculates elapsed time from shift start → now and renders a
 * coloured bar + elapsed / remaining labels.
 *
 * Auto-refreshes every 30 seconds. Unmounts cleanly.
 */
export default function ShiftProgressBar({
  startTime,
  endTime,
  date,
  compact = false,
}: ShiftProgressBarProps) {
  // ── Compute percentages ──────────────────────────────────────────
  const calcProgress = useCallback(() => {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    // Handle overnight shifts (e.g. 22:00 → 06:00)
    let totalDuration = endMinutes - startMinutes;
    if (totalDuration <= 0) totalDuration += 24 * 60;

    // Build actual start/end Date objects using shift date
    const [year, month, day] = date.split('T')[0].split('-').map(Number);
    const shiftStart = new Date(year, month - 1, day, Math.floor(startMinutes / 60), startMinutes % 60);
    const shiftEnd = new Date(year, month - 1, day, Math.floor(endMinutes / 60), endMinutes % 60);

    // If end is before start, shift end to next day
    if (shiftEnd <= shiftStart) {
      shiftEnd.setDate(shiftEnd.getDate() + 1);
    }

    const now = new Date();
    const elapsed = Math.max(0, now.getTime() - shiftStart.getTime());
    const elapsedMinutes = Math.floor(elapsed / 60000);

    // Clamp between 0–100
    const percent = Math.min(100, Math.max(0, (elapsedMinutes / totalDuration) * 100));
    const remainingMinutes = Math.max(0, totalDuration - elapsedMinutes);

    return { percent, elapsedMinutes, remainingMinutes, totalDuration };
  }, [startTime, endTime, date]);

  const [progress, setProgress] = useState(calcProgress);

  // ── Tick every 30s ───────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setProgress(calcProgress()), 30_000);
    return () => clearInterval(id);
  }, [calcProgress]);

  // ── Determine bar colour by progress ────────────────────────────
  const barColor =
    progress.percent >= 85
      ? 'bg-amber-500'
      : progress.percent >= 60
        ? 'bg-blue-500'
        : 'bg-blue-600';

  const trackColor =
    progress.percent >= 85 ? 'bg-amber-100' : 'bg-blue-100';

  const textColor =
    progress.percent >= 85 ? 'text-amber-700' : 'text-blue-700';

  if (compact) {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className={`font-medium ${textColor} flex items-center gap-1`}>
            <Timer className="size-3" />
            {formatDuration(progress.elapsedMinutes)} elapsed
          </span>
          <span className="text-muted-foreground">
            {formatDuration(progress.remainingMinutes)} left
          </span>
        </div>
        <div className={`h-1 w-full rounded-full ${trackColor}`}>
          <div
            className={`h-1 rounded-full ${barColor} transition-all duration-700 ease-linear`}
            style={{ width: `${Math.round(progress.percent)}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {/* Label row */}
      <div className="flex items-center justify-between text-xs">
        <span className={`font-medium ${textColor} flex items-center gap-1`}>
          <Clock className="size-3" />
          {formatDuration(progress.elapsedMinutes)} elapsed
        </span>
        <span className="text-muted-foreground flex items-center gap-1">
          <Timer className="size-3" />
          {formatDuration(progress.remainingMinutes)} remaining
        </span>
      </div>

      {/* Progress track */}
      <div className={`h-1.5 w-full rounded-full ${trackColor}`}>
        <div
          className={`h-1.5 rounded-full ${barColor} transition-all duration-700 ease-linear`}
          style={{ width: `${Math.round(progress.percent)}%` }}
        />
      </div>
    </div>
  );
}
