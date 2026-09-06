import { useMemo, useState } from 'react';
import { SectionTitle, Surface, useAccentColor } from '@cladd-ui/react';
import type { HistoryEntry } from '../types';
import { addDays, dayKey, formatDayLong, startOfDay } from '../lib/format';

interface DayStats {
  workouts: number;
  sets: number;
}

interface CalendarHeatmapProps {
  history: HistoryEntry[];
  /** Number of week columns (Mon–Sun). */
  weeks?: number;
}

const CELL = 16;
const GAP = 4;
const WEEKDAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', ''];
/** Sequential ramp: one hue (the accent), stepping from light to strong. */
const LEVEL_PCT = [45, 65, 82, 100];

function levelStyle(count: number) {
  if (count <= 0) return undefined;
  const pct = LEVEL_PCT[Math.min(count, LEVEL_PCT.length) - 1];
  return { background: `color-mix(in oklab, var(--cladd-theme) ${pct}%, var(--cladd-surface-cut))` };
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

export function CalendarHeatmap({ history, weeks = 16 }: CalendarHeatmapProps) {
  const accent = useAccentColor();
  const today = startOfDay(new Date());
  const todayKey = dayKey(today);
  const [selected, setSelected] = useState<string>(todayKey);

  const byDay = useMemo(() => {
    const map = new Map<string, DayStats>();
    for (const h of history) {
      const k = dayKey(h.startedAt);
      const cur = map.get(k) ?? { workouts: 0, sets: 0 };
      cur.workouts += 1;
      cur.sets += h.setsDone;
      map.set(k, cur);
    }
    return map;
  }, [history]);

  // Grid ends on the Sunday of the current week (Monday-first weeks).
  const columns = useMemo(() => {
    const dow = (today.getDay() + 6) % 7; // 0 = Monday
    const end = addDays(today, 6 - dow);
    const start = addDays(end, -(weeks * 7 - 1));
    return Array.from({ length: weeks }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)));
  }, [today, weeks]);

  const monthLabels = useMemo(() => {
    let lastMonth = -1;
    return columns.map((col) => {
      const monday = col[0];
      const m = monday.getMonth();
      // Label the first column whose Monday starts a new month (skip if the previous label is adjacent).
      const label = m !== lastMonth ? monday.toLocaleDateString(undefined, { month: 'short' }) : '';
      lastMonth = m;
      return label;
    });
  }, [columns]);

  const stats = useMemo(() => {
    const cutoff = addDays(today, -29).getTime();
    let workouts30 = 0;
    let sets30 = 0;
    for (const h of history) {
      if (h.startedAt >= cutoff) {
        workouts30 += 1;
        sets30 += h.setsDone;
      }
    }
    let streak = 0;
    let cursor = byDay.has(todayKey) ? today : addDays(today, -1);
    while (byDay.has(dayKey(cursor))) {
      streak += 1;
      cursor = addDays(cursor, -1);
    }
    return { workouts30, sets30, streak };
  }, [history, byDay, today, todayKey]);

  const selectedDate = useMemo(() => {
    const [y, m, d] = selected.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [selected]);
  const selectedStats = byDay.get(selected);

  const tiles = [
    { label: 'Day streak', value: stats.streak },
    { label: 'Last 30 days', value: stats.workouts30 },
    { label: 'Sets (30 d)', value: stats.sets30 },
  ];

  return (
    <section className="flex flex-col gap-3">
      <SectionTitle>Activity</SectionTitle>

      <div className="grid grid-cols-3 gap-2">
        {tiles.map((t, i) => (
          <Surface
            key={t.label}
            className="rounded-cladd-popover animate-fade-up motion-reduce:animate-none"
            style={{ animationDelay: `${i * 40}ms` }}
            contentClassName="flex flex-col items-center gap-0.5 px-2 py-3"
          >
            <div className="text-2xl font-semibold tabular-nums">{t.value}</div>
            <div className="text-cladd-2xs text-cladd-fg-soft uppercase">{t.label}</div>
          </Surface>
        ))}
      </div>

      <Surface className="rounded-cladd-popover animate-fade-up motion-reduce:animate-none" style={{ animationDelay: '120ms' }} contentClassName="flex flex-col gap-3 p-4">
        <div className={`cladd-color-${accent} -m-1 overflow-x-auto p-1`}>
          <div className="flex gap-2" style={{ minWidth: 'max-content' }}>
            {/* Weekday labels */}
            <div className="flex flex-col text-cladd-2xs text-cladd-fg-softer" style={{ paddingTop: 16, gap: GAP }}>
              {WEEKDAY_LABELS.map((l, i) => (
                <div key={i} style={{ height: CELL, lineHeight: `${CELL}px` }}>
                  {l}
                </div>
              ))}
            </div>
            <div className="flex flex-col" style={{ gap: GAP }}>
              {/* Month labels */}
              <div className="grid text-cladd-2xs text-cladd-fg-softer" style={{ gridTemplateColumns: `repeat(${weeks}, ${CELL}px)`, gap: GAP, height: 12, lineHeight: '12px' }}>
                {monthLabels.map((l, i) => (
                  <div key={i} className="whitespace-nowrap">
                    {l}
                  </div>
                ))}
              </div>
              {/* Cells */}
              <div
                role="grid"
                aria-label="Workout activity, last 16 weeks"
                className="grid"
                style={{ gridTemplateRows: `repeat(7, ${CELL}px)`, gridAutoFlow: 'column', gridAutoColumns: `${CELL}px`, gap: GAP }}
              >
                {columns.flat().map((date) => {
                  const k = dayKey(date);
                  const future = date > today;
                  const s = byDay.get(k);
                  const count = s?.workouts ?? 0;
                  const label = future
                    ? `${formatDayLong(date)}`
                    : `${formatDayLong(date)} · ${count ? `${plural(count, 'workout')} · ${plural(s?.sets ?? 0, 'set')}` : 'no workout'}`;
                  if (future) return <div key={k} aria-hidden className="rounded-[4px]" />;
                  const isSelected = k === selected;
                  return (
                    <button
                      key={k}
                      type="button"
                      data-testid="heatmap-cell"
                      data-day={k}
                      data-today={k === todayKey || undefined}
                      data-count={count}
                      aria-label={label}
                      aria-pressed={isSelected}
                      title={label}
                      onClick={() => setSelected(k)}
                      onMouseEnter={() => setSelected(k)}
                      className={[
                        'rounded-[4px] transition-transform duration-150 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--cladd-theme)',
                        count === 0 ? 'bg-cladd-surface-cut ring-1 ring-cladd-outline ring-inset' : '',
                        isSelected ? 'outline-2 outline-offset-1 outline-(--cladd-theme)' : '',
                      ].join(' ')}
                      style={levelStyle(count)}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Legend + readout */}
          <div className="mt-3 flex items-center justify-between gap-3 text-cladd-xs text-cladd-fg-soft">
            <div data-testid="heatmap-readout" className="min-w-0 truncate">
              <span className="text-cladd-fg">{formatDayLong(selectedDate)}</span>
              {' · '}
              {selectedStats ? `${plural(selectedStats.workouts, 'workout')} · ${plural(selectedStats.sets, 'set')}` : 'no workout'}
            </div>
            <div className="flex shrink-0 items-center gap-1" aria-label="Legend: less to more workouts">
              <span className="mr-1">Less</span>
              <span className="size-3 rounded-[3px] bg-cladd-surface-cut ring-1 ring-cladd-outline ring-inset" />
              {LEVEL_PCT.map((pct) => (
                <span key={pct} className="size-3 rounded-[3px]" style={{ background: `color-mix(in oklab, var(--cladd-theme) ${pct}%, var(--cladd-surface-cut))` }} />
              ))}
              <span className="ml-1">More</span>
            </div>
          </div>
        </div>
      </Surface>
    </section>
  );
}
