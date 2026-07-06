export interface Project {
  id: string;
  name: string;
  createdAt: number;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
  sessionsCount: number;
  totalFocusedTime: number; // in seconds
  lastWorkedAt?: number;
}

export interface Session {
  id: string;
  taskId: string;
  projectId: string;
  type: 'focus' | 'break';
  duration: number; // expected duration in seconds (e.g., 1500)
  actualDuration: number; // actual seconds spent (for interruption logging)
  startedAt: number;
  completedAt?: number;
  completed: boolean;
}

export type FontStyle = 'sans' | 'serif' | 'mono' | 'grotesk';
export type FontSize = 'sm' | 'md' | 'lg' | 'xl';
export type ThemeBg = 'sophisticated-dark' | 'desert-beige' | 'mocha' | 'royal-purple' | 'deep-blue' | 'liquid-glass' | 'slate' | 'nord' | 'sand' | 'warm-dark' | 'obsidian' | 'forest' | 'gradient-mesh' | 'custom-image' | 'custom-color';
export type TimerSound = 'mechanical' | 'bell' | 'digital' | 'none';
export type ActiveTab = 'home' | 'projects' | 'tasks' | 'history' | 'stats' | 'settings';

export interface ShortcutConfig {
  startPause: string; // "Space"
  reset: string; // "R"
  newTask: string; // "N"
  newProject: string; // "Ctrl+N" (or "Alt+N" for browser ease)
  search: string; // "F" or "Ctrl+K"
  viewProjects: string; // "Ctrl+1"
  viewTasks: string; // "Ctrl+2"
  viewHistory: string; // "Ctrl+3"
  toggleFocus: string; // "D" (Deep focus toggle)
}

export interface Settings {
  themeBg: ThemeBg;
  backgroundImageUrl: string;
  fontStyle: FontStyle;
  fontSize: FontSize;
  timerSound: TimerSound;
  focusDuration: number; // minutes
  breakDuration: number; // minutes
  accentColor: 'indigo' | 'amber' | 'emerald' | 'sky' | 'rose' | 'neutral' | 'crimson';
  shortcuts: ShortcutConfig;
  layoutOrder: string[]; // for drag & drop style settings layouts
  glassTransparency?: number; // 0 to 100, default 30
  glassTheme?: 'light' | 'dark'; // 'light' | 'dark', default 'dark'
  customBgColor?: string; // hex color, used when themeBg === 'custom-color'
  fontColorMode?: 'auto' | 'custom'; // 'auto' derives contrast from background, 'custom' uses customFontColor
  customFontColor?: string; // hex color for primary text when fontColorMode === 'custom'
}

export interface AppState {
  projects: Project[];
  tasks: Task[];
  sessions: Session[];
  settings: Settings;
  activeProjectId: string;
  activeTaskId: string;
  timerState: {
    status: 'idle' | 'running' | 'paused' | 'break' | 'interrupted';
    type: 'focus' | 'break';
    secondsRemaining: number;
    totalSeconds: number;
    lastSavedTimestamp: number;
    currentSessionId: string;
  };
}

export const DEFAULT_SHORTCUTS: ShortcutConfig = {
  startPause: ' ',
  reset: 'r',
  newTask: 'n',
  newProject: 'p', // Use simple keys as fallback or modifier keys
  search: 'f',
  viewProjects: '1', // We can support Ctrl+1, Ctrl+2 etc. but also normal keys
  viewTasks: '2',
  viewHistory: '3',
  toggleFocus: 'd'
};

export const DEFAULT_SETTINGS: Settings = {
  themeBg: 'sophisticated-dark',
  backgroundImageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop',
  fontStyle: 'sans',
  fontSize: 'md',
  timerSound: 'mechanical',
  focusDuration: 25,
  breakDuration: 5,
  accentColor: 'indigo',
  shortcuts: DEFAULT_SHORTCUTS,
  layoutOrder: ['home', 'projects', 'tasks', 'history', 'stats'],
  glassTransparency: 30,
  glassTheme: 'dark',
  customBgColor: '#161616',
  fontColorMode: 'auto',
  customFontColor: '#FFFFFF'
};
