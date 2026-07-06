import React, { useState, useEffect, useRef } from 'react';
import { Task, Project } from '../types';
import { Search, Folder, CheckSquare, Settings as SettingsIcon, Play, RotateCcw, BarChart, History } from 'lucide-react';
import { playTap } from '../audio';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  projects: Project[];
  onSelectTask: (taskId: string) => void;
  onSelectProject: (projectId: string) => void;
  onExecuteCommand: (command: string) => void;
}

interface CommandItem {
  id: string;
  type: 'task' | 'project' | 'command';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  tasks,
  projects,
  onSelectTask,
  onSelectProject,
  onExecuteCommand,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Construct items list based on query
  const getFilteredItems = (): CommandItem[] => {
    const q = query.toLowerCase().trim();
    const items: CommandItem[] = [];

    // 1. Navigation & Actions (Commands)
    const commands: Omit<CommandItem, 'action'>[] = [
      { id: 'cmd-start', type: 'command', title: 'Start Focus Session', subtitle: 'Start the Pomodoro timer', icon: <Play className="w-4 h-4 text-emerald-400" /> },
      { id: 'cmd-reset', type: 'command', title: 'Reset Timer', subtitle: 'Reset the current timer', icon: <RotateCcw className="w-4 h-4 text-amber-400" /> },
      { id: 'cmd-home', type: 'command', title: 'Go to Home Screen', subtitle: 'View the primary desk layout', icon: <CheckSquare className="w-4 h-4 text-indigo-400" /> },
      { id: 'cmd-projects', type: 'command', title: 'View Projects List', subtitle: 'Navigate to project manager', icon: <Folder className="w-4 h-4 text-sky-400" /> },
      { id: 'cmd-tasks', type: 'command', title: 'View Tasks List', subtitle: 'Navigate to task manager', icon: <CheckSquare className="w-4 h-4 text-pink-400" /> },
      { id: 'cmd-history', type: 'command', title: 'View Session History', subtitle: 'View detailed chronological timeline', icon: <History className="w-4 h-4 text-purple-400" /> },
      { id: 'cmd-stats', type: 'command', title: 'View Statistics', subtitle: 'View weekly and lifetime stats', icon: <BarChart className="w-4 h-4 text-emerald-400" /> },
      { id: 'cmd-settings', type: 'command', title: 'Open Settings', subtitle: 'Configure visual style and keys', icon: <SettingsIcon className="w-4 h-4 text-gray-400" /> },
    ];

    const matchingCommands = commands
      .filter((cmd) => cmd.title.toLowerCase().includes(q) || cmd.subtitle?.toLowerCase().includes(q))
      .map((cmd) => ({
        ...cmd,
        action: () => onExecuteCommand(cmd.id),
      }));

    items.push(...matchingCommands);

    // 2. Matching Tasks
    const matchingTasks = tasks
      .filter((t) => !t.completed && t.title.toLowerCase().includes(q))
      .map((t) => {
        const proj = projects.find((p) => p.id === t.projectId);
        return {
          id: `task-${t.id}`,
          type: 'task' as const,
          title: t.title,
          subtitle: `Task in Project: ${proj ? proj.name : 'Unknown'}`,
          icon: <CheckSquare className="w-4 h-4 text-indigo-400" />,
          action: () => {
            onSelectTask(t.id);
            if (t.projectId) onSelectProject(t.projectId);
          },
        };
      });

    items.push(...matchingTasks);

    // 3. Matching Projects
    const matchingProjects = projects
      .filter((p) => p.name.toLowerCase().includes(q))
      .map((p) => ({
        id: `project-${p.id}`,
        type: 'project' as const,
        title: p.name,
        subtitle: 'Select project workspace',
        icon: <Folder className="w-4 h-4 text-sky-400" />,
        action: () => onSelectProject(p.id),
      }));

    items.push(...matchingProjects);

    return items;
  };

  const filteredItems = getFilteredItems();

  // Scroll active item into view
  useEffect(() => {
    const listEl = listRef.current;
    if (!listEl) return;
    const activeEl = listEl.children[selectedIndex] as HTMLElement;
    if (!activeEl) return;

    const listHeight = listEl.clientHeight;
    const activeTop = activeEl.offsetTop;
    const activeHeight = activeEl.clientHeight;

    if (activeTop + activeHeight > listHeight + listEl.scrollTop) {
      listEl.scrollTop = activeTop + activeHeight - listHeight;
    } else if (activeTop < listEl.scrollTop) {
      listEl.scrollTop = activeTop;
    }
  }, [selectedIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredItems[selectedIndex];
        if (selected) {
          selected.action();
          playTap();
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-black/60 backdrop-blur-xs">
      {/* Click outside to close */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="w-full max-w-lg bg-neutral-900 border border-white/10 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[50vh] animate-fade-in">
        {/* Search header */}
        <div className="flex items-center px-4 py-3 border-b border-white/10 gap-3">
          <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a task, project, or command..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent border-none text-white outline-none placeholder-gray-500 text-sm font-sans"
          />
          <kbd className="text-[10px] font-mono text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto scroll-contain p-2 space-y-0.5 scrollbar-thin"
        >
          {filteredItems.length === 0 ? (
            <p className="text-xs text-gray-500 font-mono py-8 text-center">
              No matching items found. Try another search.
            </p>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.action();
                    playTap();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <div className="flex-shrink-0">{item.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${isSelected ? 'font-medium' : ''}`}>
                      {item.title}
                    </p>
                    {item.subtitle && (
                      <p className="text-[10px] text-gray-500 truncate font-mono mt-0.5">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <span className="text-[10px] text-gray-400 font-mono font-medium">
                      ↵ Enter
                    </span>
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
