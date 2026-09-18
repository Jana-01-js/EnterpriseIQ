import React, { useState } from 'react';
import { useWorkTime } from '../context/WorkTimeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { WorkTask, WorkTaskPriority } from '../types';
import {
  Clock,
  Play,
  Pause,
  Coffee,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Sparkles,
  Volume2,
  VolumeX,
  Calendar,
  Building2,
  FileText,
  Trash2,
  ArrowRight,
  ShieldAlert,
  Info,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { DocumentViewerModal } from '../components/documents/DocumentViewerModal';

export const WorkTimePage: React.FC = () => {
  const { user } = useAuth();
  const {
    tasks,
    loading,
    activeTaskId,
    activeTask,
    timerRunning,
    elapsedSeconds,
    continuousWorkSeconds,
    isTakingBreak,
    breakSecondsRemaining,
    scheduleConfig,
    alerts,
    shiftStats,
    startTaskTimer,
    pauseTaskTimer,
    resumeTaskTimer,
    stopTaskTimer,
    completeTask,
    extendTaskTime,
    takeBreak,
    endBreak,
    createTask,
    deleteTask,
    dismissAlert,
    toggleSoundAlerts,
  } = useWorkTime();

  // Filters & State
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'Pending' | 'In Progress' | 'Completed' | 'Urgent'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingDocId, setViewingDocId] = useState<string | null>(null);

  // Create Task Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDepartmentId, setNewDepartmentId] = useState(user?.departmentId || 'dep-it');
  const [newRelatedDocId, setNewRelatedDocId] = useState('');
  const [newEstimatedMinutes, setNewEstimatedMinutes] = useState(45);
  const [newPriority, setNewPriority] = useState<WorkTaskPriority>('Medium');
  const [newDeadline, setNewDeadline] = useState('');
  const [estimatingAi, setEstimatingAi] = useState(false);
  const [aiBreakdown, setAiBreakdown] = useState<{ reasoning: string; checklistSteps: string[] } | null>(null);
  const [creatingTask, setCreatingTask] = useState(false);

  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAiEstimate = async () => {
    if (!newTitle.trim()) return;
    setEstimatingAi(true);
    setAiBreakdown(null);
    try {
      const result = await api.aiEstimateWorkTime(newTitle, newDescription, newRelatedDocId || undefined);
      setNewEstimatedMinutes(result.estimatedMinutes);
      setAiBreakdown({
        reasoning: result.reasoning,
        checklistSteps: result.checklistSteps || [],
      });
    } catch (err) {
      console.error('AI Work Time Estimation failed:', err);
    } finally {
      setEstimatingAi(false);
    }
  };

  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setCreatingTask(true);
    try {
      await createTask({
        title: newTitle.trim(),
        description: newDescription.trim(),
        departmentId: newDepartmentId,
        relatedDocId: newRelatedDocId || undefined,
        estimatedMinutes: Number(newEstimatedMinutes) || 30,
        priority: newPriority,
        deadline: newDeadline || new Date(Date.now() + 8 * 3600000).toISOString(),
        recommendedBreakMinutes: newEstimatedMinutes >= 60 ? 15 : 10,
      });

      // Reset form
      setNewTitle('');
      setNewDescription('');
      setNewEstimatedMinutes(45);
      setNewPriority('Medium');
      setNewDeadline('');
      setAiBreakdown(null);
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setCreatingTask(false);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.departmentName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'Urgent') return t.priority === 'Urgent';
    return t.status === filterStatus;
  });

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'High':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Medium':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800/80 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-bold border border-blue-400/30 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                Work Time & Alert Engine
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Shift: {scheduleConfig.shiftStart} – {scheduleConfig.shiftEnd} ({scheduleConfig.shiftDurationMinutes / 60}h)
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Work Time & Task Alert System
            </h1>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Real-time work duration monitoring, automated pacing warnings, ergonomic rest alerts, and workload deficit calculations calibrated to your pending work and enterprise policy.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => toggleSoundAlerts()}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                scheduleConfig.soundAlertsEnabled
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {scheduleConfig.soundAlertsEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <span>Chime Alerts On</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-slate-500" />
                  <span>Chime Muted</span>
                </>
              )}
            </button>

            <button
              onClick={() => takeBreak(10)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <Coffee className="w-4 h-4 text-amber-400" />
              <span>Rest Break (10m)</span>
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Work Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards: Shift Health & Workload Analysis */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Shift Progress */}
        <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Shift Availability</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                {Math.floor(shiftStats.remainingShiftMinutes / 60)}h {shiftStats.remainingShiftMinutes % 60}m
              </span>
              <span className="text-xs text-slate-500">Remaining</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(0, ((shiftStats.shiftDurationMinutes - shiftStats.remainingShiftMinutes) / shiftStats.shiftDurationMinutes) * 100))}%`
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Card 2: Work Logged Today */}
        <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Logged Work Time</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                {Math.floor(shiftStats.totalLoggedMinutesToday / 60)}h {shiftStats.totalLoggedMinutesToday % 60}m
              </span>
              <span className="text-xs text-emerald-600 font-semibold">
                {shiftStats.completedTasksCount} Done
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              Continuous focus: {Math.floor(continuousWorkSeconds / 60)}m without break
            </p>
          </div>
        </div>

        {/* Card 3: Pending Work Required */}
        <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Work Required</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                {Math.floor(shiftStats.pendingTasksRequiredMinutes / 60)}h {shiftStats.pendingTasksRequiredMinutes % 60}m
              </span>
              <span className="text-xs text-indigo-600 font-semibold">
                {shiftStats.pendingTasksCount} Pending
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              Sum of estimated durations for tasks to be done
            </p>
          </div>
        </div>

        {/* Card 4: Workload Balance & Deficit Alert */}
        <div className={`p-5 rounded-2xl border shadow-xs flex flex-col justify-between transition-all ${
          shiftStats.workloadBalance === 'Overload Deficit'
            ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-100'
            : shiftStats.workloadBalance === 'Caution'
            ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-100'
            : 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-100'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">Workload Balance Status</span>
            {shiftStats.workloadBalance === 'Overload Deficit' ? (
              <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
            ) : shiftStats.workloadBalance === 'Caution' ? (
              <Clock className="w-4 h-4 text-amber-500" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            )}
          </div>
          <div className="mt-3">
            <span className="text-xl font-extrabold tracking-tight">
              {shiftStats.workloadBalance}
            </span>
            <p className="text-xs mt-1 leading-snug opacity-90">
              {shiftStats.workloadBalance === 'Overload Deficit'
                ? `Workload Alert: ${shiftStats.deficitMinutes}m deficit compared to shift end.`
                : shiftStats.workloadBalance === 'Caution'
                ? 'Tight workload: Pending work fills over 80% of remaining shift.'
                : 'Pacing optimal: Ample time to complete all scheduled items.'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Timer & Alerts on Left, Tasks to be Done on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (Timer & Live Alerts): 4 cols */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Active Work Timer Card */}
          <div className="p-6 rounded-3xl bg-slate-950 text-white border border-slate-800/90 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${timerRunning ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {isTakingBreak ? 'Rest Break in Progress' : 'Active Work Timer'}
                </h3>
              </div>
              {activeTask && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityBadgeClass(activeTask.priority)}`}>
                  {activeTask.priority}
                </span>
              )}
            </div>

            {isTakingBreak ? (
              <div className="text-center py-6 space-y-3">
                <Coffee className="w-12 h-12 text-amber-400 mx-auto animate-bounce" />
                <div>
                  <span className="text-4xl font-extrabold font-mono text-amber-300">
                    {formatTimer(breakSecondsRemaining)}
                  </span>
                  <p className="text-xs text-slate-400 mt-2">
                    Ergonomic rest break recommended per enterprise health guidelines.
                  </p>
                </div>
                <button
                  onClick={endBreak}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all mt-2"
                >
                  Resume Active Work
                </button>
              </div>
            ) : activeTask ? (
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-extrabold text-white tracking-tight leading-snug">
                    {activeTask.title}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-blue-400" />
                      {activeTask.departmentName}
                    </span>
                    {activeTask.relatedDocTitle && (
                      <>
                        <span>•</span>
                        <button
                          onClick={() => activeTask.relatedDocId && setViewingDocId(activeTask.relatedDocId)}
                          className="flex items-center gap-1 text-blue-400 hover:text-blue-300 underline underline-offset-2"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          View Document
                        </button>
                      </>
                    )}
                  </p>
                </div>

                {/* Big Stopwatch Display */}
                <div className="py-4 px-5 bg-slate-900/90 rounded-2xl border border-slate-800/80 text-center shadow-inner">
                  <div className="text-4xl sm:text-5xl font-extrabold font-mono text-white tracking-wider">
                    {formatTimer(elapsedSeconds)}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mt-2 px-2">
                    <span>Logged: {activeTask.loggedMinutes + Math.floor(elapsedSeconds / 60)}m</span>
                    <span>Target: {activeTask.estimatedMinutes}m</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        (activeTask.loggedMinutes + Math.floor(elapsedSeconds / 60)) >= activeTask.estimatedMinutes
                          ? 'bg-rose-500'
                          : (activeTask.loggedMinutes + Math.floor(elapsedSeconds / 60)) >= activeTask.estimatedMinutes * 0.8
                          ? 'bg-amber-500'
                          : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                      }`}
                      style={{
                        width: `${Math.min(100, Math.round(((activeTask.loggedMinutes + Math.floor(elapsedSeconds / 60)) / activeTask.estimatedMinutes) * 100))}%`
                      }}
                    ></div>
                  </div>
                </div>

                {/* Timer Controls */}
                <div className="grid grid-cols-3 gap-2">
                  {timerRunning ? (
                    <button
                      onClick={pauseTaskTimer}
                      className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-colors"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause</span>
                    </button>
                  ) : (
                    <button
                      onClick={resumeTaskTimer}
                      className="flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md shadow-emerald-600/20"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Resume</span>
                    </button>
                  )}

                  <button
                    onClick={() => extendTaskTime(activeTask.id, 15)}
                    className="flex items-center justify-center gap-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-colors"
                    title="Add 15 minutes to planned duration"
                  >
                    <span>+15m Time</span>
                  </button>

                  <button
                    onClick={() => completeTask(activeTask.id)}
                    className="flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-md"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Done</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 space-y-3">
                <Clock className="w-10 h-10 mx-auto text-slate-600" />
                <p className="text-xs font-medium text-slate-300">No active work timer running</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Select any task from the work list on the right to start tracking time and receive calibrated alerts.
                </p>
              </div>
            )}
          </div>

          {/* Contextual Work Time Alerts Panel */}
          <div className="p-5 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Active Work Time Alerts
                </h3>
              </div>
              <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-400 font-bold">
                {alerts.length}
              </span>
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {alerts.length === 0 ? (
                <div className="py-6 text-center text-slate-400">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">All Work Time On Track</p>
                  <p className="text-[11px] text-slate-500">Alerts will trigger automatically as tasks approach limits or require rest.</p>
                </div>
              ) : (
                alerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      alert.severity === 'critical'
                        ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60'
                        : alert.severity === 'warning'
                        ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60'
                        : 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {alert.type === 'CONTINUOUS_WORK_BREAK' ? (
                          <Coffee className="w-4 h-4 text-amber-500 shrink-0" />
                        ) : alert.severity === 'critical' ? (
                          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                          {alert.title}
                        </h4>
                      </div>
                      <button
                        onClick={() => dismissAlert(alert.id)}
                        className="text-slate-400 hover:text-slate-600 text-xs"
                      >
                        ✕
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 pl-6 leading-relaxed">
                      {alert.message}
                    </p>

                    <div className="flex items-center justify-between pl-6 mt-2 pt-1 border-t border-black/5 dark:border-white/5">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {alert.actionLabel && (
                        <button
                          onClick={() => {
                            if (alert.actionType === 'TAKE_BREAK') takeBreak(10);
                            else if (alert.actionType === 'EXTEND_TIME' && alert.taskId) extendTaskTime(alert.taskId, 15);
                            else if (alert.actionType === 'START_TASK' && alert.taskId) startTaskTimer(alert.taskId);
                            dismissAlert(alert.id);
                          }}
                          className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {alert.actionLabel} →
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Work Items / Tasks to be Done (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Filter Bar & Search */}
          <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search work tasks..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {(['ALL', 'Pending', 'In Progress', 'Completed', 'Urgent'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    filterStatus === status
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {status === 'ALL' ? 'All Work' : status}
                </button>
              ))}
            </div>
          </div>

          {/* Tasks List */}
          <div className="space-y-3">
            {loading ? (
              <div className="py-16 text-center text-slate-400">
                <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-xs">Loading enterprise work schedule...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="p-8 text-center bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400">
                <Clock className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                <p className="font-bold text-sm text-slate-700 dark:text-slate-300">No tasks found</p>
                <p className="text-xs text-slate-500 mt-1">Try changing your filters or add a new work task.</p>
              </div>
            ) : (
              filteredTasks.map(task => {
                const isCurrentActive = activeTaskId === task.id;
                const currentLogged = task.loggedMinutes + (isCurrentActive ? Math.floor(elapsedSeconds / 60) : 0);
                const percent = Math.min(150, Math.round((currentLogged / task.estimatedMinutes) * 100));

                return (
                  <div
                    key={task.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isCurrentActive
                        ? 'bg-blue-50/70 dark:bg-blue-950/20 border-blue-500/80 shadow-md ring-1 ring-blue-500/50'
                        : task.status === 'Completed'
                        ? 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-75'
                        : 'bg-white/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityBadgeClass(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-blue-500" />
                            {task.departmentName}
                          </span>
                          {task.relatedDocTitle && (
                            <button
                              onClick={() => task.relatedDocId && setViewingDocId(task.relatedDocId)}
                              className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                              title="Inspect linked policy"
                            >
                              <FileText className="w-3 h-3" />
                              <span className="max-w-[180px] truncate">{task.relatedDocTitle}</span>
                            </button>
                          )}
                        </div>

                        <h3 className={`text-sm font-extrabold tracking-tight ${task.status === 'Completed' ? 'line-through text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                          {task.title}
                        </h3>

                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                          {task.description}
                        </p>
                      </div>

                      {/* Right Action / Timer Controls */}
                      <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 shrink-0">
                        {task.status === 'Completed' ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Completed
                          </span>
                        ) : isCurrentActive ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={timerRunning ? pauseTaskTimer : resumeTaskTimer}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-1.5 ${
                                timerRunning ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'
                              }`}
                            >
                              {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                              <span>{timerRunning ? 'Tracking' : 'Paused'}</span>
                            </button>
                            <button
                              onClick={() => completeTask(task.id)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg"
                              title="Mark as completed"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => startTaskTimer(task.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold border border-blue-200 dark:border-blue-800 transition-colors shadow-2xs"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Start Timer</span>
                            </button>
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Delete task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar & Work Time Details */}
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                          {currentLogged}m / {task.estimatedMinutes}m ({percent}%)
                        </span>
                        {percent >= 100 && (
                          <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Time Limit Reached
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span>Due: {new Date(task.deadline).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        <span>Break interval: {task.recommendedBreakMinutes}m</span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                      <div
                        className={`h-full rounded-full transition-all ${
                          percent >= 100
                            ? 'bg-rose-500'
                            : percent >= 80
                            ? 'bg-amber-500'
                            : 'bg-blue-600'
                        }`}
                        style={{ width: `${Math.min(100, percent)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* New Task Creation Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95">
            
            <div className="p-6 bg-slate-950 text-white border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600/30 border border-blue-500/40 rounded-xl text-blue-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Create Work Item to be Done</h3>
                  <p className="text-xs text-slate-400">Configure task duration and AI calibrated alerts</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTaskSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Annual Information Security & 2FA Audit"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description & Procedural Scope
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Details on what must be verified, signed, or executed..."
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={newDepartmentId}
                    onChange={(e) => setNewDepartmentId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="dep-it">Information Technology</option>
                    <option value="dep-eng">Engineering</option>
                    <option value="dep-hr">Human Resources</option>
                    <option value="dep-fin">Finance</option>
                    <option value="dep-leg">Legal</option>
                    <option value="dep-ops">Operations</option>
                    <option value="dep-mkt">Marketing</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as WorkTaskPriority)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Urgent">Urgent (Immediate)</option>
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>
              </div>

              {/* AI Work Time Estimation Trigger */}
              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold">
                    <Sparkles className="w-4 h-4" />
                    <span>Gemini AI Work Time Estimator</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAiEstimate}
                    disabled={estimatingAi || !newTitle.trim()}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-[11px] rounded-lg shadow-xs transition-all flex items-center gap-1"
                  >
                    {estimatingAi ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Calculating...</span>
                      </>
                    ) : (
                      <>
                        <span>Estimate Duration</span>
                        <ArrowRight className="w-3 h-3" />
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Inspects document reading complexity, comprehension load, and verification steps to recommend the exact work duration and break intervals.
                </p>

                {aiBreakdown && (
                  <div className="mt-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-blue-200 dark:border-blue-800 text-[11px] space-y-1.5 animate-in fade-in">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      💡 {aiBreakdown.reasoning}
                    </p>
                    {aiBreakdown.checklistSteps.length > 0 && (
                      <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-400 pl-1">
                        {aiBreakdown.checklistSteps.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Estimated Work Time (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="480"
                    value={newEstimatedMinutes}
                    onChange={(e) => setNewEstimatedMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Target Completion Deadline
                  </label>
                  <input
                    type="datetime-local"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-700 font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTask || !newTitle.trim()}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {creatingTask ? 'Saving Task...' : 'Schedule Work Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Viewer Modal if clicked */}
      {viewingDocId && (
        <DocumentViewerModal
          documentId={viewingDocId}
          onClose={() => setViewingDocId(null)}
        />
      )}
    </div>
  );
};
