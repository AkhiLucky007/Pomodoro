import React, { useState } from 'react';
import { Settings, ThemeBg, FontStyle, FontSize, TimerSound } from '../types';
import { Save, Eye, ShieldAlert, ArrowUp, ArrowDown, HelpCircle, Volume2 } from 'lucide-react';
import { playTap, playTick, playDing, playDoubleBeep } from '../audio';
import { getIsLightTheme, getLiquidGlassStyle } from '../colorUtils';

interface SettingsProps {
  settings: Settings;
  onUpdateSettings: (settings: Settings) => void;
  onResetAllData: () => void;
}

export const SettingsPanel: React.FC<SettingsProps> = ({
  settings,
  onUpdateSettings,
  onResetAllData,
}) => {
  const [themeBg, setThemeBg] = useState<ThemeBg>(settings.themeBg);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(settings.backgroundImageUrl);
  const [fontStyle, setFontStyle] = useState<FontStyle>(settings.fontStyle);
  const [fontSize, setFontSize] = useState<FontSize>(settings.fontSize);
  const [timerSound, setTimerSound] = useState<TimerSound>(settings.timerSound);
  const [focusDuration, setFocusDuration] = useState(settings.focusDuration);
  const [breakDuration, setBreakDuration] = useState(settings.breakDuration);
  const [accentColor, setAccentColor] = useState(settings.accentColor);
  const [shortcuts, setShortcuts] = useState(settings.shortcuts);
  const [layoutOrder, setLayoutOrder] = useState<string[]>(settings.layoutOrder || ['home', 'projects', 'tasks', 'history', 'stats']);
  const [showSaved, setShowSaved] = useState(false);
  
  // Apple-style Liquid glass transparency and base mode (light/dark)
  const [glassTransparency, setGlassTransparency] = useState<number>(settings.glassTransparency ?? 30);
  const [glassTheme, setGlassTheme] = useState<'light' | 'dark'>(settings.glassTheme ?? 'dark');
  const [customBgColor, setCustomBgColor] = useState<string>(settings.customBgColor ?? '#161616');
  const [fontColorMode, setFontColorMode] = useState<'auto' | 'custom'>(settings.fontColorMode ?? 'auto');
  const [customFontColor, setCustomFontColor] = useState<string>(settings.customFontColor ?? '#FFFFFF');

  const handleSave = () => {
    onUpdateSettings({
      themeBg,
      backgroundImageUrl,
      fontStyle,
      fontSize,
      timerSound,
      focusDuration,
      breakDuration,
      accentColor,
      shortcuts,
      layoutOrder,
      glassTransparency,
      glassTheme,
      customBgColor,
      fontColorMode,
      customFontColor,
    });
    setShowSaved(true);
    playDoubleBeep();
    setTimeout(() => {
      setShowSaved(false);
    }, 2000);
  };

  const handleTestSound = () => {
    if (timerSound === 'mechanical') playTick();
    else if (timerSound === 'bell') playDing();
    else if (timerSound === 'digital') playDoubleBeep();
  };

  // Layout order change (simulating drag-and-drop via responsive button controls in Settings)
  const moveLayoutItem = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...layoutOrder];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newOrder.length) return;

    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIdx];
    newOrder[targetIdx] = temp;
    setLayoutOrder(newOrder);
    playTap();
  };

  const handleShortcutChange = (key: keyof typeof shortcuts, val: string) => {
    setShortcuts(prev => ({
      ...prev,
      [key]: val
    }));
  };

  const handleResetConfirm = () => {
    if (window.confirm('Are you absolutely sure you want to clear all projects, tasks, and historical session logs? This cannot be undone.')) {
      onResetAllData();
      playDoubleBeep();
    }
  };

  const isLightTheme = getIsLightTheme({ themeBg, glassTheme, customBgColor });

  const getGlassStyle = () => {
    if (themeBg !== 'liquid-glass') return undefined;
    return getLiquidGlassStyle(glassTransparency, glassTheme);
  };
  const glassPanelClass = themeBg === 'liquid-glass'
    ? `liquid-glass-panel ${glassTheme === 'light' ? 'liquid-glass-panel--light' : ''}`
    : '';

  const textPrimary = isLightTheme ? 'text-stone-900 font-semibold' : 'text-white';
  const textSecondary = isLightTheme ? 'text-stone-600 font-medium' : 'text-gray-400';
  const textMuted = isLightTheme ? 'text-stone-400' : 'text-gray-500';
  const borderClass = isLightTheme ? 'border-stone-300/50' : 'border-white/5';
  const bgPanel = isLightTheme ? 'bg-black/[0.03] border border-stone-200' : 'bg-white/[0.02] border border-white/5';
  const bgButtonActive = isLightTheme ? 'bg-black/15 text-stone-900 border-stone-400' : 'bg-white/15 text-white border-white/30';
  const bgButtonInactive = isLightTheme ? 'bg-black/5 text-stone-600 border-transparent hover:bg-black/10' : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10';
  
  const inputClass = isLightTheme 
    ? 'w-full px-3 py-1.5 bg-black/5 border border-stone-200 rounded text-xs font-mono text-stone-900 outline-none focus:border-stone-400'
    : 'w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-xs font-mono text-gray-200 outline-none focus:border-white/20';
    
  const selectClass = isLightTheme 
    ? 'w-full px-2.5 py-1.5 bg-black/5 border border-stone-200 rounded text-xs text-stone-900 focus:outline-none'
    : 'w-full px-2.5 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-gray-300 focus:outline-none';

  return (
    <div className="space-y-8 py-2 max-w-4xl">
      <div className={`flex items-center justify-between border-b pb-4 ${borderClass}`}>
        <div>
          <h2 className={`text-base font-semibold ${isLightTheme ? 'text-stone-900' : 'text-white'}`}>Application Settings</h2>
          <p className={`text-xs ${textSecondary} font-mono mt-1`}>
            Configure visual atmosphere, intervals, audio triggers, and controls
          </p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded text-sm font-medium transition-colors cursor-pointer shadow-sm"
        >
          <Save className="w-4 h-4" />
          {showSaved ? 'Saved' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Visual Settings Column */}
        <div className="space-y-6">
          <div 
            style={getGlassStyle()}
            className={`${bgPanel} ${glassPanelClass} p-5 rounded-lg space-y-4`}
          >
            <h3 className={`text-xs font-semibold tracking-wider ${textSecondary} uppercase font-mono`}>
              Visual Style & Ambience
            </h3>

            {/* Background Theme */}
            <div className="space-y-2">
              <label className={`text-xs font-medium ${textSecondary} font-mono`}>Background Wallpaper</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {([
                  'sophisticated-dark',
                  'desert-beige',
                  'mocha',
                  'royal-purple',
                  'deep-blue',
                  'liquid-glass',
                  'slate',
                  'nord',
                  'sand',
                  'warm-dark',
                  'obsidian',
                  'forest',
                  'gradient-mesh',
                  'custom-image',
                  'custom-color'
                ] as ThemeBg[]).map((bg) => (
                  <button
                    key={bg}
                    onClick={() => {
                      setThemeBg(bg);
                      playTap();
                    }}
                    className={`px-2 py-1.5 rounded text-[11px] font-mono border truncate cursor-pointer transition-colors ${
                      themeBg === bg ? bgButtonActive : bgButtonInactive
                    }`}
                    title={bg}
                  >
                    {bg.replace('-', ' ')}
                  </button>
                ))}
              </div>

              {/* Liquid Glass Dynamic Options */}
              {themeBg === 'liquid-glass' && (
                <div className={`mt-4 p-4 rounded-lg space-y-4 border ${
                  isLightTheme 
                    ? 'bg-black/5 border-stone-200' 
                    : 'bg-black/40 border-white/5'
                }`}>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className={textSecondary}>Glass Card Opacity</span>
                      <span className="text-indigo-500 font-bold">{Math.round(100 - glassTransparency)}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="95"
                      value={Math.round(100 - glassTransparency)}
                      onChange={(e) => {
                        setGlassTransparency(100 - parseInt(e.target.value));
                        playTick();
                      }}
                      className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                    />
                    <div className="flex justify-between text-[9px] text-gray-500 font-mono">
                      <span>Clear (0%)</span>
                      <span>Opaque (100%)</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={`text-[10px] font-semibold ${textSecondary} font-mono uppercase block`}>
                      Glass Contrast Mode
                    </label>
                    <div className="flex gap-2">
                      {(['dark', 'light'] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            setGlassTheme(mode);
                            playTap();
                          }}
                          className={`px-2.5 py-1 rounded text-[10px] font-mono border cursor-pointer transition-all ${
                            glassTheme === mode
                              ? isLightTheme
                                ? 'bg-black/20 text-stone-900 border-stone-400 font-semibold'
                                : 'bg-white/15 text-white border-white/30 font-semibold'
                              : isLightTheme
                              ? 'bg-transparent text-stone-500 border-transparent hover:bg-black/5'
                              : 'bg-transparent text-gray-400 border-transparent hover:bg-white/5'
                          }`}
                        >
                          {mode === 'dark' ? ' Dark Glass' : ' Silver Glass'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {themeBg === 'custom-image' && (
                <div className="mt-2 space-y-1">
                  <span className={`text-[10px] ${textMuted} font-mono`}>Image URL</span>
                  <input
                    type="text"
                    value={backgroundImageUrl}
                    onChange={(e) => setBackgroundImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className={inputClass}
                  />
                </div>
              )}

              {themeBg === 'custom-color' && (
                <div className={`mt-4 p-4 rounded-lg space-y-3 border ${
                  isLightTheme ? 'bg-black/5 border-stone-200' : 'bg-black/40 border-white/5'
                }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={customBgColor}
                      onChange={(e) => {
                        setCustomBgColor(e.target.value);
                        playTick();
                      }}
                      className="w-10 h-10 rounded-md border border-white/10 cursor-pointer bg-transparent p-0"
                      title="Pick a background color"
                    />
                    <div className="flex-1 space-y-1">
                      <span className={`text-[10px] ${textMuted} font-mono block`}>Background Color</span>
                      <input
                        type="text"
                        value={customBgColor}
                        onChange={(e) => setCustomBgColor(e.target.value)}
                        className={`${inputClass} font-mono`}
                      />
                    </div>
                  </div>
                  <p className={`text-[10px] ${textMuted} font-mono leading-relaxed`}>
                    Every other color — text, borders, nav — automatically switches between light and dark
                    variants based on this color, so contrast always stays readable no matter what you pick.
                  </p>
                </div>
              )}
            </div>

            {/* Accent Colors */}
            <div className="space-y-2">
              <label className={`text-xs font-medium ${textSecondary} font-mono`}>Theme Accent Color</label>
              <div className="flex gap-2">
                {(['indigo', 'amber', 'emerald', 'sky', 'rose', 'neutral', 'crimson'] as const).map((color) => {
                  const colorMap = {
                    indigo: 'bg-indigo-400',
                    amber: 'bg-amber-400',
                    emerald: 'bg-emerald-400',
                    sky: 'bg-sky-400',
                    rose: 'bg-rose-400',
                    neutral: 'bg-gray-400',
                    crimson: 'bg-red-500',
                  };
                  return (
                    <button
                      key={color}
                      onClick={() => {
                        setAccentColor(color);
                        playTap();
                      }}
                      className={`w-6 h-6 rounded-full ${colorMap[color]} border-2 cursor-pointer ${
                        accentColor === color 
                          ? isLightTheme ? 'border-stone-850 scale-110' : 'border-white scale-110' 
                          : 'border-transparent hover:scale-105'
                      } transition-transform`}
                      title={color}
                    />
                  );
                })}
              </div>
            </div>

            {/* Typography pairings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={`text-xs font-medium ${textSecondary} font-mono`}>Font Family</label>
                <select
                  value={fontStyle}
                  onChange={(e) => {
                    setFontStyle(e.target.value as FontStyle);
                    playTap();
                  }}
                  className={selectClass}
                >
                  <option value="sans" className="bg-neutral-900 text-white">Inter (Sans)</option>
                  <option value="serif" className="bg-neutral-900 text-white">Playfair (Serif)</option>
                  <option value="mono" className="bg-neutral-900 text-white">JetBrains (Mono)</option>
                  <option value="grotesk" className="bg-neutral-900 text-white">Grotesk (Modern)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className={`text-xs font-medium ${textSecondary} font-mono`}>Font Scale</label>
                <select
                  value={fontSize}
                  onChange={(e) => {
                    setFontSize(e.target.value as FontSize);
                    playTap();
                  }}
                  className={selectClass}
                >
                  <option value="sm" className="bg-neutral-900 text-white">Compact</option>
                  <option value="md" className="bg-neutral-900 text-white">Standard</option>
                  <option value="lg" className="bg-neutral-900 text-white">Expanded</option>
                  <option value="xl" className="bg-neutral-900 text-white">Display</option>
                </select>
              </div>
            </div>

            {/* Font Color */}
            <div className="space-y-2">
              <label className={`text-xs font-medium ${textSecondary} font-mono`}>Font Color</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFontColorMode('auto');
                    playTap();
                  }}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono border cursor-pointer transition-all ${
                    fontColorMode === 'auto' ? bgButtonActive : bgButtonInactive
                  }`}
                >
                  Auto (contrast)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFontColorMode('custom');
                    playTap();
                  }}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono border cursor-pointer transition-all ${
                    fontColorMode === 'custom' ? bgButtonActive : bgButtonInactive
                  }`}
                >
                  Custom color
                </button>
              </div>

              {fontColorMode === 'custom' && (
                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="color"
                    value={customFontColor}
                    onChange={(e) => {
                      setCustomFontColor(e.target.value);
                      playTick();
                    }}
                    className="w-10 h-10 rounded-md border border-white/10 cursor-pointer bg-transparent p-0"
                    title="Pick a font color"
                  />
                  <input
                    type="text"
                    value={customFontColor}
                    onChange={(e) => setCustomFontColor(e.target.value)}
                    className={`${inputClass} font-mono flex-1`}
                  />
                </div>
              )}
              <p className={`text-[10px] ${textMuted} font-mono leading-relaxed`}>
                {fontColorMode === 'auto'
                  ? 'Text color follows the background automatically.'
                  : 'Applies to headings and primary text app-wide. Secondary labels and status colors (success, error, streaks) stay theme-driven so they keep their meaning.'}
              </p>
            </div>
          </div>

          {/* Durations and Sound */}
          <div 
            style={getGlassStyle()}
            className={`${bgPanel} ${glassPanelClass} p-5 rounded-lg space-y-4`}
          >
            <h3 className={`text-xs font-semibold tracking-wider ${textSecondary} uppercase font-mono`}>
              Timer Intervals & Sounds
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={`text-xs font-medium ${textSecondary} font-mono`}>Focus (Minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={focusDuration}
                  onChange={(e) => setFocusDuration(parseInt(e.target.value) || 25)}
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label className={`text-xs font-medium ${textSecondary} font-mono`}>Break (Minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={breakDuration}
                  onChange={(e) => setBreakDuration(parseInt(e.target.value) || 5)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={`text-xs font-medium ${textSecondary} font-mono`}>Mechanical Sound Output</label>
              <div className="flex gap-2">
                <select
                  value={timerSound}
                  onChange={(e) => {
                    setTimerSound(e.target.value as TimerSound);
                    playTap();
                  }}
                  className={selectClass}
                >
                  <option value="mechanical" className="bg-neutral-900 text-white">Wood Block Click (Mechanical)</option>
                  <option value="bell" className="bg-neutral-900 text-white">Resonant Bell (Ding)</option>
                  <option value="digital" className="bg-neutral-900 text-white">Digital Accent (Double-Beep)</option>
                  <option value="none" className="bg-neutral-900 text-white">Muted / Quiet</option>
                </select>
                <button
                  onClick={handleTestSound}
                  className={`px-3 border rounded text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    isLightTheme 
                      ? 'bg-black/5 hover:bg-black/10 border-stone-300 text-stone-700' 
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300'
                  }`}
                  title="Test Sound Tone"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  Test
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Layout and Key Shortcuts Column */}
        <div className="space-y-6">
          {/* Shortcuts mapping */}
          <div 
            style={getGlassStyle()}
            className={`${bgPanel} ${glassPanelClass} p-5 rounded-lg space-y-4`}
          >
            <h3 className={`text-xs font-semibold tracking-wider ${textSecondary} uppercase font-mono`}>
              Keyboard Shortcuts Mapping
            </h3>
            <p className={`text-[10px] ${textMuted} font-mono leading-relaxed`}>
              Customize single key bindings or hotkeys. Pressing any of these keys runs the action globally when not editing input fields.
            </p>

            <div className="space-y-2 max-h-[220px] overflow-y-auto scroll-contain pr-1">
              {Object.keys(shortcuts).map((actionKey) => {
                const typedKey = actionKey as keyof typeof shortcuts;
                const labels: Record<string, string> = {
                  startPause: 'Start/Pause Timer',
                  reset: 'Reset Timer',
                  newTask: 'Create New Task',
                  newProject: 'Create New Project',
                  search: 'Open Command Palette',
                  viewProjects: 'Switch to Projects Panel',
                  viewTasks: 'Switch to Tasks Panel',
                  viewHistory: 'Switch to History Panel',
                  toggleFocus: 'Toggle Deep Focus',
                };
                return (
                  <div key={actionKey} className={`flex items-center justify-between text-xs font-mono border-b pb-1.5 ${borderClass} last:border-0`}>
                    <span className={`${textSecondary} text-[11px]`}>{labels[actionKey] || actionKey}</span>
                    <input
                      type="text"
                      value={shortcuts[typedKey]}
                      onChange={(e) => handleShortcutChange(typedKey, e.target.value)}
                      className={`w-20 px-2 py-0.5 rounded text-center font-bold text-[11px] focus:outline-none focus:ring-1 ${
                        isLightTheme 
                          ? 'bg-black/5 border border-stone-200 text-indigo-600 focus:border-indigo-400 focus:ring-indigo-400' 
                          : 'bg-white/5 border border-white/10 text-indigo-300 focus:border-indigo-500 focus:ring-indigo-500'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Layout Drag/Drop arrangement Simulation */}
          <div 
            style={getGlassStyle()}
            className={`${bgPanel} ${glassPanelClass} p-5 rounded-lg space-y-4`}
          >
            <div className="flex justify-between items-center">
              <h3 className={`text-xs font-semibold tracking-wider ${textSecondary} uppercase font-mono`}>
                Responsive Panels Order
              </h3>
              <span className={`text-[10px] font-mono ${textMuted}`}>Settings Drag / Reorder</span>
            </div>
            <p className={`text-[10px] ${textMuted} font-mono leading-relaxed`}>
              Rearrange the order of components on the desk interface using the order triggers below.
            </p>

            <div className="space-y-1.5">
              {layoutOrder.map((item, idx) => {
                const labels: Record<string, string> = {
                  home: 'Home (Timer & Recommendations)',
                  projects: 'Projects Manager',
                  tasks: 'Tasks Checklist',
                  history: 'Session Timeline',
                  stats: 'Statistics & Grid'
                };
                return (
                  <div
                    key={item}
                    className={`flex items-center justify-between px-3 py-1.5 border rounded-md text-xs font-mono ${
                      isLightTheme 
                        ? 'bg-black/5 border-stone-200 text-stone-800' 
                        : 'bg-white/5 border-white/5 text-gray-300'
                    }`}
                  >
                    <span>{idx + 1}. {labels[item] || item}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => moveLayoutItem(idx, 'up')}
                        disabled={idx === 0}
                        className={`p-1 rounded disabled:opacity-20 transition-opacity cursor-pointer ${
                          isLightTheme 
                            ? 'hover:bg-black/10 text-stone-600 hover:text-stone-900' 
                            : 'hover:bg-white/10 text-gray-400 hover:text-white'
                        }`}
                        title="Move Panel Up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => moveLayoutItem(idx, 'down')}
                        disabled={idx === layoutOrder.length - 1}
                        className={`p-1 rounded disabled:opacity-20 transition-opacity cursor-pointer ${
                          isLightTheme 
                            ? 'hover:bg-black/10 text-stone-600 hover:text-stone-900' 
                            : 'hover:bg-white/10 text-gray-400 hover:text-white'
                        }`}
                        title="Move Panel Down"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className={`border p-5 rounded-lg flex items-center justify-between ${
        isLightTheme 
          ? 'bg-rose-50 border-rose-200 text-stone-900' 
          : 'bg-rose-950/20 border-rose-900/40'
      }`}>
        <div className="space-y-1">
          <h4 className="text-xs font-semibold tracking-wider text-rose-500 uppercase font-mono flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            Danger Zone
          </h4>
          <p className={`text-[11px] font-sans ${isLightTheme ? 'text-stone-600' : 'text-gray-400'}`}>
            Wipe out the local storage cache completely, destroying all projects, checklist tasks, and session records.
          </p>
        </div>
        <button
          onClick={handleResetConfirm}
          className="px-4 py-2 bg-rose-900/60 hover:bg-rose-950 border border-rose-800 rounded text-xs font-medium text-rose-100 transition-colors font-mono cursor-pointer"
        >
          Reset All Data
        </button>
      </div>
    </div>
  );
};
