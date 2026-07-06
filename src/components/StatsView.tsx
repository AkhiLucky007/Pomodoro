import React from 'react';
import { Task, Project, Session, Settings } from '../types';
import { getIsLightTheme, getLiquidGlassStyle } from '../colorUtils';

interface StatsViewProps {
  tasks: Task[];
  projects: Project[];
  sessions: Session[];
  settings?: Settings;
}

export const StatsView: React.FC<StatsViewProps> = ({ tasks, projects, sessions, settings }) => {
  // Calculations
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  // Focus sessions completed today
  const todaySessions = sessions.filter(
    (s) => s.type === 'focus' && s.completed && s.startedAt >= todayStart
  );

  const todayMinutes = todaySessions.reduce((acc, s) => acc + Math.floor(s.actualDuration / 60), 0);
  const todayHrs = Math.floor(todayMinutes / 60);
  const todayMins = todayMinutes % 60;

  // Streak calculations
  const calculateStreak = (): number => {
    // Group completed focus sessions by day
    const daysWithSessions = new Set<string>();
    sessions
      .filter((s) => s.type === 'focus' && s.completed)
      .forEach((s) => {
        const d = new Date(s.startedAt);
        daysWithSessions.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
      });

    let currentStreak = 0;
    let maxStreak = 0;
    const checkDate = new Date();

    // Walk backwards to count consecutive days
    for (let i = 0; i < 305; i++) {
      const dateStr = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
      if (daysWithSessions.has(dateStr)) {
        currentStreak++;
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
        }
      } else {
        // If it's not today and we broke the streak, we stop.
        // If it is today, we can continue walking back (since today might not have a session yet)
        if (i > 0) {
          currentStreak = 0;
        }
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return Math.max(maxStreak, currentStreak);
  };

  const longestStreak = calculateStreak();

  // Most focused project
  const getMostFocusedProject = (): string => {
    const projectMinutes: Record<string, number> = {};
    sessions
      .filter((s) => s.type === 'focus' && s.completed)
      .forEach((s) => {
        if (s.projectId) {
          projectMinutes[s.projectId] = (projectMinutes[s.projectId] || 0) + s.actualDuration;
        }
      });

    let maxProjId = '';
    let maxMinutes = 0;
    Object.entries(projectMinutes).forEach(([id, mins]) => {
      if (mins > maxMinutes) {
        maxMinutes = mins;
        maxProjId = id;
      }
    });

    const proj = projects.find((p) => p.id === maxProjId);
    return proj ? proj.name : 'None';
  };

  const mostFocusedProject = getMostFocusedProject();

  // Weekly data (last 7 days, Mon-Sun)
  const getWeeklyBlocks = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    // Let's gather the sessions for each of the last 7 days
    const weekCount: Record<string, number> = {
      'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0
    };

    const oneDayMs = 24 * 60 * 60 * 1000;
    const startOfWeek = new Date();
    // Go back to find the most recent Monday
    // getDay() is 0 for Sun, 1 for Mon, etc.
    const currentDay = startOfWeek.getDay();
    const distanceToMon = currentDay === 0 ? 6 : currentDay - 1;
    const mondayDate = new Date(startOfWeek.getTime() - distanceToMon * oneDayMs);
    mondayDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const targetDay = new Date(mondayDate.getTime() + i * oneDayMs);
      const startMs = targetDay.getTime();
      const endMs = startMs + oneDayMs;
      const dayName = days[targetDay.getDay()];

      const daySessions = sessions.filter(
        (s) => s.type === 'focus' && s.completed && s.startedAt >= startMs && s.startedAt < endMs
      );
      weekCount[dayName] = daySessions.length;
    }

    return weekCount;
  };

  const weeklyData = getWeeklyBlocks();
  const dayNamesOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const isLightTheme = getIsLightTheme(settings ?? {});

  const getGlassStyle = () => {
    if (settings?.themeBg !== 'liquid-glass') return undefined;
    return getLiquidGlassStyle(settings.glassTransparency ?? 30, settings.glassTheme ?? 'dark');
  };
  const glassPanelClass = settings?.themeBg === 'liquid-glass'
    ? `liquid-glass-panel ${settings.glassTheme === 'light' ? 'liquid-glass-panel--light' : ''}`
    : '';

  const textPrimary = isLightTheme ? 'text-stone-900 font-semibold' : 'text-white';
  const textSecondary = isLightTheme ? 'text-stone-500 font-medium' : 'text-gray-400';
  const textMuted = isLightTheme ? 'text-stone-400' : 'text-gray-500';
  const borderClass = isLightTheme ? 'border-stone-200' : 'border-white/5';
  const bgPanel = isLightTheme ? 'bg-black/5 border border-stone-200' : 'bg-white/5 border border-white/5';
  const blocksColor = isLightTheme ? 'text-indigo-600' : 'text-emerald-400';

  return (
    <div id="stats-panel" className="space-y-10 py-2">
      <div>
        <h2 className={`text-sm font-semibold tracking-wider ${textSecondary} uppercase mb-6`}>Today</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div style={getGlassStyle()} className={`p-4 rounded-lg ${bgPanel} ${glassPanelClass}`}>
            <p className={`text-xs ${textSecondary} font-mono`}>Focused</p>
            <p className={`text-xl font-medium mt-1 font-mono ${textPrimary}`}>
              {todayHrs > 0 ? `${todayHrs}h ` : ''}{todayMins}m
            </p>
          </div>
          <div style={getGlassStyle()} className={`p-4 rounded-lg ${bgPanel} ${glassPanelClass}`}>
            <p className={`text-xs ${textSecondary} font-mono`}>Sessions</p>
            <p className={`text-xl font-medium mt-1 font-mono ${textPrimary}`}>{todaySessions.length}</p>
          </div>
          <div style={getGlassStyle()} className={`p-4 rounded-lg ${bgPanel} ${glassPanelClass}`}>
            <p className={`text-xs ${textSecondary} font-mono`}>Longest streak</p>
            <p className={`text-xl font-medium mt-1 font-mono ${textPrimary}`}>{longestStreak} days</p>
          </div>
          <div style={getGlassStyle()} className={`p-4 rounded-lg ${bgPanel} ${glassPanelClass} col-span-2 md:col-span-1`}>
            <p className={`text-xs ${textSecondary} font-mono`}>Most focused project</p>
            <p className={`text-sm font-medium mt-1 truncate ${textPrimary}`} title={mostFocusedProject}>
              {mostFocusedProject}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className={`text-sm font-semibold tracking-wider ${textSecondary} uppercase mb-6`}>Weekly</h2>
        <div className="space-y-4 font-mono max-w-md">
          {dayNamesOrder.map((day) => {
            const sessionsCount = weeklyData[day] || 0;
            // Create an elegant block indicator
            const blocks = '█'.repeat(sessionsCount);
            return (
              <div key={day} className="flex items-center text-sm">
                <span className={`w-10 ${textSecondary}`}>{day}</span>
                <span className={`flex-1 ml-4 ${blocksColor} tracking-tight flex items-center min-h-[1.2rem]`}>
                  {sessionsCount > 0 ? (
                    <span className="animate-fade-in">{blocks}</span>
                  ) : (
                    <span className={`${isLightTheme ? 'text-stone-300' : 'text-gray-600'} font-mono`}>·</span>
                  )}
                  {sessionsCount > 0 && (
                    <span className={`text-[10px] ${textSecondary} ml-2`}>({sessionsCount})</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
