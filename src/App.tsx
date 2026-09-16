import { useCallback, useEffect, useState } from 'react';
import { CladdProvider, Tab, TabPanel, Tabs, TabsList, useToast } from '@cladd-ui/react';
import type { HistoryEntry, Workout } from './types';
import { useWorkoutStore } from './store/useWorkoutStore';
import { newWorkout } from './store/sampleWorkouts';
import { unlockAudio } from './timer/sound';
import { WorkoutsScreen } from './screens/WorkoutsScreen';
import { WorkoutEditorScreen } from './screens/WorkoutEditorScreen';
import { ImportWorkoutScreen } from './screens/ImportWorkoutScreen';
import { RunnerScreen } from './screens/RunnerScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { DumbbellIcon, HistoryIcon, SettingsIcon } from './components/icons';

type View =
  | { kind: 'tabs' }
  | { kind: 'edit'; workout: Workout; isNew: boolean }
  | { kind: 'import' }
  | { kind: 'run'; workoutId: string };

export default function App() {
  const { state, dispatch } = useWorkoutStore();
  const { settings } = state;
  const [view, setView] = useState<View>({ kind: 'tabs' });
  const [tab, setTab] = useState('workouts');

  // The light theme is a class on <html>; dark is the bare default.
  useEffect(() => {
    document.documentElement.classList.toggle('light', settings.theme === 'light');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', settings.theme === 'light' ? '#f4f4f5' : '#101010');
  }, [settings.theme]);

  const addHistory = useCallback((entry: HistoryEntry) => dispatch({ type: 'addHistory', entry }), [dispatch]);
  const backToTabs = useCallback(() => setView({ kind: 'tabs' }), []);

  const running = view.kind === 'run' ? state.workouts.find((w) => w.id === view.workoutId) : undefined;

  return (
    <CladdProvider theme={settings.theme} accentColor={settings.accent}>
      <Shell
        state={state}
        dispatch={dispatch}
        view={view}
        setView={setView}
        tab={tab}
        setTab={setTab}
        running={running}
        addHistory={addHistory}
        backToTabs={backToTabs}
      />
    </CladdProvider>
  );
}

interface ShellProps {
  state: ReturnType<typeof useWorkoutStore>['state'];
  dispatch: ReturnType<typeof useWorkoutStore>['dispatch'];
  view: View;
  setView: (view: View) => void;
  tab: string;
  setTab: (tab: string) => void;
  running: Workout | undefined;
  addHistory: (entry: HistoryEntry) => void;
  backToTabs: () => void;
}

/** Lives under CladdProvider so it can use the toast portal. */
function Shell({ state, dispatch, view, setView, tab, setTab, running, addHistory, backToTabs }: ShellProps) {
  const { settings } = state;
  const toast = useToast();

  const importWorkouts = (workouts: Workout[]) => {
    if (workouts.length === 1) {
      // A single plan goes through the editor so the user can review before saving.
      setView({ kind: 'edit', workout: workouts[0], isNew: true });
      return;
    }
    workouts.forEach((workout) => dispatch({ type: 'upsertWorkout', workout }));
    toast({ title: `${workouts.length} workouts added`, text: 'Tap any of them to review or edit.', color: 'green' });
    backToTabs();
  };

  return (
      <div className="app-container mx-auto flex h-full w-full max-w-[520px] flex-col bg-cladd-bg text-cladd-fg">
        {view.kind === 'run' && running ? (
          <div className="h-full animate-fade-up motion-reduce:animate-none">
            <RunnerScreen key={running.id} workout={running} settings={settings} onFinish={addHistory} onExit={backToTabs} />
          </div>
        ) : view.kind === 'import' ? (
          <div className="h-full animate-fade-up motion-reduce:animate-none">
            <ImportWorkoutScreen workouts={state.workouts} onImport={importWorkouts} onBack={backToTabs} />
          </div>
        ) : view.kind === 'edit' ? (
          <div className="h-full animate-fade-up motion-reduce:animate-none">
          <WorkoutEditorScreen
            key={view.workout.id}
            initial={view.workout}
            isNew={view.isNew}
            onSave={(workout) => {
              dispatch({ type: 'upsertWorkout', workout });
              backToTabs();
            }}
            onDelete={(id) => {
              dispatch({ type: 'deleteWorkout', id });
              backToTabs();
            }}
            onBack={backToTabs}
          />
          </div>
        ) : (
          <Tabs value={tab} onValueChange={setTab}>
            <main className="flex-1 overflow-y-auto px-4 pt-safe-5 pb-6">
              <TabPanel value="workouts">
                <WorkoutsScreen
                  workouts={state.workouts}
                  prepSec={settings.prepSec}
                  onStart={(workoutId) => {
                    unlockAudio();
                    setView({ kind: 'run', workoutId });
                  }}
                  onEdit={(id) => {
                    const workout = state.workouts.find((w) => w.id === id);
                    if (workout) setView({ kind: 'edit', workout, isNew: false });
                  }}
                  onNew={() => setView({ kind: 'edit', workout: newWorkout(), isNew: true })}
                  onImport={() => setView({ kind: 'import' })}
                />
              </TabPanel>
              <TabPanel value="history">
                <HistoryScreen history={state.history} onClear={() => dispatch({ type: 'clearHistory' })} />
              </TabPanel>
              <TabPanel value="settings">
                <SettingsScreen settings={settings} onChange={(patch) => dispatch({ type: 'updateSettings', patch })} />
              </TabPanel>
            </main>
            <nav className="px-4 pt-2 pb-safe-3">
              <TabsList size="lg" className="flex w-full" aria-label="Sections">
                <Tab value="workouts" className="flex-1">
                  <DumbbellIcon className="size-4" />
                  Workouts
                </Tab>
                <Tab value="history" className="flex-1">
                  <HistoryIcon className="size-4" />
                  History
                </Tab>
                <Tab value="settings" className="flex-1">
                  <SettingsIcon className="size-4" />
                  Settings
                </Tab>
              </TabsList>
            </nav>
          </Tabs>
        )}
      </div>
  );
}
