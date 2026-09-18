import React, { useState, useRef, useEffect } from 'react';
import { useWorkTime } from '../../context/WorkTimeContext';
import {
  Clock,
  Play,
  Pause,
  Coffee,
  CheckCircle,
  Bell,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Volume2,
  VolumeX,
  Sparkles,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const WorkTimeActivePill: React.FC = () => {
  const {
    activeTask,
    timerRunning,
    elapsedSeconds,
    isTakingBreak,
    breakSecondsRemaining,
    pauseTaskTimer,
    resumeTaskTimer,
    completeTask,
    takeBreak,
    endBreak,
    alerts,
    unreadAlertsCount,
    dismissAlert,
    clearAllAlerts,
    scheduleConfig,
    toggleSoundAlerts,
    shiftStats,
  } = useWorkTime();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine progress and alert status color
  const totalMinutes = activeTask ? activeTask.loggedMinutes + Math.floor(elapsedSeconds / 60) : 0;
  const estimated = activeTask ? activeTask.estimatedMinutes : 1;
  const percent = Math.min(150, Math.round((totalMinutes / estimated) * 100));

  const getPillColor = () => {
    if (isTakingBreak) return 'bg-amber-500/15 border-amber-500/40 text-amber-300';
    if (!activeTask) return 'bg-slate-800/80 border-slate-700/80 text-slate-300';
    if (percent >= 100) return 'bg-rose-500/15 border-rose-500/40 text-rose-300 animate-pulse';
    if (percent >= 80) return 'bg-amber-500/15 border-amber-500/40 text-amber-300';
    return 'bg-blue-500/15 border-blue-500/40 text-blue-300';
  };

  return (
    <div className="flex items-center gap-2" ref={dropdownRef}>
      {/* Active Work Timer / Break Pill */}
      {isTakingBreak ? (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-amber-500/10 border-amber-500/30 text-amber-300 text-xs font-semibold shadow-xs animate-in fade-in">
          <Coffee className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
          <span className="font-mono font-bold text-amber-200">
            {formatTime(breakSecondsRemaining)}
          </span>
          <span className="text-[11px] text-amber-400 hidden sm:inline">Rest Break</span>
          <button
            onClick={endBreak}
            className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold rounded-full transition-all ml-1"
          >
            Resume Work
          </button>
        </div>
      ) : activeTask ? (
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold shadow-xs transition-all ${getPillColor()}`}>
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => navigate('/work-time')}>
            <span className={`w-2 h-2 rounded-full ${timerRunning ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
            <Clock className="w-3.5 h-3.5" />
            <span className="font-mono font-bold">
              {formatTime(elapsedSeconds)}
            </span>
            <span className="text-[11px] text-slate-400 hidden md:inline">
              / {activeTask.estimatedMinutes}m
            </span>
            <span className="max-w-[120px] truncate text-slate-200 text-[11px] hidden xl:inline font-medium">
              {activeTask.title}
            </span>
          </div>

          <div className="flex items-center gap-1 ml-1 pl-1.5 border-l border-white/20">
            {timerRunning ? (
              <button
                onClick={pauseTaskTimer}
                className="p-1 hover:bg-white/20 rounded-md transition-colors text-slate-200 hover:text-white"
                title="Pause work timer"
              >
                <Pause className="w-3 h-3" />
              </button>
            ) : (
              <button
                onClick={resumeTaskTimer}
                className="p-1 hover:bg-white/20 rounded-md transition-colors text-emerald-300 hover:text-white"
                title="Resume work timer"
              >
                <Play className="w-3 h-3 fill-current" />
              </button>
            )}

            <button
              onClick={() => takeBreak(10)}
              className="p-1 hover:bg-white/20 rounded-md transition-colors text-amber-300 hover:text-white"
              title="Take a 10m rest break"
            >
              <Coffee className="w-3 h-3" />
            </button>

            <button
              onClick={() => completeTask(activeTask.id)}
              className="p-1 hover:bg-white/20 rounded-md transition-colors text-emerald-400 hover:text-white"
              title="Complete this task"
            >
              <CheckCircle className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : (
        <Link
          to="/work-time"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-700 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-xs font-medium transition-colors"
        >
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>Work Time: Ready</span>
        </Link>
      )}

      {/* Work Time Alerts Bell with Unread Badge */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={`relative p-2 rounded-xl border transition-all ${
            unreadAlertsCount > 0
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
              : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-700/80 hover:text-white'
          }`}
          title="Work Time Alerts"
        >
          <Bell className={`w-4 h-4 ${unreadAlertsCount > 0 ? 'text-amber-400 animate-wiggle' : ''}`} />
          {unreadAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center animate-pulse">
              {unreadAlertsCount}
            </span>
          )}
        </button>

        {/* Work Time Alerts Flyout Dropdown */}
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-2xl border border-slate-700/90 rounded-2xl shadow-2xl z-50 text-xs text-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2">
            
            {/* Header */}
            <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs">Work Time Alerts</h4>
                  <p className="text-[10px] text-slate-400">Calibrated to tasks & enterprise shift policy</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => toggleSoundAlerts()}
                  className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800"
                  title={scheduleConfig.soundAlertsEnabled ? 'Mute alert chime' : 'Enable alert chime'}
                >
                  {scheduleConfig.soundAlertsEnabled ? (
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </button>
                {alerts.length > 0 && (
                  <button
                    onClick={clearAllAlerts}
                    className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded hover:bg-slate-800"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Quick Shift Health Status */}
            <div className="px-3.5 py-2.5 bg-slate-900 border-b border-slate-800/80 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Shift Status:</span>
                <span className={`font-bold ${
                  shiftStats.workloadBalance === 'Optimal'
                    ? 'text-emerald-400'
                    : shiftStats.workloadBalance === 'Caution'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}>
                  {shiftStats.workloadBalance}
                </span>
              </div>
              <span className="text-slate-400 font-mono text-[10px]">
                {shiftStats.pendingTasksRequiredMinutes}m work / {shiftStats.remainingShiftMinutes}m remaining
              </span>
            </div>

            {/* Alerts Feed */}
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60 p-1">
              {alerts.length === 0 ? (
                <div className="py-8 px-4 text-center text-slate-400">
                  <CheckCircle className="w-7 h-7 text-emerald-400 mx-auto mb-2 opacity-80" />
                  <p className="font-semibold text-xs text-slate-300">All Work Time On Track</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">No active overtime, break, or workload alerts</p>
                </div>
              ) : (
                alerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-xl transition-colors hover:bg-slate-800/60 flex flex-col gap-1.5 ${
                      !alert.dismissed ? 'bg-slate-800/30' : 'opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {alert.severity === 'critical' ? (
                          <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0"></span>
                        ) : alert.severity === 'warning' ? (
                          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0"></span>
                        )}
                        <h5 className="font-bold text-xs text-white leading-tight">
                          {alert.title}
                        </h5>
                      </div>
                      <button
                        onClick={() => dismissAlert(alert.id)}
                        className="text-[10px] text-slate-500 hover:text-slate-300"
                      >
                        ✕
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-300 pl-3.5 leading-relaxed">
                      {alert.message}
                    </p>

                    <div className="flex items-center justify-between pl-3.5 pt-1 text-[10px] text-slate-400">
                      <span>{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {alert.actionLabel && (
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            navigate('/work-time');
                          }}
                          className="font-bold text-blue-400 hover:text-blue-300 flex items-center gap-0.5"
                        >
                          <span>{alert.actionLabel}</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 bg-slate-950 border-t border-slate-800 text-center">
              <Link
                to="/work-time"
                onClick={() => setDropdownOpen(false)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 font-bold rounded-xl text-xs transition-colors border border-blue-500/30"
              >
                <span>Open Work Time & Task Center</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
