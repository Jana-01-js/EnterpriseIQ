import React, { createContext, useContext, useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { WorkTask, WorkTimeAlert, WorkScheduleConfig } from '../types';
import { api } from '../services/api';
import { playWorkTimeAlertSound } from '../utils/workAlertSound';

interface ShiftStats {
  shiftDurationMinutes: number;
  totalLoggedMinutesToday: number;
  pendingTasksRequiredMinutes: number;
  remainingShiftMinutes: number;
  workloadBalance: 'Optimal' | 'Caution' | 'Overload Deficit';
  deficitMinutes: number;
  completedTasksCount: number;
  pendingTasksCount: number;
}

interface WorkTimeContextType {
  tasks: WorkTask[];
  loading: boolean;
  activeTaskId: string | null;
  activeTask: WorkTask | null;
  timerRunning: boolean;
  elapsedSeconds: number;
  continuousWorkSeconds: number;
  isTakingBreak: boolean;
  breakSecondsRemaining: number;
  scheduleConfig: WorkScheduleConfig;
  alerts: WorkTimeAlert[];
  unreadAlertsCount: number;
  activeAlertBanner: WorkTimeAlert | null;
  shiftStats: ShiftStats;
  startTaskTimer: (taskId: string) => void;
  pauseTaskTimer: () => void;
  resumeTaskTimer: () => void;
  stopTaskTimer: () => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  extendTaskTime: (taskId: string, extraMinutes: number) => Promise<void>;
  takeBreak: (minutes?: number) => void;
  endBreak: () => void;
  createTask: (task: Partial<WorkTask>) => Promise<WorkTask>;
  updateTask: (taskId: string, updates: Partial<WorkTask>) => Promise<WorkTask>;
  deleteTask: (taskId: string) => Promise<void>;
  dismissAlert: (alertId: string) => void;
  clearAllAlerts: () => void;
  toggleSoundAlerts: (enabled?: boolean) => void;
  updateScheduleConfig: (updates: Partial<WorkScheduleConfig>) => void;
  refreshTasks: () => Promise<void>;
}

const DEFAULT_SCHEDULE: WorkScheduleConfig = {
  shiftStart: '09:00',
  shiftEnd: '17:00',
  shiftDurationMinutes: 480, // 8 hours
  breakIntervalMinutes: 50,  // Rest recommended every 50 minutes of continuous screen work
  breakDurationMinutes: 10,  // 10-minute rest
  soundAlertsEnabled: true,
};

const WorkTimeContext = createContext<WorkTimeContextType | null>(null);

export const WorkTimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(() => localStorage.getItem('eiq_active_task_id') || null);
  const [timerRunning, setTimerRunning] = useState<boolean>(() => localStorage.getItem('eiq_timer_running') === 'true');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => Number(localStorage.getItem('eiq_elapsed_seconds')) || 0);
  const [continuousWorkSeconds, setContinuousWorkSeconds] = useState<number>(() => Number(localStorage.getItem('eiq_cont_work_seconds')) || 0);
  
  const [isTakingBreak, setIsTakingBreak] = useState(false);
  const [breakSecondsRemaining, setBreakSecondsRemaining] = useState(0);

  const [scheduleConfig, setScheduleConfig] = useState<WorkScheduleConfig>(() => {
    const saved = localStorage.getItem('eiq_work_schedule_config');
    return saved ? { ...DEFAULT_SCHEDULE, ...JSON.parse(saved) } : DEFAULT_SCHEDULE;
  });

  const [alerts, setAlerts] = useState<WorkTimeAlert[]>(() => {
    const saved = localStorage.getItem('eiq_work_alerts');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeAlertBanner, setActiveAlertBanner] = useState<WorkTimeAlert | null>(null);
  const sentAlertKeysRef = useRef<Set<string>>(new Set());

  // Save state
  useEffect(() => {
    if (activeTaskId) localStorage.setItem('eiq_active_task_id', activeTaskId);
    else localStorage.removeItem('eiq_active_task_id');
    localStorage.setItem('eiq_timer_running', String(timerRunning));
    localStorage.setItem('eiq_elapsed_seconds', String(elapsedSeconds));
    localStorage.setItem('eiq_cont_work_seconds', String(continuousWorkSeconds));
  }, [activeTaskId, timerRunning, elapsedSeconds, continuousWorkSeconds]);

  useEffect(() => {
    localStorage.setItem('eiq_work_schedule_config', JSON.stringify(scheduleConfig));
  }, [scheduleConfig]);

  useEffect(() => {
    localStorage.setItem('eiq_work_alerts', JSON.stringify(alerts.slice(0, 30)));
  }, [alerts]);

  // Load tasks from API
  const refreshTasks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getWorkTasks();
      setTasks(data);
    } catch (err) {
      console.error('Failed to load work tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshTasks();
  }, [refreshTasks]);

  const activeTask = useMemo(() => {
    return tasks.find(t => t.id === activeTaskId) || null;
  }, [tasks, activeTaskId]);

  // Alert Dispatcher Helper
  const triggerAlert = useCallback((alertData: Omit<WorkTimeAlert, 'id' | 'timestamp'>) => {
    const dedupeKey = `${alertData.type}_${alertData.taskId || 'global'}`;
    if (sentAlertKeysRef.current.has(dedupeKey)) return;

    sentAlertKeysRef.current.add(dedupeKey);

    const newAlert: WorkTimeAlert = {
      ...alertData,
      id: 'alert-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toISOString(),
      dismissed: false,
    };

    setAlerts(prev => [newAlert, ...prev.filter(a => a.id !== newAlert.id)].slice(0, 30));
    setActiveAlertBanner(newAlert);

    // Audio chime
    if (scheduleConfig.soundAlertsEnabled) {
      const soundType = alertData.type === 'CONTINUOUS_WORK_BREAK' ? 'break' : alertData.severity === 'critical' ? 'critical' : 'warning';
      playWorkTimeAlertSound(soundType);
    }
  }, [scheduleConfig.soundAlertsEnabled]);

  // Timer Tick Engine
  useEffect(() => {
    if (!timerRunning || !activeTaskId) return;

    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
      setContinuousWorkSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning, activeTaskId]);

  // Break Countdown Engine
  useEffect(() => {
    if (!isTakingBreak || breakSecondsRemaining <= 0) return;

    const interval = setInterval(() => {
      setBreakSecondsRemaining(prev => {
        if (prev <= 1) {
          setIsTakingBreak(false);
          triggerAlert({
            type: 'CONTINUOUS_WORK_BREAK',
            severity: 'info',
            title: 'Break Concluded',
            message: 'Your scheduled rest break has ended. Ready to resume productive work?',
            actionLabel: 'Resume Work',
            actionType: 'START_TASK',
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTakingBreak, breakSecondsRemaining, triggerAlert]);

  // Contextual Work Time Alert Evaluator
  useEffect(() => {
    if (!activeTask || !timerRunning) return;

    const currentTotalMinutes = activeTask.loggedMinutes + (elapsedSeconds / 60);
    const estimatedMinutes = activeTask.estimatedMinutes;
    const progressPercent = Math.round((currentTotalMinutes / estimatedMinutes) * 100);

    // 1. Pacing Alert (80% of allocated work time reached)
    if (progressPercent >= 80 && progressPercent < 100) {
      triggerAlert({
        type: 'APPROACHING_TASK_LIMIT',
        severity: 'warning',
        title: `80% Work Time Reached: ${activeTask.title}`,
        message: `You have utilized ${Math.round(currentTotalMinutes)}m of the planned ${estimatedMinutes}m (${progressPercent}%). Wrap up and document review steps.`,
        taskId: activeTask.id,
        taskTitle: activeTask.title,
        actionLabel: 'Extend 15m',
        actionType: 'EXTEND_TIME',
      });
    }

    // 2. Task Allocation Limit Reached (100% time reached)
    if (progressPercent >= 100 && progressPercent < 125) {
      triggerAlert({
        type: 'TASK_LIMIT_REACHED',
        severity: 'warning',
        title: `Work Time Limit Reached: ${activeTask.title}`,
        message: `The allocated ${estimatedMinutes}m duration for this work item has been reached. Complete the task or adjust planned work allocation.`,
        taskId: activeTask.id,
        taskTitle: activeTask.title,
        actionLabel: 'Complete Task',
        actionType: 'COMPLETE_TASK',
      });
    }

    // 3. Overtime Alert (> 125% of allocated time or > 15m overrun)
    if (currentTotalMinutes >= estimatedMinutes + 15) {
      triggerAlert({
        type: 'TASK_OVERTIME',
        severity: 'critical',
        title: `Task Overtime Alert: ${activeTask.title}`,
        message: `Work time is currently ${Math.round(currentTotalMinutes - estimatedMinutes)}m over the scheduled estimate. Review policy complexity or log extra time.`,
        taskId: activeTask.id,
        taskTitle: activeTask.title,
        actionLabel: 'Mark Complete',
        actionType: 'COMPLETE_TASK',
      });
    }

    // 4. Continuous Screen Work / Ergonomic Break Alert
    const continuousMinutes = Math.floor(continuousWorkSeconds / 60);
    if (continuousMinutes >= scheduleConfig.breakIntervalMinutes) {
      triggerAlert({
        type: 'CONTINUOUS_WORK_BREAK',
        severity: 'info',
        title: `Ergonomic Health Break Recommended`,
        message: `You have worked continuously for ${continuousMinutes}m on "${activeTask.title}". Enterprise Health Policy recommends a 5-10 min rest to prevent fatigue.`,
        taskId: activeTask.id,
        taskTitle: activeTask.title,
        actionLabel: 'Take 10m Break',
        actionType: 'TAKE_BREAK',
      });
    }
  }, [activeTask, timerRunning, elapsedSeconds, continuousWorkSeconds, scheduleConfig, triggerAlert]);

  // Urgent Task Deadline Checks
  useEffect(() => {
    if (tasks.length === 0) return;

    const urgentPending = tasks.filter(t => t.status !== 'Completed' && (t.priority === 'Urgent' || t.status === 'Overdue'));
    urgentPending.forEach(t => {
      triggerAlert({
        type: 'URGENT_DEADLINE',
        severity: 'critical',
        title: `Urgent Work To Be Done: ${t.title}`,
        message: `High priority task in ${t.departmentName}. Estimated work time: ${t.estimatedMinutes}m. Start work timer to maintain enterprise compliance SLAs.`,
        taskId: t.id,
        taskTitle: t.title,
        actionLabel: 'Start Work Now',
        actionType: 'START_TASK',
      });
    });
  }, [tasks, triggerAlert]);

  // Compute Shift & Workload Statistics
  const shiftStats: ShiftStats = useMemo(() => {
    const totalShiftMinutes = scheduleConfig.shiftDurationMinutes;
    const now = new Date();
    
    // Parse shift end e.g. "17:00"
    const [endH, endM] = scheduleConfig.shiftEnd.split(':').map(Number);
    const shiftEndDate = new Date();
    shiftEndDate.setHours(endH, endM, 0, 0);

    const remainingMillis = Math.max(0, shiftEndDate.getTime() - now.getTime());
    const remainingShiftMinutes = Math.round(remainingMillis / 60000);

    const completedTasks = tasks.filter(t => t.status === 'Completed');
    const pendingTasks = tasks.filter(t => t.status !== 'Completed');

    const totalLoggedMinutesToday = tasks.reduce((acc, t) => acc + t.loggedMinutes, 0) + Math.round(elapsedSeconds / 60);
    const pendingTasksRequiredMinutes = pendingTasks.reduce((acc, t) => {
      const remainingForTask = Math.max(0, t.estimatedMinutes - t.loggedMinutes);
      return acc + remainingForTask;
    }, 0);

    const deficitMinutes = Math.max(0, pendingTasksRequiredMinutes - remainingShiftMinutes);
    let workloadBalance: 'Optimal' | 'Caution' | 'Overload Deficit' = 'Optimal';

    if (deficitMinutes > 0 && remainingShiftMinutes > 0) {
      workloadBalance = 'Overload Deficit';
    } else if (pendingTasksRequiredMinutes > remainingShiftMinutes * 0.8) {
      workloadBalance = 'Caution';
    }

    return {
      shiftDurationMinutes: totalShiftMinutes,
      totalLoggedMinutesToday,
      pendingTasksRequiredMinutes,
      remainingShiftMinutes,
      workloadBalance,
      deficitMinutes,
      completedTasksCount: completedTasks.length,
      pendingTasksCount: pendingTasks.length,
    };
  }, [tasks, elapsedSeconds, scheduleConfig]);

  // Shift Workload Deficit Alert
  useEffect(() => {
    if (shiftStats.workloadBalance === 'Overload Deficit' && shiftStats.deficitMinutes > 15) {
      triggerAlert({
        type: 'WORKLOAD_DEFICIT',
        severity: 'critical',
        title: `Workload Deficit Alert: ${shiftStats.deficitMinutes}m Over Schedule`,
        message: `Tasks to be done today require ${shiftStats.pendingTasksRequiredMinutes}m, but only ${shiftStats.remainingShiftMinutes}m remain in your scheduled shift. Reschedule lower priority items.`,
        actionLabel: 'Review Workload',
        actionType: 'VIEW_TASK',
      });
    }
  }, [shiftStats, triggerAlert]);

  // Timer Actions
  const startTaskTimer = useCallback((taskId: string) => {
    // If switching tasks, persist elapsed of previous task first
    if (activeTaskId && activeTaskId !== taskId && elapsedSeconds > 30) {
      const mins = Math.round(elapsedSeconds / 60);
      if (mins > 0) {
        api.logWorkTaskTime(activeTaskId, mins).catch(console.error);
      }
    }

    setActiveTaskId(taskId);
    setTimerRunning(true);
    setElapsedSeconds(0);
    setIsTakingBreak(false);

    // Update status to In Progress
    api.updateWorkTask(taskId, { status: 'In Progress' }).then(updated => {
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    }).catch(console.error);

    // Reset alert deduplication for this task
    sentAlertKeysRef.current.delete(`APPROACHING_TASK_LIMIT_${taskId}`);
    sentAlertKeysRef.current.delete(`TASK_LIMIT_REACHED_${taskId}`);
    sentAlertKeysRef.current.delete(`TASK_OVERTIME_${taskId}`);

    if (scheduleConfig.soundAlertsEnabled) {
      playWorkTimeAlertSound('info');
    }
  }, [activeTaskId, elapsedSeconds, scheduleConfig.soundAlertsEnabled]);

  const pauseTaskTimer = useCallback(() => {
    setTimerRunning(false);
  }, []);

  const resumeTaskTimer = useCallback(() => {
    if (activeTaskId) {
      setTimerRunning(true);
      setIsTakingBreak(false);
    }
  }, [activeTaskId]);

  const stopTaskTimer = useCallback(async () => {
    if (!activeTaskId) return;

    setTimerRunning(false);
    const minutesToLog = Math.round(elapsedSeconds / 60);

    if (minutesToLog > 0) {
      try {
        const updated = await api.logWorkTaskTime(activeTaskId, minutesToLog);
        setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
      } catch (err) {
        console.error('Failed to log time:', err);
      }
    }

    setElapsedSeconds(0);
  }, [activeTaskId, elapsedSeconds]);

  const completeTask = useCallback(async (taskId: string) => {
    try {
      // If completed active task, also log elapsed time
      if (activeTaskId === taskId) {
        setTimerRunning(false);
        const minutesToLog = Math.round(elapsedSeconds / 60);
        if (minutesToLog > 0) {
          await api.logWorkTaskTime(taskId, minutesToLog);
        }
        setActiveTaskId(null);
        setElapsedSeconds(0);
      }

      const updated = await api.updateWorkTask(taskId, { status: 'Completed' });
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));

      if (scheduleConfig.soundAlertsEnabled) {
        playWorkTimeAlertSound('complete');
      }

      // Trigger completion confirmation
      triggerAlert({
        type: 'TASK_LIMIT_REACHED',
        severity: 'success',
        title: `Task Completed: ${updated.title}`,
        message: `Work successfully finished and logged. Remaining tasks today: ${tasks.filter(t => t.id !== taskId && t.status !== 'Completed').length}.`,
        taskId: updated.id,
        taskTitle: updated.title,
      });
    } catch (err) {
      console.error('Failed to complete task:', err);
    }
  }, [activeTaskId, elapsedSeconds, scheduleConfig.soundAlertsEnabled, tasks, triggerAlert]);

  const extendTaskTime = useCallback(async (taskId: string, extraMinutes: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const newEstimated = task.estimatedMinutes + extraMinutes;
      const updated = await api.updateWorkTask(taskId, { estimatedMinutes: newEstimated });
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));

      // Reset alert keys so they can trigger at the new milestone
      sentAlertKeysRef.current.delete(`APPROACHING_TASK_LIMIT_${taskId}`);
      sentAlertKeysRef.current.delete(`TASK_LIMIT_REACHED_${taskId}`);
      sentAlertKeysRef.current.delete(`TASK_OVERTIME_${taskId}`);

      if (activeAlertBanner?.taskId === taskId) {
        setActiveAlertBanner(null);
      }
    } catch (err) {
      console.error('Failed to extend task time:', err);
    }
  }, [tasks, activeAlertBanner]);

  const takeBreak = useCallback((minutes = 10) => {
    setTimerRunning(false);
    setIsTakingBreak(true);
    setBreakSecondsRemaining(minutes * 60);
    setContinuousWorkSeconds(0); // Reset continuous work tracker
    sentAlertKeysRef.current.delete('CONTINUOUS_WORK_BREAK_global');

    if (scheduleConfig.soundAlertsEnabled) {
      playWorkTimeAlertSound('break');
    }
    setActiveAlertBanner(null);
  }, [scheduleConfig.soundAlertsEnabled]);

  const endBreak = useCallback(() => {
    setIsTakingBreak(false);
    setBreakSecondsRemaining(0);
    if (activeTaskId) {
      setTimerRunning(true);
    }
  }, [activeTaskId]);

  const createTask = useCallback(async (taskData: Partial<WorkTask>): Promise<WorkTask> => {
    const created = await api.createWorkTask(taskData);
    setTasks(prev => [created, ...prev]);
    return created;
  }, []);

  const updateTask = useCallback(async (taskId: string, updates: Partial<WorkTask>): Promise<WorkTask> => {
    const updated = await api.updateWorkTask(taskId, updates);
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    return updated;
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    await api.deleteWorkTask(taskId);
    if (activeTaskId === taskId) {
      setActiveTaskId(null);
      setTimerRunning(false);
      setElapsedSeconds(0);
    }
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }, [activeTaskId]);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, dismissed: true } : a));
    if (activeAlertBanner?.id === alertId) {
      setActiveAlertBanner(null);
    }
  }, [activeAlertBanner]);

  const clearAllAlerts = useCallback(() => {
    setAlerts(prev => prev.map(a => ({ ...a, dismissed: true })));
    setActiveAlertBanner(null);
  }, []);

  const toggleSoundAlerts = useCallback((enabled?: boolean) => {
    setScheduleConfig(prev => ({
      ...prev,
      soundAlertsEnabled: enabled !== undefined ? enabled : !prev.soundAlertsEnabled,
    }));
  }, []);

  const updateScheduleConfig = useCallback((updates: Partial<WorkScheduleConfig>) => {
    setScheduleConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const unreadAlertsCount = useMemo(() => {
    return alerts.filter(a => !a.dismissed).length;
  }, [alerts]);

  return (
    <WorkTimeContext.Provider
      value={{
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
        unreadAlertsCount,
        activeAlertBanner,
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
        updateTask,
        deleteTask,
        dismissAlert,
        clearAllAlerts,
        toggleSoundAlerts,
        updateScheduleConfig,
        refreshTasks,
      }}
    >
      {children}
    </WorkTimeContext.Provider>
  );
};

export const useWorkTime = () => {
  const context = useContext(WorkTimeContext);
  if (!context) {
    throw new Error('useWorkTime must be used within a WorkTimeProvider');
  }
  return context;
};
