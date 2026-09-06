import type { ReactNode } from 'react';
import { NumberField, Select, Surface, Switch, ToggleButton, ToggleGroup } from '@cladd-ui/react';
import type { Color } from '@cladd-ui/react';
import type { Settings, ThemeMode } from '../types';

const ACCENTS: Color[] = ['brand', 'orange', 'red', 'pink', 'purple', 'blue', 'cyan', 'lime', 'green', 'yellow', 'neutral'];

interface SettingsScreenProps {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="text-cladd-md font-medium">{label}</div>
        {hint && <div className="text-cladd-xs text-cladd-fg-soft">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Swatch({ color }: { color: Color }) {
  return (
    <span className={`cladd-color-${color} inline-flex items-center gap-2 capitalize`}>
      <span className="size-3 rounded-full bg-cladd-primary" />
      {color}
    </span>
  );
}

export function SettingsScreen({ settings, onChange }: SettingsScreenProps) {
  return (
    <div className="flex flex-col gap-4">
      <header className="animate-fade-up motion-reduce:animate-none">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      </header>

      <Surface className="rounded-cladd-popover animate-fade-up motion-reduce:animate-none" style={{ animationDelay: '40ms' }} contentClassName="flex flex-col divide-y divide-cladd-outline">
        <Row label="Theme">
          <ToggleGroup
            size="sm"
            value={settings.theme}
            onValueChange={(v) => {
              if (typeof v === 'string') onChange({ theme: v as ThemeMode });
            }}
          >
            <ToggleButton value="dark">Dark</ToggleButton>
            <ToggleButton value="light">Light</ToggleButton>
          </ToggleGroup>
        </Row>
        <Row label="Accent">
          <Select
            size="md"
            className="w-40"
            options={ACCENTS}
            value={settings.accent}
            renderOption={({ value }) => <Swatch color={value} />}
            onChange={(accent) => onChange({ accent })}
          >
            <Swatch color={settings.accent} />
          </Select>
        </Row>
      </Surface>

      <Surface className="rounded-cladd-popover animate-fade-up motion-reduce:animate-none" style={{ animationDelay: '80ms' }} contentClassName="flex flex-col divide-y divide-cladd-outline">
        <Row label="Sound" hint="Beeps for the last 3 seconds and phase changes">
          <Switch checked={settings.sound} onChange={(sound) => onChange({ sound })} />
        </Row>
        <Row label="Vibration" hint="On phones that support it">
          <Switch checked={settings.vibrate} onChange={(vibrate) => onChange({ vibrate })} />
        </Row>
        <Row label="Get-ready countdown" hint="Seconds before the first set">
          <NumberField size="md" className="w-36" min={0} max={60} step={5} value={settings.prepSec} onChange={(prepSec) => onChange({ prepSec })} />
        </Row>
      </Surface>

      <p className="px-1 text-cladd-xs text-cladd-fg-softer">
        Workouts and history are stored in this browser only.
      </p>
    </div>
  );
}
