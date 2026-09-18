import React from 'react';
import { useWorkTime } from '../../context/WorkTimeContext';
import {
  AlertTriangle,
  Clock,
  Coffee,
  CheckCircle2,
  Bell,
  X,
  Volume2,
  VolumeX,
  Play,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const WorkTimeAlertBanner: React.FC = () => {
  const {
    activeAlertBanner,
    dismissAlert,
    extendTaskTime,
    completeTask,
    takeBreak,
    startTaskTimer,
    scheduleConfig,
    toggleSoundAlerts,
  } = useWorkTime();

  const navigate = useNavigate();

  if (!activeAlertBanner) return null;

  const getAlertStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          border: 'border-rose-500/80',
          bg: 'bg-gradient-to-r from-rose-950/95 via-slate-950/95 to-slate-950/95 text-white shadow-rose-950/50',
          iconBg: 'bg-rose-500/20 text-rose-400 border border-rose-500/40',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        };
      case 'warning':
        return {
          border: 'border-amber-500/80',
          bg: 'bg-gradient-to-r from-amber-950/95 via-slate-950/95 to-slate-950/95 text-white shadow-amber-950/50',
          iconBg: 'bg-amber-500/20 text-amber-400 border border-amber-500/40',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        };
      case 'success':
        return {
          border: 'border-emerald-500/80',
          bg: 'bg-gradient-to-r from-emerald-950/95 via-slate-950/95 to-slate-950/95 text-white shadow-emerald-950/50',
          iconBg: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        };
      default:
        return {
          border: 'border-blue-500/80',
          bg: 'bg-gradient-to-r from-blue-950/95 via-slate-950/95 to-slate-950/95 text-white shadow-blue-950/50',
          iconBg: 'bg-blue-500/20 text-blue-400 border border-blue-500/40',
          badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        };
    }
  };

  const styles = getAlertStyles(activeAlertBanner.severity);

  const getAlertIcon = () => {
    switch (activeAlertBanner.type) {
      case 'CONTINUOUS_WORK_BREAK':
        return <Coffee className="w-5 h-5 text-amber-400 animate-bounce" />;
      case 'TASK_OVERTIME':
      case 'WORKLOAD_DEFICIT':
        return <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />;
      case 'TASK_LIMIT_REACHED':
      case 'APPROACHING_TASK_LIMIT':
        return <Clock className="w-5 h-5 text-amber-400" />;
      default:
        return <Bell className="w-5 h-5 text-blue-400" />;
    }
  };

  const handleAction = () => {
    if (activeAlertBanner.actionType === 'EXTEND_TIME' && activeAlertBanner.taskId) {
      extendTaskTime(activeAlertBanner.taskId, 15);
    } else if (activeAlertBanner.actionType === 'COMPLETE_TASK' && activeAlertBanner.taskId) {
      completeTask(activeAlertBanner.taskId);
    } else if (activeAlertBanner.actionType === 'TAKE_BREAK') {
      takeBreak(10);
    } else if (activeAlertBanner.actionType === 'START_TASK' && activeAlertBanner.taskId) {
      startTaskTimer(activeAlertBanner.taskId);
      dismissAlert(activeAlertBanner.id);
    } else {
      navigate('/work-time');
      dismissAlert(activeAlertBanner.id);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className={`p-4 rounded-2xl border backdrop-blur-xl shadow-2xl ${styles.border} ${styles.bg} flex flex-col gap-3 relative overflow-hidden`}>
        {/* Ambient Top Glow Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-75"></div>

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${styles.iconBg}`}>
              {getAlertIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${styles.badge}`}>
                  Work Time Alert
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(activeAlertBanner.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white tracking-tight leading-snug">
                {activeAlertBanner.title}
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {activeAlertBanner.message}
              </p>
            </div>
          </div>

          <button
            onClick={() => dismissAlert(activeAlertBanner.id)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
            title="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10 mt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleSoundAlerts()}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors text-xs flex items-center gap-1"
              title={scheduleConfig.soundAlertsEnabled ? 'Mute alert sounds' : 'Enable alert sounds'}
            >
              {scheduleConfig.soundAlertsEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>
            <button
              onClick={() => {
                navigate('/work-time');
                dismissAlert(activeAlertBanner.id);
              }}
              className="text-[11px] text-slate-300 hover:text-white font-medium underline-offset-2 hover:underline"
            >
              View Work Schedule
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => dismissAlert(activeAlertBanner.id)}
              className="px-2.5 py-1 text-xs text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors font-medium"
            >
              Dismiss
            </button>

            {activeAlertBanner.actionLabel && (
              <button
                onClick={handleAction}
                className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
              >
                <span>{activeAlertBanner.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
