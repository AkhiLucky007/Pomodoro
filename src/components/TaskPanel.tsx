import React, { useState } from 'react';
import { Task, Project, Settings } from '../types';
import { getIsLightTheme, getLiquidGlassStyle } from '../colorUtils';
import { Plus, Trash2, Calendar, Clock, RotateCcw, Check, Play } from 'lucide-react';
import { playTick, playTap } from '../audio';

interface TaskPanelProps {
  tasks: Task[];
  projects: Project[];
  activeProjectId: string;
  activeTaskId: string;
  settings: Settings;
  onSelectTask: (taskId: string) => void;
  onSelectProject: (projectId: string) => void;
  onAddTask: (title: string, projectId: string) => void;
  onAddProject: (name: string) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onDeleteProject: (projectId: string) => void;
  activeTab: 'projects' | 'tasks';
}

export const TaskPanel: React.FC<TaskPanelProps> = ({
  tasks,
  projects,
  activeProjectId,
  activeTaskId,
  settings,
  onSelectTask,
  onSelectProject,
  onAddTask,
  onAddProject,
  onToggleTask,
  onDeleteTask,
  onDeleteProject,
  activeTab,
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);

  const activeProject = projects.find((p) => p.id === activeProjectId);
  const filteredTasks = tasks.filter((t) => t.projectId === activeProjectId);

  // Stats for hover card
  const getTaskHoverStats = (task: Task) => {
    const hours = Math.floor(task.totalFocusedTime / 3600);
    const minutes = Math.floor((task.totalFocusedTime % 3600) / 60);

    let lastWorkedStr = 'Never';
    if (task.lastWorkedAt) {
      const lastDate = new Date(task.lastWorkedAt);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) lastWorkedStr = 'Today';
      else if (diffDays === 2) lastWorkedStr = 'Yesterday';
      else lastWorkedStr = `${diffDays - 1} days ago`;
    }

    return {
      focusedTimes: task.sessionsCount,
      totalTimeStr: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
      lastWorked: lastWorkedStr,
    };
  };

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onAddTask(newTaskTitle.trim(), activeProjectId);
    setNewTaskTitle('');
    playTap();
  };

  const handleProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    onAddProject(newProjectName.trim());
    setNewProjectName('');
    playTap();
  };

  const isLightTheme = getIsLightTheme(settings);

  const getGlassStyle = () => {
    if (settings.themeBg !== 'liquid-glass') return undefined;
    return getLiquidGlassStyle(settings.glassTransparency ?? 30, settings.glassTheme ?? 'dark');
  };
  const glassPanelClass = settings.themeBg === 'liquid-glass'
    ? `liquid-glass-panel ${settings.glassTheme === 'light' ? 'liquid-glass-panel--light' : ''}`
    : '';

  const textPrimary = isLightTheme ? 'text-stone-900 font-medium' : 'text-white';
  const textSecondary = isLightTheme ? 'text-stone-500 font-medium' : 'text-gray-400';
  const textMuted = isLightTheme ? 'text-stone-400' : 'text-gray-500';
  const borderClass = isLightTheme ? 'border-stone-300/50' : 'border-white/5';
  
  const inputClass = isLightTheme 
    ? 'flex-1 px-3 py-1.5 bg-black/5 border border-stone-200 rounded text-sm focus:outline-none focus:border-stone-400 font-sans text-stone-900 placeholder-stone-400'
    : 'flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm focus:outline-none focus:border-white/20 font-sans text-gray-200 placeholder-gray-500';
    
  const buttonClass = isLightTheme
    ? 'p-1.5 bg-black/5 hover:bg-black/10 border border-stone-200 rounded text-stone-500 hover:text-stone-900 transition-colors cursor-pointer'
    : 'p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-gray-400 hover:text-white transition-colors cursor-pointer';

  const hoverCardBg = isLightTheme
    ? 'absolute left-6 top-10 z-50 w-56 p-3 bg-white border border-stone-200 rounded-lg shadow-xl text-xs font-mono space-y-1.5 text-stone-700 animate-fade-in pointer-events-none'
    : 'absolute left-6 top-10 z-50 w-56 p-3 bg-neutral-900 border border-white/10 rounded-lg shadow-xl text-xs font-mono space-y-1.5 text-gray-300 animate-fade-in pointer-events-none';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-2">
      {/* Projects Column */}
      <div 
        style={activeTab === 'projects' ? getGlassStyle() : undefined}
        className={`md:col-span-1 space-y-4 ${activeTab === 'projects' ? `ring-1 ${isLightTheme ? 'ring-black/10 bg-black/[0.03]' : 'ring-white/10 bg-white/[0.02]'} p-4 rounded-lg ${glassPanelClass}` : ''}`}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className={`text-xs font-semibold tracking-wider ${textSecondary} uppercase font-mono`}>
            Projects
          </h2>
          <span className={`text-[10px] font-mono ${textMuted} ${isLightTheme ? 'bg-black/10' : 'bg-white/5'} px-1.5 py-0.5 rounded`}>
            Ctrl+1
          </span>
        </div>

        <form onSubmit={handleProjectSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="New Project..."
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            className={inputClass}
          />
          <button
            type="submit"
            className={buttonClass}
            title="Create Project (Ctrl+N)"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>

        <div className="space-y-1 max-h-[300px] overflow-y-auto scroll-contain pr-1">
          {projects.map((p) => {
            const isActive = p.id === activeProjectId;
            const projectTasksCount = tasks.filter((t) => t.projectId === p.id && !t.completed).length;

            return (
              <div
                key={p.id}
                onClick={() => onSelectProject(p.id)}
                className={`group flex items-center justify-between px-3 py-2 rounded text-sm cursor-pointer transition-all-custom ${
                  isActive
                    ? isLightTheme 
                      ? 'bg-black/10 text-stone-900 font-semibold border-l-2 border-stone-800'
                      : 'bg-white/10 text-white font-medium border-l-2 border-white'
                    : isLightTheme
                    ? 'text-stone-500 hover:bg-black/5 hover:text-stone-900'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`}
              >
                <span className="truncate flex-1">{p.name}</span>
                <div className="flex items-center gap-2">
                  {projectTasksCount > 0 && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 ${isLightTheme ? 'bg-black/10 text-stone-500' : 'bg-white/5 text-gray-400'} rounded-full`}>
                      {projectTasksCount}
                    </span>
                  )}
                  {projects.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProject(p.id);
                      }}
                      className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity ${
                        isLightTheme 
                          ? 'hover:bg-black/10 text-stone-500 hover:text-rose-600' 
                          : 'hover:bg-white/10 text-gray-500 hover:text-rose-400'
                      }`}
                      title="Delete Project"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tasks Column */}
      <div 
        style={activeTab === 'tasks' ? getGlassStyle() : undefined}
        className={`md:col-span-2 space-y-4 ${activeTab === 'tasks' ? `ring-1 ${isLightTheme ? 'ring-black/10 bg-black/[0.03]' : 'ring-white/10 bg-white/[0.02]'} p-4 rounded-lg ${glassPanelClass}` : ''}`}
      >
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className={`text-xs font-semibold tracking-wider ${textSecondary} uppercase font-mono`}>
              Tasks
            </h2>
            <p className={`text-[10px] ${textMuted} font-mono truncate mt-0.5 max-w-xs md:max-w-md`}>
              In: {activeProject?.name || 'No Project'}
            </p>
          </div>
          <span className={`text-[10px] font-mono ${textMuted} ${isLightTheme ? 'bg-black/10' : 'bg-white/5'} px-1.5 py-0.5 rounded`}>
            Ctrl+2
          </span>
        </div>

        <form onSubmit={handleTaskSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="New Task in this project..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className={inputClass}
          />
          <button
            type="submit"
            className={buttonClass}
            title="Create Task (N)"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>

        <div className="space-y-1 max-h-[350px] overflow-y-auto scroll-contain pr-1">
          {filteredTasks.length === 0 ? (
            <p className={`text-xs ${textMuted} font-mono py-4 text-center`}>
              No tasks in this project. Add one above.
            </p>
          ) : (
            filteredTasks.map((t) => {
              const isSelected = t.id === activeTaskId;
              const stats = getTaskHoverStats(t);

              return (
                <div
                  key={t.id}
                  onMouseEnter={() => setHoveredTaskId(t.id)}
                  onMouseLeave={() => setHoveredTaskId(null)}
                  onClick={() => onSelectTask(t.id)}
                  className={`group relative flex items-center justify-between px-3 py-2.5 rounded text-sm cursor-pointer transition-all-custom ${
                    t.completed
                      ? isLightTheme ? 'text-stone-400' : 'text-gray-500'
                      : isSelected
                      ? isLightTheme
                        ? 'bg-black/5 text-stone-900 border-l-2 border-indigo-500 font-medium'
                        : 'bg-white/5 text-white border-l-2 border-indigo-400'
                      : isLightTheme
                      ? 'text-stone-700 hover:bg-black/5'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleTask(t.id);
                      }}
                      className={`p-0.5 rounded transition-colors focus:outline-none flex-shrink-0 ${
                        isLightTheme ? 'hover:bg-black/10' : 'hover:bg-white/10'
                      }`}
                    >
                      {t.completed ? (
                        <span className="text-emerald-500 font-bold text-xs" title="Complete">✓</span>
                      ) : isSelected ? (
                        <span className="text-indigo-500 font-bold text-xs" title="Selected">▶</span>
                      ) : (
                        <span className={`font-normal text-xs ${isLightTheme ? 'text-stone-400 hover:text-stone-900' : 'text-gray-500 hover:text-white'}`} title="Select">○</span>
                      )}
                    </button>
                    <span className={`truncate flex-1 ${t.completed ? isLightTheme ? 'line-through text-stone-400' : 'line-through text-gray-500' : ''}`}>
                      {t.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Tiny stats indicator shown on general view */}
                    {!t.completed && t.sessionsCount > 0 && (
                      <span className={`text-[10px] font-mono px-1 py-0.5 rounded ${isLightTheme ? 'bg-black/10 text-stone-500' : 'bg-white/5 text-gray-400'}`}>
                        {t.sessionsCount} s
                      </span>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTask(t.id);
                      }}
                      className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity ${
                        isLightTheme 
                          ? 'hover:bg-black/10 text-stone-500 hover:text-rose-600' 
                          : 'hover:bg-white/10 text-gray-500 hover:text-rose-400'
                      }`}
                      title="Delete Task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Absolute elegant hover metadata card */}
                  {hoveredTaskId === t.id && (
                    <div className={hoverCardBg}>
                      <p className={`font-sans font-medium border-b pb-1 mb-1.5 truncate ${
                        isLightTheme ? 'text-stone-900 border-stone-200' : 'text-white border-white/5'
                      }`}>
                        {t.title}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className={isLightTheme ? 'text-stone-500' : 'text-gray-400'}>Focused:</span>
                        <span className={`font-medium ${isLightTheme ? 'text-stone-900' : 'text-white'}`}>{stats.focusedTimes} times</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={isLightTheme ? 'text-stone-500' : 'text-gray-400'}>Total time:</span>
                        <span className={`font-medium ${isLightTheme ? 'text-stone-900' : 'text-white'}`}>{stats.totalTimeStr}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={isLightTheme ? 'text-stone-500' : 'text-gray-400'}>Last worked:</span>
                        <span className={`font-medium ${isLightTheme ? 'text-stone-900' : 'text-white'}`}>{stats.lastWorked}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
