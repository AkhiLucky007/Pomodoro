import React from 'react';
import { Session, Task, Project, Settings } from '../types';
import { getIsLightTheme } from '../colorUtils';

interface TimelineViewProps {
  sessions: Session[];
  tasks: Task[];
  projects: Project[];
  settings?: Settings;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ sessions, tasks, projects, settings }) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  // Get completed sessions from today, sorted by start time
  const todaySessions = sessions
    .filter((s) => s.completed && s.startedAt >= todayStart)
    .sort((a, b) => a.startedAt - b.startedAt);

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getSessionBlocks = (durationSeconds: number) => {
    // 1 block per 2 minutes (120s), minimum 1 block
    const numBlocks = Math.max(1, Math.min(25, Math.floor(durationSeconds / 120)));
    return '█'.repeat(numBlocks);
  };

  const isLightTheme = getIsLightTheme(settings ?? {});

  const textPrimary = isLightTheme ? 'text-stone-900 font-semibold' : 'text-white';
  const textSecondary = isLightTheme ? 'text-stone-500 font-medium' : 'text-gray-400';
  const textMuted = isLightTheme ? 'text-stone-400' : 'text-gray-500';
  const borderLineClass = isLightTheme ? 'bg-black/10' : 'bg-white/10';

  return (
    <div className="space-y-6 py-2">
      <div className="flex items-center justify-between">
        <h2 className={`text-xs font-semibold tracking-wider ${textSecondary} uppercase font-mono`}>
          Session Timeline
        </h2>
        <span className={`text-[10px] font-mono ${textMuted}`}>
          Today's Flow
        </span>
      </div>

      <div className="font-mono text-sm space-y-4 max-w-2xl">
        {todaySessions.length === 0 ? (
          <p className={`text-xs ${textMuted} font-mono py-8 text-center`}>
            No completed sessions today. Start a timer to build your timeline.
          </p>
        ) : (
          todaySessions.map((session, idx) => {
            const isFocus = session.type === 'focus';
            const startTimeStr = formatTime(session.startedAt);
            const durationMins = Math.floor(session.actualDuration / 60);

            let label = 'Break';
            let sublabel = '';
            
            if (isFocus) {
              const task = tasks.find((t) => t.id === session.taskId);
              const project = projects.find((p) => p.id === session.projectId);
              label = task ? task.title : 'Focus Session';
              sublabel = project ? `[${project.name}]` : '';
            }

            return (
              <div key={session.id} className="relative flex items-start gap-4">
                {/* Timeline node */}
                <div className={`flex-shrink-0 w-12 ${textSecondary} font-medium text-right`}>
                  {startTimeStr}
                </div>

                {/* Vertical line connector */}
                {idx < todaySessions.length - 1 && (
                  <div className={`absolute left-[3.35rem] top-5 bottom-[-1rem] w-[1px] ${borderLineClass}`} />
                )}

                {/* Timeline bullet */}
                <div className="flex-shrink-0 mt-1.5 z-10">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isFocus 
                        ? isLightTheme ? 'bg-indigo-600 ring-4 ring-indigo-600/10' : 'bg-indigo-400 ring-4 ring-indigo-400/20' 
                        : isLightTheme ? 'bg-emerald-600 ring-4 ring-emerald-600/10' : 'bg-emerald-400 ring-4 ring-emerald-400/20'
                    }`}
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className={`truncate font-sans font-medium ${isFocus ? textPrimary : `${textSecondary} italic`}`}>
                      {label} <span className={`text-xs ${textMuted} font-mono ml-1 font-normal`}>{sublabel}</span>
                    </span>
                    <span className={`text-[11px] ${textSecondary} whitespace-nowrap`}>
                      {durationMins}m
                    </span>
                  </div>
                  
                  {/* Visual block bar */}
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`text-xs tracking-tighter ${
                        isFocus 
                          ? isLightTheme ? 'text-indigo-600/50' : 'text-indigo-400/60' 
                          : isLightTheme ? 'text-emerald-600/50' : 'text-emerald-400/60'
                      }`}
                    >
                      {getSessionBlocks(session.actualDuration)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
