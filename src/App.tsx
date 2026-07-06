import { useState, useEffect, useRef, useCallback, type CSSProperties } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Project,
  Task,
  Session,
  Settings,
  AppState,
  ThemeBg,
  FontStyle,
  FontSize,
  ActiveTab,
  DEFAULT_SETTINGS
} from './types';
import { playTap, playTick, playDing, playDoubleBeep } from './audio';
import { getIsLightTheme, isColorLight, getFontColorVars } from './colorUtils';
import { usePinchZoom } from './usePinchZoom';
import { useSwipeNav } from './useSwipeNav';
import { StatsView } from './components/StatsView';
import { TaskPanel } from './components/TaskPanel';
import { TimelineView } from './components/TimelineView';
import { CommandPalette } from './components/CommandPalette';
import { SettingsPanel } from './components/Settings';

// Buttery smooth individual timer digits that animate when changed
function TimerDigit({ char }: { char: string; key?: any }) {
  return (
    <span className="inline-flex relative overflow-hidden h-[1.15em] w-[0.6em] md:w-[0.55em] align-middle justify-center items-center">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={char}
          initial={{ y: '70%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: '-70%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 24 }}
          className="absolute inset-0 flex items-center justify-center font-mono font-light text-center"
        >
          {char}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

// Combines digits and colons with elegant transition state
function SmoothTimer({ seconds }: { seconds: number }) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  const timerStr = `${mins}:${secs}`;

  return (
    <span className="inline-flex items-center justify-center font-mono select-none" style={{ lineHeight: 1 }}>
      {timerStr.split('').map((char, index) => {
        if (char === ':') {
          return (
            <span key="colon" className="mx-1 opacity-70 select-none animate-pulse">
              :
            </span>
          );
        }
        return <TimerDigit key={index} char={char} />;
      })}
    </span>
  );
}
import {
  Play,
  Pause,
  RotateCcw,
  Settings as SettingsIcon,
  Flame,
  Search,
  Sparkles,
  ChevronRight,
  Maximize2,
  X,
  Coffee,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

const STORAGE_KEY = 'focus_desk_state';

// Pre-populate with gorgeous, helpful default data if nothing is saved
const DEFAULT_PROJECTS: Project[] = [
  { id: 'proj-1', name: 'Focus App Development', createdAt: Date.now() },
  { id: 'proj-2', name: 'Personal Design Workspace', createdAt: Date.now() - 86400000 }
];

const DEFAULT_TASKS: Task[] = [
  {
    id: 'task-1',
    projectId: 'proj-1',
    title: 'Implement statistics panel',
    completed: false,
    createdAt: Date.now(),
    sessionsCount: 0,
    totalFocusedTime: 0
  },
  {
    id: 'task-2',
    projectId: 'proj-1',
    title: 'Improve recommendation score logic',
    completed: false,
    createdAt: Date.now() - 43200000,
    sessionsCount: 1,
    totalFocusedTime: 1500,
    lastWorkedAt: Date.now() - 43200000
  },
  {
    id: 'task-3',
    projectId: 'proj-1',
    title: 'Design Obsidian-style layout',
    completed: true,
    createdAt: Date.now() - 86400000,
    completedAt: Date.now() - 43200000,
    sessionsCount: 2,
    totalFocusedTime: 3000,
    lastWorkedAt: Date.now() - 86400000
  },
  {
    id: 'task-4',
    projectId: 'proj-2',
    title: 'Curate minimalist desktop wallpaper',
    completed: false,
    createdAt: Date.now() - 172800000,
    sessionsCount: 0,
    totalFocusedTime: 0
  }
];

const DEFAULT_SESSIONS: Session[] = [
  {
    id: 'sess-1',
    taskId: 'task-3',
    projectId: 'proj-1',
    type: 'focus',
    duration: 1500,
    actualDuration: 1500,
    startedAt: Date.now() - 86400000,
    completedAt: Date.now() - 86400000 + 1500000,
    completed: true
  }
];

export default function App() {
  // --- Persistent State Initialization ---
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [activeTaskId, setActiveTaskId] = useState<string>('');
  const [currentTab, setCurrentTab] = useState<ActiveTab>('home');
  const prevTabRef = useRef<ActiveTab>('home');
  const [direction, setDirection] = useState<'left' | 'right' | 'up' | 'down'>('left');
  // How many sections we're skipping past in one jump - lets the transition
  // travel further (and a touch faster) the further away the target is, so
  // jumping from e.g. Desk -> Stats visually "flies past" Workspace/Timeline
  // instead of feeling like the same short hop every time.
  const [travelDistance, setTravelDistance] = useState(1);

  useEffect(() => {
    const prev = prevTabRef.current;
    if (prev !== currentTab) {
      const tabIndices: Record<ActiveTab, number> = {
        home: 0,
        projects: 1,
        tasks: 1,
        history: 2,
        stats: 3,
        settings: 4,
      };
      const prevIdx = tabIndices[prev] ?? 0;
      const currIdx = tabIndices[currentTab] ?? 0;
      const distance = Math.max(1, Math.abs(currIdx - prevIdx));
      setTravelDistance(distance);

      if (currentTab === 'settings') {
        setDirection('down');
      } else if (prev === 'settings') {
        setDirection('up');
      } else if (currIdx > prevIdx) {
        setDirection('left');
      } else {
        setDirection('right');
      }
      prevTabRef.current = currentTab;
    }
  }, [currentTab]);

  // Cross-platform pinch-to-zoom (trackpad ctrl+wheel and two-finger touch),
  // applied as a CSS transform on the whole app below.
  const zoom = usePinchZoom();

  // Horizontal swipe/trackpad-swipe between adjacent sections. Ordered
  // left-to-right to match the nav bar; 'projects' shares a slot with
  // 'tasks' since they're two views of the same Workspace position.
  const SWIPE_ORDER: ActiveTab[] = ['home', 'tasks', 'history', 'stats'];
  const handleSwipeNav = useCallback((dir: 'prev' | 'next') => {
    const slot = currentTab === 'projects' ? 'tasks' : currentTab;
    const idx = SWIPE_ORDER.indexOf(slot as ActiveTab);
    if (idx === -1) return; // settings isn't part of the horizontal order
    const nextIdx = dir === 'next' ? idx + 1 : idx - 1;
    if (nextIdx < 0 || nextIdx >= SWIPE_ORDER.length) return; // already at the edge - do nothing, no bounce
    setCurrentTab(SWIPE_ORDER[nextIdx]);
  }, [currentTab]);
  useSwipeNav(handleSwipeNav, currentTab !== 'settings');

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isDeepFocusMode, setIsDeepFocusMode] = useState(false);

  // Interruption Banner State
  const [showInterruptionBanner, setShowInterruptionBanner] = useState(false);
  const [interruptedRemainingSeconds, setInterruptedRemainingSeconds] = useState(0);

  // Timer status state
  const [timerStatus, setTimerStatus] = useState<'idle' | 'running' | 'paused' | 'break'>('idle');
  const [timerType, setTimerType] = useState<'focus' | 'break'>('focus');
  const [secondsRemaining, setSecondsRemaining] = useState(1500);
  const [totalSeconds, setTotalSeconds] = useState(1500);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');

  const [greeting, setGreeting] = useState('Good afternoon.');

  // Load from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state: AppState = JSON.parse(saved);
        setProjects(state.projects || DEFAULT_PROJECTS);
        setTasks(state.tasks || DEFAULT_TASKS);
        setSessions(state.sessions || DEFAULT_SESSIONS);
        setSettings(state.settings || DEFAULT_SETTINGS);
        setActiveProjectId(state.activeProjectId || (state.projects?.[0]?.id || ''));
        setActiveTaskId(state.activeTaskId || (state.tasks?.[0]?.id || ''));

        // Check if previous session was running (Interruption Recovery)
        const tState = state.timerState;
        if (tState && tState.status === 'running') {
          // Calculate time passed since last saved
          const nowMs = Date.now();
          const elapsedSeconds = Math.floor((nowMs - tState.lastSavedTimestamp) / 1000);
          const remaining = tState.secondsRemaining - elapsedSeconds;

          if (remaining > 0) {
            setInterruptedRemainingSeconds(remaining);
            setShowInterruptionBanner(true);
          }
        }
      } else {
        // First launch defaults
        setProjects(DEFAULT_PROJECTS);
        setTasks(DEFAULT_TASKS);
        setSessions(DEFAULT_SESSIONS);
        setSettings(DEFAULT_SETTINGS);
        setActiveProjectId(DEFAULT_PROJECTS[0].id);
        setActiveTaskId(DEFAULT_TASKS[0].id);
      }
    } catch (e) {
      console.error('Failed to load local storage state', e);
      setProjects(DEFAULT_PROJECTS);
      setTasks(DEFAULT_TASKS);
      setSessions(DEFAULT_SESSIONS);
    }
  }, []);

  // Update greeting based on hour
  useEffect(() => {
    const hours = new Date().getHours();
    if (hours < 12) setGreeting('Good morning.');
    else if (hours < 17) setGreeting('Good afternoon.');
    else setGreeting('Good evening.');
  }, [timerStatus]);

  // --- Dynamic scoring recommendation engine ---
  const getRecommendedTask = (): Task | null => {
    const openTasks = tasks.filter((t) => !t.completed);
    if (openTasks.length === 0) return null;

    let bestTask: Task | null = null;
    let highestScore = -Infinity;

    openTasks.forEach((task) => {
      let score = 0;

      // 1. Never focused: +100
      if (task.sessionsCount === 0) {
        score += 100;
      }

      // 2. High progress (at least some focus sessions): +40
      if (task.sessionsCount >= 3) {
        score += 40;
      }

      // 3. Worked yesterday
      if (task.lastWorkedAt) {
        const lastDate = new Date(task.lastWorkedAt);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (lastDate.toDateString() === yesterday.toDateString()) {
          score += 30;
        }
      }

      // 4. Ignored for 5 days
      const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
      if (Date.now() - task.createdAt > fiveDaysMs) {
        if (!task.lastWorkedAt || Date.now() - task.lastWorkedAt > fiveDaysMs) {
          score += 20;
        }
      }

      if (score > highestScore) {
        highestScore = score;
        bestTask = task;
      }
    });

    return bestTask;
  };

  const recommendedTask = getRecommendedTask();

  // If active task is completed or none selected, default to recommended
  useEffect(() => {
    if (recommendedTask && (!activeTaskId || tasks.find((t) => t.id === activeTaskId)?.completed)) {
      setActiveTaskId(recommendedTask.id);
      setActiveProjectId(recommendedTask.projectId);
    }
  }, [tasks, activeTaskId]);

  // --- Timer Tick and Interval management ---
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (timerStatus === 'running' || timerStatus === 'break') {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            // Timer finished!
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerStatus, timerType, secondsRemaining, activeTaskId, activeProjectId, currentSessionId]);

  // --- Auto Saving Engine ---
  useEffect(() => {
    if (projects.length === 0) return; // Wait until loaded

    const saveState = () => {
      const stateToSave: AppState = {
        projects,
        tasks,
        sessions,
        settings,
        activeProjectId,
        activeTaskId,
        timerState: {
          status: timerStatus === 'running' ? 'running' : 'idle',
          type: timerType,
          secondsRemaining,
          totalSeconds,
          lastSavedTimestamp: Date.now(),
          currentSessionId,
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    };

    const interval = setInterval(saveState, 3000);
    return () => clearInterval(interval);
  }, [
    projects,
    tasks,
    sessions,
    settings,
    activeProjectId,
    activeTaskId,
    timerStatus,
    timerType,
    secondsRemaining,
    totalSeconds,
    currentSessionId,
  ]);

  // Trigger sound outputs
  const playSound = (type: 'tick' | 'ding' | 'tap' | 'double') => {
    if (settings.timerSound === 'none') return;
    if (type === 'tick') playTick();
    else if (type === 'ding') playDing();
    else if (type === 'tap') playTap();
    else if (type === 'double') playDoubleBeep();
  };

  // --- Timer Actions ---
  const handleStartFocus = () => {
    playSound('tap');
    setTimerType('focus');
    const durSeconds = settings.focusDuration * 60;
    setSecondsRemaining(durSeconds);
    setTotalSeconds(durSeconds);
    setTimerStatus('running');
    setIsDeepFocusMode(true); // Automatically shift to deep focus mode!

    const newSessId = `sess-${Date.now()}`;
    setCurrentSessionId(newSessId);
  };

  const handlePauseResume = () => {
    playSound('tap');
    if (timerStatus === 'running') {
      setTimerStatus('paused');
    } else if (timerStatus === 'paused' || timerStatus === 'idle') {
      setTimerStatus('running');
    } else if (timerStatus === 'break') {
      // Break is always running
    }
  };

  const handleResetTimer = () => {
    playSound('double');
    setTimerStatus('idle');
    setTimerType('focus');
    setSecondsRemaining(settings.focusDuration * 60);
  };

  const handleTimerComplete = () => {
    playSound('ding');

    if (timerType === 'focus') {
      // 1. Log session in history
      const newSession: Session = {
        id: currentSessionId || `sess-${Date.now()}`,
        taskId: activeTaskId,
        projectId: activeProjectId,
        type: 'focus',
        duration: totalSeconds,
        actualDuration: totalSeconds - secondsRemaining,
        startedAt: Date.now() - (totalSeconds - secondsRemaining) * 1000,
        completedAt: Date.now(),
        completed: true,
      };

      setSessions((prev) => [newSession, ...prev]);

      // 2. Update task focused metrics
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === activeTaskId) {
            return {
              ...t,
              sessionsCount: t.sessionsCount + 1,
              totalFocusedTime: t.totalFocusedTime + (totalSeconds - secondsRemaining),
              lastWorkedAt: Date.now(),
            };
          }
          return t;
        })
      );

      // 3. Move to break countdown
      setTimerType('break');
      setTimerStatus('break');
      const breakSecs = settings.breakDuration * 60;
      setSecondsRemaining(breakSecs);
      setTotalSeconds(breakSecs);
    } else {
      // Break is finished! Back to Home Screen
      setTimerType('focus');
      setTimerStatus('idle');
      setSecondsRemaining(settings.focusDuration * 60);
      setIsDeepFocusMode(false);
    }
  };

  const handleResumeInterrupted = () => {
    playSound('tap');
    setShowInterruptionBanner(false);
    setTimerType('focus');
    setSecondsRemaining(interruptedRemainingSeconds);
    setTotalSeconds(settings.focusDuration * 60);
    setTimerStatus('running');
    setIsDeepFocusMode(true);
  };

  // --- Keyboard-First design global listener ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If user is actively typing in an input/textarea, bypass shortcuts!
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') {
        return;
      }

      const key = e.key.toLowerCase();
      const shortcutsConf = settings.shortcuts;

      // Start/Pause (Space)
      if (e.key === shortcutsConf.startPause || key === ' ') {
        e.preventDefault();
        if (timerStatus === 'idle') {
          handleStartFocus();
        } else {
          handlePauseResume();
        }
      }

      // Reset (R)
      else if (key === shortcutsConf.reset) {
        e.preventDefault();
        handleResetTimer();
      }

      // Open search (F) or Command Palette (Ctrl+K)
      else if (key === shortcutsConf.search || (e.ctrlKey && key === 'k')) {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }

      // Switch Panels (1: Home/Projects, 2: Tasks, 3: History/Stats)
      else if (e.ctrlKey && e.key === '1') {
        e.preventDefault();
        setCurrentTab('home');
        setIsDeepFocusMode(false);
        playSound('tap');
      } else if (e.ctrlKey && e.key === '2') {
        e.preventDefault();
        setCurrentTab('tasks');
        setIsDeepFocusMode(false);
        playSound('tap');
      } else if (e.ctrlKey && e.key === '3') {
        e.preventDefault();
        setCurrentTab('history');
        setIsDeepFocusMode(false);
        playSound('tap');
      }

      // Single character navigation shortcuts
      else if (key === shortcutsConf.viewProjects) {
        e.preventDefault();
        setCurrentTab('projects');
        playSound('tap');
      } else if (key === shortcutsConf.viewTasks) {
        e.preventDefault();
        setCurrentTab('tasks');
        playSound('tap');
      } else if (key === shortcutsConf.viewHistory) {
        e.preventDefault();
        setCurrentTab('history');
        playSound('tap');
      } else if (key === shortcutsConf.newTask) {
        e.preventDefault();
        setCurrentTab('tasks');
        // Let component input focus or simply move to tasks tab
        playSound('tap');
      } else if (key === shortcutsConf.newProject) {
        e.preventDefault();
        setCurrentTab('projects');
        playSound('tap');
      } else if (key === shortcutsConf.toggleFocus) {
        e.preventDefault();
        setIsDeepFocusMode((prev) => !prev);
        playSound('tap');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timerStatus, secondsRemaining, activeTaskId, activeProjectId, settings, interruptedRemainingSeconds]);

  // --- Task Operations ---
  const handleAddTask = (title: string, projectId: string) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      projectId,
      title,
      completed: false,
      createdAt: Date.now(),
      sessionsCount: 0,
      totalFocusedTime: 0,
    };
    setTasks((prev) => [newTask, ...prev]);
    setActiveTaskId(newTask.id);
  };

  const handleAddProject = (name: string) => {
    const newProj: Project = {
      id: `proj-${Date.now()}`,
      name,
      createdAt: Date.now(),
    };
    setProjects((prev) => [...prev, newProj]);
    setActiveProjectId(newProj.id);
  };

  const handleToggleTask = (taskId: string) => {
    playSound('tick');
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const completed = !t.completed;
          return {
            ...t,
            completed,
            completedAt: completed ? Date.now() : undefined,
          };
        }
        return t;
      })
    );
  };

  const handleDeleteTask = (taskId: string) => {
    playSound('double');
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (activeTaskId === taskId) {
      setActiveTaskId('');
    }
  };

  const handleDeleteProject = (projectId: string) => {
    playSound('double');
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    setTasks((prev) => prev.filter((t) => t.projectId !== projectId));
    if (activeProjectId === projectId) {
      setActiveProjectId(projects[0]?.id || '');
    }
  };

  const handleExecuteCommand = (cmdId: string) => {
    if (cmdId === 'cmd-start') handleStartFocus();
    else if (cmdId === 'cmd-reset') handleResetTimer();
    else if (cmdId === 'cmd-home') {
      setCurrentTab('home');
      setIsDeepFocusMode(false);
    } else if (cmdId === 'cmd-projects') setCurrentTab('projects');
    else if (cmdId === 'cmd-tasks') setCurrentTab('tasks');
    else if (cmdId === 'cmd-history') setCurrentTab('history');
    else if (cmdId === 'cmd-stats') setCurrentTab('stats');
    else if (cmdId === 'cmd-settings') setCurrentTab('settings');
  };

  // Whether the user's freely-chosen custom background color is light or dark -
  // everything downstream (text, borders, nav) reads off this instead of a
  // hardcoded assumption, so an arbitrary color always stays readable.
  const isCustomBgLight = isColorLight(settings.customBgColor || DEFAULT_SETTINGS.customBgColor);
  const customFontActive = settings.fontColorMode === 'custom' && !!settings.customFontColor;
  const fontColorVars = customFontActive ? getFontColorVars(settings.customFontColor!) : undefined;
  // The "primary" text tier (headings, titles, active nav state) reads this
  // helper so a custom font color is actually visible app-wide on the most
  // prominent text, while secondary/muted labels and semantic accent colors
  // (success/error/streak indicators etc.) stay theme-driven for clarity.
  const primaryTextClass = (lightClass: string, darkClass: string) =>
    customFontActive ? 'text-[var(--fd-font)]' : (isLightTheme ? lightClass : darkClass);

  // Theme Styles mappings
  const themeStyles: Record<ThemeBg, { container: string; card: string; border: string; text: string }> = {
    'custom-color': {
      container: isCustomBgLight ? 'text-stone-900' : 'text-white',
      card: isCustomBgLight ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10',
      border: isCustomBgLight ? 'border-black/10' : 'border-white/10',
      text: isCustomBgLight ? 'text-stone-600' : 'text-gray-400',
    },
    'liquid-glass': {
      container: settings.glassTheme === 'light'
        ? 'bg-gradient-to-tr from-[#E6DFDA] via-[#DAE2EF] to-[#E2E6EC] text-stone-900'
        : 'bg-gradient-to-tr from-[#07040E] via-[#020C17] to-[#0E041C] text-[#E8E1F5]',
      card: '',
      border: settings.glassTheme === 'light' ? 'border-stone-400/20' : 'border-white/10',
      text: settings.glassTheme === 'light' ? 'text-stone-600' : 'text-gray-400',
    },
    'sophisticated-dark': {
      container: 'bg-[#0A0A0A] text-[#EDEDED]',
      card: 'bg-[#111111]/80 border-[#1A1A1A]',
      border: 'border-[#1A1A1A]',
      text: 'text-[#BBBBBB]',
    },
    'desert-beige': {
      container: 'bg-[#F5F2EB] text-[#4E483F]',
      card: 'bg-[#EDE9E0]/90 border-[#DDD7CC] shadow-xs',
      border: 'border-[#DDD7CC]',
      text: 'text-[#6E665A]',
    },
    mocha: {
      container: 'bg-[#1A1615] text-[#EAE3E0]',
      card: 'bg-[#241F1E]/90 border-[#302928]',
      border: 'border-[#302928]',
      text: 'text-[#BEB3AF]',
    },
    'royal-purple': {
      container: 'bg-[#221432] text-[#F5EEFC]',
      card: 'bg-[#2E1D42]/80 border-[#3E2958]',
      border: 'border-[#3E2958]',
      text: 'text-[#D4C3E8]',
    },
    'deep-blue': {
      container: 'bg-[#0A1128] text-[#E1E6F0]',
      card: 'bg-[#101C3E]/80 border-[#1B2F66]',
      border: 'border-[#1B2F66]',
      text: 'text-[#A0ADC9]',
    },
    slate: {
      container: 'bg-slate-950 text-slate-100',
      card: 'bg-slate-900/60 border-slate-800',
      border: 'border-slate-800',
      text: 'text-slate-300',
    },
    nord: {
      container: 'bg-zinc-900 text-zinc-100',
      card: 'bg-zinc-800/40 border-zinc-700/50',
      border: 'border-zinc-800',
      text: 'text-zinc-300',
    },
    sand: {
      container: 'bg-amber-50/90 text-stone-900',
      card: 'bg-white/80 border-stone-200 shadow-xs',
      border: 'border-stone-200',
      text: 'text-stone-700',
    },
    'warm-dark': {
      container: 'bg-stone-950 text-stone-100',
      card: 'bg-stone-900/50 border-stone-800',
      border: 'border-stone-800/80',
      text: 'text-stone-300',
    },
    obsidian: {
      container: 'bg-black text-neutral-100',
      card: 'bg-neutral-950 border-neutral-900',
      border: 'border-neutral-900',
      text: 'text-neutral-400',
    },
    forest: {
      container: 'bg-emerald-950 text-emerald-100',
      card: 'bg-emerald-900/20 border-emerald-900/50',
      border: 'border-emerald-900/40',
      text: 'text-emerald-300/80',
    },
    'gradient-mesh': {
      container: 'bg-gradient-to-tr from-slate-950 via-neutral-950 to-indigo-950/40 text-gray-100',
      card: 'bg-black/40 border-indigo-950/50 backdrop-blur-md',
      border: 'border-indigo-950/30',
      text: 'text-gray-300',
    },
    'custom-image': {
      container: 'bg-slate-950 text-white',
      card: 'bg-black/60 border-white/10 backdrop-blur-md',
      border: 'border-white/10',
      text: 'text-gray-200',
    },
  };

  // Distance-aware slide: the offset scales with how many sections are being
  // skipped so a far jump visibly travels further ("zooms past" the sections
  // in between), while duration only grows slightly so it still feels quick.
  // Enter and exit share the exact same easing/duration so the outgoing and
  // incoming panels move in perfect lockstep with no perceptible lag.
  const baseOffset = 64;
  const travelOffset = baseOffset + Math.min(travelDistance - 1, 3) * 40;
  const travelDuration = Math.min(0.32 + (travelDistance - 1) * 0.045, 0.46);
  const slideEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

  const slideVariants = {
    initial: (dir: 'left' | 'right' | 'up' | 'down') => {
      const offsets = {
        left: { x: travelOffset, y: 0 },
        right: { x: -travelOffset, y: 0 },
        up: { x: 0, y: travelOffset },
        down: { x: 0, y: -travelOffset },
      };
      return {
        opacity: 0,
        ...offsets[dir],
        scale: 0.985,
      };
    },
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: {
        duration: travelDuration,
        ease: slideEase,
      },
    },
    exit: (dir: 'left' | 'right' | 'up' | 'down') => {
      const offsets = {
        left: { x: -travelOffset, y: 0 },
        right: { x: travelOffset, y: 0 },
        up: { x: 0, y: -travelOffset },
        down: { x: 0, y: travelOffset },
      };
      return {
        opacity: 0,
        ...offsets[dir],
        scale: 0.985,
        transition: {
          duration: travelDuration,
          ease: slideEase,
        },
      };
    },
  };

  const fontStylesMap: Record<FontStyle, string> = {
    sans: 'font-sans',
    serif: 'font-serif',
    mono: 'font-mono',
    grotesk: 'font-grotesk',
  };

  const fontSizesMap: Record<FontSize, string> = {
    sm: 'text-xs md:text-sm',
    md: 'text-sm md:text-base',
    lg: 'text-base md:text-lg',
    xl: 'text-lg md:text-xl',
  };

  const accentColorMap: Record<typeof settings.accentColor, string> = {
    indigo: 'text-indigo-400 border-indigo-500 bg-indigo-500',
    amber: 'text-amber-400 border-amber-500 bg-amber-500',
    emerald: 'text-emerald-400 border-emerald-500 bg-emerald-500',
    sky: 'text-sky-400 border-sky-500 bg-sky-500',
    rose: 'text-rose-400 border-rose-500 bg-rose-500',
    neutral: 'text-gray-300 border-gray-400 bg-gray-400',
    crimson: 'text-red-400 border-red-500 bg-red-500',
  };

  const activeTheme = themeStyles[settings.themeBg] || themeStyles.slate;
  const currentTaskItem = tasks.find((t) => t.id === activeTaskId);
  const currentProjectItem = projects.find((p) => p.id === activeProjectId);

  // Timer formatted strings
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Elapsed Character Progress Bar calculation
  const getTimerProgressBar = () => {
    const ratio = (totalSeconds - secondsRemaining) / totalSeconds;
    const totalChars = 20;
    const filledChars = Math.round(ratio * totalChars);
    const emptyChars = totalChars - filledChars;
    return '█'.repeat(filledChars) + '░'.repeat(emptyChars);
  };

  // Streak tracker
  const getStreakCount = () => {
    // Count consecutive completions today or yesterday
    const completedFocus = sessions.filter((s) => s.type === 'focus' && s.completed);
    return completedFocus.length;
  };

  // Format today's total focus time
  const getTodayFocusedTimeStr = () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todaySessions = sessions.filter(
      (s) => s.type === 'focus' && s.completed && s.startedAt >= todayStart
    );
    const totalSecs = todaySessions.reduce((acc, s) => acc + s.actualDuration, 0);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const isLightTheme = getIsLightTheme(settings);
  const navTextClass = isLightTheme 
    ? 'text-stone-500 hover:text-stone-900 font-medium' 
    : 'text-gray-400 hover:text-white';
  const navActiveTextClass = isLightTheme 
    ? 'text-stone-900 border-b-2 border-stone-800 pb-0.5 font-semibold' 
    : 'text-white border-b border-white pb-1';
  const headerBorderClass = isLightTheme 
    ? 'border-b border-stone-300/40' 
    : 'border-b border-white/5';

  return (
    <div
      style={{
        ...(settings.themeBg === 'custom-image'
          ? { backgroundImage: `url(${settings.backgroundImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : {}),
        ...(settings.themeBg === 'custom-color'
          ? { backgroundColor: settings.customBgColor || DEFAULT_SETTINGS.customBgColor }
          : {}),
        ...(fontColorVars || {}),
        transform: zoom !== 1 ? `scale(${zoom})` : undefined,
        transformOrigin: 'center center',
      } as CSSProperties}
      className={`min-h-screen relative flex flex-col justify-between p-6 md:p-12 transition-all-custom ${
        activeTheme.container
      } ${fontStylesMap[settings.fontStyle]} ${fontSizesMap[settings.fontSize]}`}
    >
      {/* Absolute overlay if using custom wallpaper image */}
      {settings.themeBg === 'custom-image' && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] -z-10" />
      )}

      {/* --- Header / Navigation Row --- */}
      {!isDeepFocusMode && (
        <header className={`flex items-center justify-between pb-4 mb-4 ${headerBorderClass}`}>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
            <h1 className={`text-sm font-semibold tracking-wider font-mono uppercase ${isLightTheme ? 'text-stone-500' : 'text-gray-400'}`}>
              Focus Desk
            </h1>
          </div>

          <nav className="flex items-center gap-6 text-xs font-mono">
            <button
              onClick={() => {
                setCurrentTab('home');
                playSound('tap');
              }}
              className={`transition-colors cursor-pointer ${currentTab === 'home' ? navActiveTextClass : navTextClass}`}
            >
              Desk
            </button>
            <button
              onClick={() => {
                setCurrentTab('projects');
                playSound('tap');
              }}
              className={`transition-colors cursor-pointer ${currentTab === 'projects' || currentTab === 'tasks' ? navActiveTextClass : navTextClass}`}
            >
              Workspace
            </button>
            <button
              onClick={() => {
                setCurrentTab('history');
                playSound('tap');
              }}
              className={`transition-colors cursor-pointer ${currentTab === 'history' ? navActiveTextClass : navTextClass}`}
            >
              Timeline
            </button>
            <button
              onClick={() => {
                setCurrentTab('stats');
                playSound('tap');
              }}
              className={`transition-colors cursor-pointer ${currentTab === 'stats' ? navActiveTextClass : navTextClass}`}
            >
              Stats
            </button>
            <button
              onClick={() => {
                setCurrentTab('settings');
                playSound('tap');
              }}
              className={`transition-colors flex items-center gap-1 cursor-pointer ${currentTab === 'settings' ? navActiveTextClass : navTextClass}`}
            >
              <SettingsIcon className="w-3.5 h-3.5" />
              Settings
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                isLightTheme 
                  ? 'bg-black/5 hover:bg-black/10 text-stone-500 hover:text-stone-900' 
                  : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
              }`}
              title="Search (F or Ctrl+K)"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </header>
      )}

      {/* --- Interruption Banner --- */}
      {showInterruptionBanner && !isDeepFocusMode && (
        <div className="mb-6 p-4 bg-indigo-950/80 border border-indigo-500/30 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in font-mono text-xs">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <div>
              <p className="text-white font-medium">Welcome back. Timer was interrupted.</p>
              <p className="text-gray-400 mt-0.5">Resume remaining focus of {formatTimer(interruptedRemainingSeconds)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleResumeInterrupted}
              className="px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded font-medium transition-colors cursor-pointer"
            >
              [ Resume ]
            </button>
            <button
              onClick={() => {
                setShowInterruptionBanner(false);
                playSound('double');
              }}
              className="px-3 py-1 bg-white/5 hover:bg-white/10 text-gray-300 rounded transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* --- MAIN MAIN AREA --- */}
      <main className="flex-1 flex flex-col justify-center max-w-5xl mx-auto w-full py-8">
        
        {/* DEEP FOCUS ACTIVE STATE */}
        {isDeepFocusMode ? (
          <div className="flex flex-col items-center justify-center space-y-10 animate-fade-in text-center max-w-xl mx-auto py-16">
            
            {/* Focus screen or Break Screen */}
            {timerType === 'focus' ? (
              <div className="space-y-10 font-mono w-full">
                <div className="space-y-2">
                  <span className="text-[10px] text-gray-500 tracking-wider uppercase">Active Task</span>
                  <p className={`text-lg font-medium ${primaryTextClass('text-stone-900', 'text-white')} max-w-md mx-auto truncate font-sans`}>
                    {currentTaskItem?.title || 'Flowing Session'}
                  </p>
                </div>

                <div className={`text-7xl md:text-9xl font-light tracking-tight ${primaryTextClass('text-stone-950 font-medium', 'text-white')} py-6`}>
                  <SmoothTimer seconds={secondsRemaining} />
                </div>

                <div className="max-w-xs mx-auto">
                  <div className={`${isLightTheme ? 'text-indigo-600' : 'text-indigo-400/80'} text-xs tracking-widest font-bold mb-2`}>
                    {getTimerProgressBar()}
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-500 tracking-wider uppercase">Current Streak</span>
                    <p className={`text-sm font-medium ${isLightTheme ? 'text-stone-700' : 'text-gray-300'}`}>
                      {getStreakCount()} sessions
                    </p>
                  </div>
                </div>

                {/* Micro Actions */}
                <div className="flex items-center justify-center gap-6 pt-4 font-sans">
                  <button
                    onClick={handlePauseResume}
                    className={`px-4 py-2 rounded text-xs font-mono flex items-center gap-2 transition-colors cursor-pointer ${
                      isLightTheme 
                        ? 'bg-black/5 hover:bg-black/10 border border-stone-200 text-stone-700' 
                        : 'bg-white/5 hover:bg-white/10 border border-white/15 text-gray-300'
                    }`}
                  >
                    {(timerStatus === 'paused' || timerStatus === 'idle') ? (
                      <Play className="w-3.5 h-3.5 text-emerald-400 fill-current" />
                    ) : (
                      <Pause className="w-3.5 h-3.5 fill-current" />
                    )}
                    {timerStatus === 'idle' ? 'Start' : timerStatus === 'paused' ? 'Resume' : 'Pause'}
                  </button>
                  <button
                    onClick={handleResetTimer}
                    className={`px-4 py-2 rounded text-xs font-mono flex items-center gap-2 transition-colors cursor-pointer ${
                      isLightTheme 
                        ? 'bg-black/5 hover:bg-rose-50 border border-stone-200 text-stone-700 hover:text-rose-600' 
                        : 'bg-white/5 hover:bg-rose-950/30 hover:border-rose-900/40 border border-white/15 text-gray-300'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset (R)
                  </button>
                  <button
                    onClick={() => {
                      playSound('double');
                      setIsDeepFocusMode(false);
                    }}
                    className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                      isLightTheme ? 'hover:bg-black/5 text-stone-400 hover:text-stone-700' : 'hover:bg-white/5 text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    Minimize
                  </button>
                </div>
              </div>
            ) : (
              /* SMART BREAK SCREEN */
              <div className="space-y-8 font-sans w-full max-w-md">
                <div className="space-y-2 animate-fade-in">
                  <Coffee className={`w-8 h-8 ${isLightTheme ? 'text-emerald-600' : 'text-emerald-400'} mx-auto mb-2 animate-bounce`} />
                  <h3 className={`text-2xl font-semibold ${primaryTextClass('text-stone-900', 'text-white')} tracking-tight`}>Nice work.</h3>
                  <p className={`text-sm ${isLightTheme ? 'text-stone-500' : 'text-gray-400'} font-mono`}>25 minutes complete.</p>
                </div>

                <div className="grid grid-cols-3 gap-4 font-mono text-xs max-w-xs mx-auto py-4">
                  <div className={`p-3 border rounded-lg ${isLightTheme ? 'bg-black/5 border-stone-200 text-stone-700' : 'bg-white/5 border-white/5 text-gray-400'}`}>
                    <span className={`block ${isLightTheme ? 'text-emerald-600' : 'text-emerald-400'} font-bold mb-1`}>↑</span>
                    Stand up
                  </div>
                  <div className={`p-3 border rounded-lg ${isLightTheme ? 'bg-black/5 border-stone-200 text-stone-700' : 'bg-white/5 border-white/5 text-gray-400'}`}>
                    <span className={`block ${isLightTheme ? 'text-emerald-600' : 'text-emerald-400'} font-bold mb-1`}>→</span>
                    Stretch
                  </div>
                  <div className={`p-3 border rounded-lg ${isLightTheme ? 'bg-black/5 border-stone-200 text-stone-700' : 'bg-white/5 border-white/5 text-gray-400'}`}>
                    <span className={`block ${isLightTheme ? 'text-emerald-600' : 'text-emerald-400'} font-bold mb-1`}>↓</span>
                    Drink water
                  </div>
                </div>

                <div className="space-y-1 font-mono">
                  <p className={`text-[10px] ${isLightTheme ? 'text-stone-400' : 'text-gray-500'} tracking-wider uppercase`}>Break ends in</p>
                  <p className={`text-4xl font-light ${primaryTextClass('text-stone-900', 'text-white')} tracking-tight`}>
                    <SmoothTimer seconds={secondsRemaining} />
                  </p>
                </div>

                <button
                  onClick={handleResetTimer}
                  className={`px-4 py-2 rounded text-xs font-mono transition-colors ${
                    isLightTheme 
                      ? 'bg-black/5 hover:bg-black/10 border border-stone-200 text-stone-700' 
                      : 'bg-white/5 hover:bg-white/10 border border-white/15 text-gray-300'
                  }`}
                >
                  Skip Break
                </button>
              </div>
            )}
          </div>
        ) : (
          /* STANDARD WORKSPACE MODE WITH RESPONSIVE COMPONENT LAYOUTS */
          <div className="relative overflow-hidden w-full">
            <AnimatePresence mode="popLayout" custom={direction}>
              <motion.div
                key={currentTab}
                custom={direction}
                variants={slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full space-y-12"
              >
                {/* Desk View */}
                {currentTab === 'home' && (
                  <div className="space-y-8 py-4 max-w-xl">
                    <div className="space-y-1">
                      <p className={`text-2xl md:text-3xl font-light tracking-tight ${primaryTextClass('text-stone-900', 'text-white')} animate-fade-in`}>
                        {greeting}
                      </p>
                    </div>

                    <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 font-mono border-t ${isLightTheme ? 'border-stone-300/60' : 'border-white/5'}`}>
                      <div className="space-y-1">
                        <p className={`text-[10px] ${isLightTheme ? 'text-stone-400' : 'text-gray-500'} uppercase tracking-wider`}>Current Project</p>
                        <p className={`text-sm ${isLightTheme ? 'text-stone-700 font-medium' : 'text-gray-300'} font-medium truncate`}>
                          {currentProjectItem?.name || 'No Selected Project'}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className={`text-[10px] ${isLightTheme ? 'text-stone-400' : 'text-gray-500'} uppercase tracking-wider`}>Recommended Task</p>
                        <div className={`flex items-center gap-1.5 text-sm ${isLightTheme ? 'text-stone-700 font-medium' : 'text-gray-300'} font-medium truncate`}>
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                          <span className="truncate">{currentTaskItem?.title || 'No open tasks'}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className={`text-[10px] ${isLightTheme ? 'text-stone-400' : 'text-gray-500'} uppercase tracking-wider`}>Today's Focus</p>
                        <p className={`text-sm ${isLightTheme ? 'text-stone-700 font-medium' : 'text-gray-300'} font-medium font-mono`}>
                          {getTodayFocusedTimeStr()}
                        </p>
                      </div>
                    </div>

                    <div className="pt-6 flex flex-col sm:flex-row items-center gap-4">
                      <button
                        onClick={handleStartFocus}
                        className="w-full sm:w-auto px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        Start {settings.focusDuration}:00
                      </button>
                      <span className={`text-xs ${isLightTheme ? 'text-stone-400' : 'text-gray-500'} font-mono hidden sm:inline`}>
                        Press <kbd className={`${isLightTheme ? 'bg-black/5 border-stone-200 text-stone-600' : 'bg-white/5 border-white/5 text-gray-300'} px-1.5 py-0.5 rounded text-[10px] border font-bold`}>Space</kbd> to launch immediately
                      </span>
                    </div>
                  </div>
                )}

                {/* Workspace / TaskPanel */}
                {(currentTab === 'projects' || currentTab === 'tasks') && (
                  <div className={`border-t ${isLightTheme ? 'border-stone-300/60' : 'border-white/5'} pt-8`}>
                    <TaskPanel
                      tasks={tasks}
                      projects={projects}
                      activeProjectId={activeProjectId}
                      activeTaskId={activeTaskId}
                      settings={settings}
                      onSelectTask={setActiveTaskId}
                      onSelectProject={setActiveProjectId}
                      onAddTask={handleAddTask}
                      onAddProject={handleAddProject}
                      onToggleTask={handleToggleTask}
                      onDeleteTask={handleDeleteTask}
                      onDeleteProject={handleDeleteProject}
                      activeTab={currentTab as 'projects' | 'tasks'}
                    />
                  </div>
                )}

                {/* TimelineView */}
                {currentTab === 'history' && (
                  <div className={`border-t ${isLightTheme ? 'border-stone-300/60' : 'border-white/5'} pt-8`}>
                    <TimelineView
                      sessions={sessions}
                      tasks={tasks}
                      projects={projects}
                      settings={settings}
                    />
                  </div>
                )}

                {/* StatsView */}
                {currentTab === 'stats' && (
                  <div className={`border-t ${isLightTheme ? 'border-stone-300/60' : 'border-white/5'} pt-8`}>
                    <StatsView
                      tasks={tasks}
                      projects={projects}
                      sessions={sessions}
                      settings={settings}
                    />
                  </div>
                )}

                {/* Settings Panel */}
                {currentTab === 'settings' && (
                  <div className={`border-t ${isLightTheme ? 'border-stone-300/60' : 'border-white/5'} pt-8`}>
                    <SettingsPanel
                      settings={settings}
                      onUpdateSettings={(updated) => {
                        setSettings(updated);
                        // Automatically sync active timer limit
                        setSecondsRemaining(updated.focusDuration * 60);
                      }}
                      onResetAllData={() => {
                        localStorage.removeItem(STORAGE_KEY);
                        setProjects([]);
                        setTasks([]);
                        setSessions([]);
                        setActiveProjectId('');
                        setActiveTaskId('');
                        playSound('double');
                        window.location.reload();
                      }}
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

      </main>

      {/* --- Footer Status Bar --- */}
      {!isDeepFocusMode && (
        <footer className={`border-t pt-4 flex items-center justify-between text-[11px] font-mono mt-8 ${
          isLightTheme 
            ? 'border-stone-300/50 text-stone-500' 
            : 'border-white/5 text-gray-500'
        }`}>
          <div className="flex items-center gap-4">
            <span>Layout Order: <strong className={`${isLightTheme ? 'text-stone-850' : 'text-gray-400'} capitalize`}>{settings.layoutOrder.join(' → ')}</strong></span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              Streak: {getStreakCount()} Sessions
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden md:inline">
              Press <kbd className={`px-1 rounded text-[10px] font-bold ${
                isLightTheme 
                  ? 'bg-black/5 border border-stone-200 text-stone-600' 
                  : 'bg-white/5 border border-white/5 text-gray-400'
              }`}>F</kbd> for Command Palette
            </span>
            <span>v1.0.0</span>
          </div>
        </footer>
      )}

      {/* --- Command Palette Modal Overlay --- */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        tasks={tasks}
        projects={projects}
        onSelectTask={setActiveTaskId}
        onSelectProject={setActiveProjectId}
        onExecuteCommand={handleExecuteCommand}
      />
    </div>
  );
}
