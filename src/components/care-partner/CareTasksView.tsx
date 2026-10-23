'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ClipboardCheck,
  Pill,
  Activity,
  Utensils,
  Dumbbell,
  Bath,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Bell,
  FileText,
  GraduationCap,
  Baby,
  ShieldCheck,
  Puzzle,
  Milk,
  Moon,
  Bike,
  BookOpen,
  Sparkles,
} from 'lucide-react';
const mockCareTasks: any[] = [];
const mockMedications: any[] = [];
import type { TaskItem, MedicationLog } from '@/lib/care-partner-data';

const categoryIconMap: Record<
  TaskItem['category'],
  { icon: React.ElementType; color: string; bg: string }
> = {
  medication: { icon: Pill, color: 'text-pink-600', bg: 'bg-pink-50' },
  hygiene: { icon: Bath, color: 'text-blue-600', bg: 'bg-blue-50' },
  nutrition: { icon: Utensils, color: 'text-orange-600', bg: 'bg-orange-50' },
  exercise: { icon: Dumbbell, color: 'text-violet-600', bg: 'bg-violet-50' },
  vitals: { icon: Activity, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  school: { icon: GraduationCap, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  milestone: { icon: Baby, color: 'text-pink-600', bg: 'bg-pink-50' },
  safety: { icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  engagement: { icon: Puzzle, color: 'text-purple-600', bg: 'bg-purple-50' },
  feeding: { icon: Milk, color: 'text-orange-600', bg: 'bg-orange-50' },
  sleep: { icon: Moon, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  physical_activity: { icon: Bike, color: 'text-green-600', bg: 'bg-green-50' },
  learning: { icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
  child_housekeeping: { icon: Sparkles, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  other: { icon: FileText, color: 'text-gray-600', bg: 'bg-gray-50' },
};

const medStatusConfig: Record<
  MedicationLog['status'],
  { border: string; badgeBg: string; badgeText: string; label: string; iconColor: string }
> = {
  taken: {
    border: 'border-l-emerald-500',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    label: 'Taken',
    iconColor: 'text-emerald-600',
  },
  missed: {
    border: 'border-l-red-500',
    badgeBg: 'bg-red-50',
    badgeText: 'text-red-700',
    label: 'Missed',
    iconColor: 'text-red-600',
  },
  upcoming: {
    border: 'border-l-amber-500',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    label: 'Upcoming',
    iconColor: 'text-amber-600',
  },
  skipped: {
    border: 'border-l-gray-400',
    badgeBg: 'bg-gray-100',
    badgeText: 'text-gray-600',
    label: 'Skipped',
    iconColor: 'text-gray-500',
  },
};

export default function CareTasksView() {
  const [careTasks, setCareTasks] = useState(mockCareTasks);
  const [medications, setMedications] = useState(mockMedications);
  const [statsFilter, setStatsFilter] = useState<'all' | 'completed' | 'pending' | 'missed'>('all');
  const [activeTab, setActiveTab] = useState('care-tasks');

  const handleStatsClick = (filter: 'all' | 'completed' | 'pending' | 'missed') => {
    setStatsFilter(filter);
    // Auto-switch tab: missed filter → medication tab, others → care-tasks tab
    if (filter === 'missed') {
      setActiveTab('medication-schedule');
    } else {
      setActiveTab('care-tasks');
    }
  };

  const allTasks = useMemo(
    () => careTasks.flatMap((ct) => ct.tasks),
    [careTasks]
  );
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.isCompleted).length;
  const pendingTasks = allTasks.filter((t) => !t.isCompleted).length;
  const missedMeds = medications.filter((m) => m.status === 'missed').length;

  const toggleTask = (careTaskId: string, taskId: string) => {
    setCareTasks((prev) =>
      prev.map((ct) => {
        if (ct.id !== careTaskId) return ct;
        return {
          ...ct,
          tasks: ct.tasks.map((t) => {
            if (t.id !== taskId) return t;
            const nowCompleted = !t.isCompleted;
            return {
              ...t,
              isCompleted: nowCompleted,
              completedAt: nowCompleted
                ? new Date().toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })
                : undefined,
            };
          }),
        };
      })
    );
  };

  const completeAllTasks = (careTaskId: string) => {
    setCareTasks((prev) =>
      prev.map((ct) => {
        if (ct.id !== careTaskId) return ct;
        const now = new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        return {
          ...ct,
          tasks: ct.tasks.map((t) => ({
            ...t,
            isCompleted: true,
            completedAt: t.completedAt || now,
          })),
        };
      })
    );
  };

  const updateMedStatus = (
    medId: string,
    newStatus: MedicationLog['status']
  ) => {
    setMedications((prev) =>
      prev.map((m) => (m.id === medId ? { ...m, status: newStatus } : m))
    );
  };

  const totalMeds = medications.length;
  const takenMeds = medications.filter((m) => m.status === 'taken').length;
  const missedMedsCount = medications.filter(
    (m) => m.status === 'missed'
  ).length;

  const tasksByPatient = useMemo(() => {
    const map = new Map<string, (typeof careTasks)[number]>();
    careTasks.forEach((ct) => {
      const filteredTasks =
        statsFilter === 'all'
          ? ct.tasks
          : statsFilter === 'completed'
            ? ct.tasks.filter((t) => t.isCompleted)
            : statsFilter === 'pending'
              ? ct.tasks.filter((t) => !t.isCompleted)
              : ct.tasks; // 'missed' doesn't apply to tasks, show all
      if (filteredTasks.length > 0) {
        map.set(ct.id, { ...ct, tasks: filteredTasks });
      }
    });
    return Array.from(map.values());
  }, [careTasks, statsFilter]);

  const medsByPatient = useMemo(() => {
    const map = new Map<
      string,
      { patientId: string; patientName: string; medications: MedicationLog[] }
    >();
    medications.forEach((m) => {
      if (statsFilter === 'missed' && m.status !== 'missed') return;
      if (statsFilter === 'completed' && m.status !== 'taken') return;
      if (statsFilter === 'pending' && m.status !== 'upcoming') return;
      if (!map.has(m.patientId)) {
        map.set(m.patientId, {
          patientId: m.patientId,
          patientName: m.patientName,
          medications: [],
        });
      }
      map.get(m.patientId)!.medications.push(m);
    });
    return Array.from(map.values());
  }, [medications, statsFilter]);

  return (
    <div className="space-y-6">
      {/* Section 1: Summary Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => handleStatsClick('all')}
          className={`flex items-center gap-2 rounded-lg bg-white border px-4 py-3 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer text-left ${
            statsFilter === 'all' ? 'border-blue-300 ring-1 ring-blue-200' : 'border-gray-100 hover:border-gray-300'
          }`}
        >
          <ClipboardCheck className={`size-5 ${statsFilter === 'all' ? 'text-blue-600' : 'text-gray-500'} transition-colors`} />
          <div>
            <p className="text-lg font-semibold text-gray-900">{totalTasks}</p>
            <p className="text-[11px] text-gray-500">Total Tasks Today</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => handleStatsClick('completed')}
          className={`flex items-center gap-2 rounded-lg bg-white border px-4 py-3 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer text-left ${
            statsFilter === 'completed' ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-gray-100 hover:border-gray-300'
          }`}
        >
          <CheckCircle2 className={`size-5 ${statsFilter === 'completed' ? 'text-emerald-600' : 'text-emerald-500'} transition-colors`} />
          <div>
            <p className="text-lg font-semibold text-emerald-600">{completedTasks}</p>
            <p className="text-[11px] text-gray-500">Completed</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => handleStatsClick('pending')}
          className={`flex items-center gap-2 rounded-lg bg-white border px-4 py-3 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer text-left ${
            statsFilter === 'pending' ? 'border-amber-300 ring-1 ring-amber-200' : 'border-gray-100 hover:border-gray-300'
          }`}
        >
          <Bell className={`size-5 ${statsFilter === 'pending' ? 'text-amber-600' : 'text-amber-500'} transition-colors`} />
          <div>
            <p className="text-lg font-semibold text-amber-600">{pendingTasks}</p>
            <p className="text-[11px] text-gray-500">Pending</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => handleStatsClick('missed')}
          className={`flex items-center gap-2 rounded-lg bg-white border px-4 py-3 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer text-left ${
            statsFilter === 'missed' ? 'border-red-300 ring-1 ring-red-200' : 'border-gray-100 hover:border-gray-300'
          }`}
        >
          <AlertTriangle className={`size-5 ${statsFilter === 'missed' ? 'text-red-600' : 'text-red-500'} transition-colors`} />
          <div>
            <p className="text-lg font-semibold text-red-600">{missedMeds}</p>
            <p className="text-[11px] text-gray-500">Missed Medications</p>
          </div>
        </button>
      </div>

      {/* Section 2: Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setStatsFilter('all'); }}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="care-tasks" className="gap-2">
            <ClipboardCheck className="size-4" />
            Care Tasks
          </TabsTrigger>
          <TabsTrigger value="medication-schedule" className="gap-2">
            <Pill className="size-4" />
            Medication Schedule
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Care Tasks */}
        <TabsContent value="care-tasks" className="mt-4 space-y-4">
          {tasksByPatient.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <ClipboardCheck className="size-12 text-gray-300 mb-4" />
                <p className="text-sm font-medium text-gray-500">
                  No tasks assigned for today
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Enjoy your day off!
                </p>
              </CardContent>
            </Card>
          ) : (
            tasksByPatient.map((patientGroup) => {
              const completed = patientGroup.tasks.filter(
                (t) => t.isCompleted
              ).length;
              const total = patientGroup.tasks.length;
              const pct = total > 0 ? (completed / total) * 100 : 0;
              const allDone = completed === total;

              return (
                <Card key={patientGroup.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base">
                          {patientGroup.patientName}
                        </CardTitle>
                        <p className="text-xs text-gray-500">
                          {completed} of {total} completed
                        </p>
                        <div className="bg-gray-100 rounded-full h-2 w-full max-w-xs">
                          <div
                            className="bg-emerald-500 rounded-full h-2 transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={allDone}
                        onClick={() => completeAllTasks(patientGroup.id)}
                      >
                        <CheckCircle2 className="size-3.5 mr-1" />
                        Complete All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {patientGroup.tasks.map((task) => {
                      const cat = categoryIconMap[task.category];
                      const CatIcon = cat.icon;
                      return (
                        <div
                          key={task.id}
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Checkbox
                            checked={task.isCompleted}
                            onCheckedChange={() =>
                              toggleTask(patientGroup.id, task.id)
                            }
                            className="mt-0.5"
                          />
                          <div
                            className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${cat.bg}`}
                          >
                            <CatIcon className={`size-4 ${cat.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium ${
                                task.isCompleted
                                  ? 'line-through text-gray-400'
                                  : 'text-gray-900'
                              }`}
                            >
                              {task.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {task.description}
                            </p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                                <Clock className="size-3" />
                                {task.scheduledTime}
                              </span>
                              {task.isCompleted && task.completedAt && (
                                <span className="text-[11px] text-emerald-600">
                                  Done at {task.completedAt}
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge
                            variant="secondary"
                            className={`shrink-0 text-[11px] px-2 py-0.5 ${
                              task.isCompleted
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {task.isCompleted ? 'Completed' : 'Upcoming'}
                          </Badge>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* TAB 2: Medication Schedule */}
        <TabsContent value="medication-schedule" className="mt-4 space-y-4">
          {medsByPatient.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Pill className="size-12 text-gray-300 mb-4" />
                <p className="text-sm font-medium text-gray-500">
                  No medications scheduled
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  All clear for now!
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {medsByPatient.map((group) => (
                <Card key={group.patientId}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {group.patientName}
                      </CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {group.medications.length} medication
                        {group.medications.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {group.medications.map((med) => {
                      const cfg = medStatusConfig[med.status];
                      return (
                        <div
                          key={med.id}
                          className={`p-3 rounded-lg border-l-2 ${cfg.border}`}
                        >
                          <div className="flex items-start gap-3">
                            <Pill
                              className={`size-5 mt-0.5 shrink-0 ${cfg.iconColor}`}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-medium text-gray-900">
                                  {med.medicine}
                                </p>
                                <Badge
                                  variant="secondary"
                                  className={`shrink-0 text-[11px] px-2 py-0.5 ${cfg.badgeBg} ${cfg.badgeText}`}
                                >
                                  {cfg.label}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {med.dosage} &middot; {med.frequency}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                Scheduled: {med.scheduledTime}
                              </p>
                              {med.notes && (
                                <div className="bg-gray-50 rounded-lg p-2 text-xs text-gray-600 mt-2">
                                  {med.notes}
                                </div>
                              )}
                              {med.status === 'upcoming' && (
                                <div className="flex items-center gap-2 mt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-9 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                    onClick={() =>
                                      updateMedStatus(med.id, 'taken')
                                    }
                                  >
                                    <CheckCircle2 className="size-3 mr-1" />
                                    Mark as Taken
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-9 text-xs text-red-700 border-red-200 hover:bg-red-50"
                                    onClick={() =>
                                      updateMedStatus(med.id, 'missed')
                                    }
                                  >
                                    <AlertTriangle className="size-3 mr-1" />
                                    Log Missed
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ))}

              {/* Bottom summary */}
              <div className="flex items-center justify-center gap-6 rounded-lg bg-white border border-gray-100 px-4 py-3 shadow-sm">
                <span className="text-sm text-gray-500">
                  Total: <span className="font-semibold text-gray-900">{totalMeds}</span>
                </span>
                <span className="text-sm text-emerald-600">
                  Taken: <span className="font-semibold">{takenMeds}</span>
                </span>
                <span className="text-sm text-red-600">
                  Missed:{' '}
                  <span className="font-semibold">{missedMedsCount}</span>
                </span>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
