'use client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Calendar,
  Wallet,
  Users,
  ClipboardList,
  Clock,
  MapPin,
  ChevronRight,
  Activity,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  XCircle,
  Briefcase,
  CheckCircle2,
  Shield,
  ArrowRight,
  X,
} from 'lucide-react';


import { useState, useMemo, useEffect } from 'react';
import { mockCareTasks } from '@/lib/care-partner-data';
import type { Shift } from '@/lib/care-partner-data';
import ShiftCompleteOTPRaw from './ShiftCompleteOTP';
import ShiftProgressBar from './ShiftProgressBar';
import ReportIssueDialog from './ReportIssueDialog';
import SOSEmergencyDialog from './SOSEmergencyDialog';
import { format, parseISO } from 'date-fns';
import { formatCurrency } from '@/lib/helpers';
const ShiftCompleteOTP = ShiftCompleteOTPRaw as any;

interface DashboardViewProps {
  carePartnerName: string;
  specialty: string;
  onNavigate: (view: string, patientId?: string) => void;
  partnerId?: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function formatDate(): string {
  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'confirmed':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
          <Clock className="size-3" />
          Confirmed
        </span>
      );
    case 'in_progress':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 ring-1 ring-blue-200/50">
          <Activity className="size-3" />
          In Progress
        </span>
      );
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
          <CheckCircle className="size-3" />
          Completed
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
          <XCircle className="size-3" />
          Cancelled
        </span>
      );
    default:
      return null;
  }
}

function getModeBadge(mode: string) {
  if (mode === 'online') {
    return (
      <span className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
        Online
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
      In-Home
    </span>
  );
}

export default function DashboardView({ carePartnerName, specialty, onNavigate, partnerId }: DashboardViewProps) {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [earningsData, setEarningsData] = useState<any>(null)

  useEffect(() => {
    fetch('/api/bookings').then(r => r.json()).then(d => setShifts(d.shifts || [])).catch(() => {})
    fetch('/api/earnings').then(r => r.json()).then(d => setEarningsData(d)).catch(() => {})
  }, [])

  // Map API response to shapes the component expects
  const mockCarePartner = earningsData ? {
    earnings: {
      today: earningsData.summary?.today || 0,
      thisWeek: earningsData.summary?.thisWeek || 0,
      thisMonth: earningsData.summary?.thisMonth || 0,
      lastWeek: 0,
      total: earningsData.summary?.total || 0,
      pending: 0,
      paid: 0,
    }
  } : { earnings: { today: 0, thisWeek: 0, thisMonth: 0, lastWeek: 0, total: 0, pending: 0, paid: 0 } }
  const mockMonthlyEarnings = earningsData?.monthlyBreakdown || []

  const [completeShift, setCompleteShift] = useState<Shift | null>(null);
  const [shiftCompleted, setShiftCompleted] = useState(false);
  const [detailShift, setDetailShift] = useState<Shift | null>(null);
  const [dismissVerificationBanner, setDismissVerificationBanner] = useState(false);
  const [reportIssueOpen, setReportIssueOpen] = useState(false);
  const [sosOpen, setSosOpen] = useState(false);

  // Check optional verification status from live API
  const [optionalPendingCount, setOptionalPendingCount] = useState(3);

  useEffect(() => {
    if (!partnerId) return;
    fetch('/api/verification/status?partnerId=' + encodeURIComponent(partnerId))
      .then(r => r.json())
      .then(data => {
        if (!data.success) return;
        const docs = data.verifications || [];
        const pending = docs.filter((d: { package: string; status: string }) =>
          d.package !== 'aadhaar' && d.status !== 'approved' && d.status !== 'max_attempts_reached'
        );
        setOptionalPendingCount(pending.length);
      })
      .catch(() => {});
  }, [partnerId]);

  const displayOptionalCount = dismissVerificationBanner ? 0 : optionalPendingCount;

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const todayShifts = useMemo(
    () =>
      shifts
        .filter((s) => s.date === todayStr)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [todayStr]
  );

  const upcomingShifts = useMemo(
    () =>
      shifts
        .filter((s) => s.status === 'confirmed' || s.status === 'in_progress')
        .sort((a, b) => {
          const dateComp = a.date.localeCompare(b.date);
          return dateComp !== 0 ? dateComp : a.startTime.localeCompare(b.startTime);
        }),
    []
  );

  const uniquePatientCount = useMemo(
    () => new Set(todayShifts.map((s) => s.patientId)).size,
    [todayShifts]
  );

  const incompleteTaskCount = useMemo(
    () =>
      mockCareTasks.reduce((acc, ct) => {
        return acc + ct.tasks.filter((t) => !t.isCompleted).length;
      }, 0),
    []
  );

  const chartData = useMemo(() => mockMonthlyEarnings.slice(-6), []);

  return (
    <div className="space-y-6">
      {/* ========== Section 1: Welcome Header ========== */}
      <div className="bg-card rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500" />
        <div className="p-5 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                {getGreeting()}, {carePartnerName}
              </h1>
              <p className="text-sm text-gray-500 mt-1">{formatDate()}</p>
              <span className="inline-block mt-2 text-xs font-medium text-blue-600">
                {specialty === 'elder_care' ? 'Elder Care Specialist' : 'Child Care Specialist'}
              </span>
            </div>
            <div className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 inline-flex items-center gap-1.5 self-start">
              <Activity className="size-3.5" />
              {todayShifts.length} shift{todayShifts.length !== 1 ? 's' : ''} today
            </div>
          </div>
        </div>
      </div>

      {/* ========== Verification Pending Banner ========== */}
      {optionalPendingCount > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex items-center gap-3">
          <div className="size-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <Shield className="size-4.5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-800">Complete Your Verification</p>
            <p className="text-xs text-amber-600">{displayOptionalCount} optional verification{optionalPendingCount > 1 ? 's' : ''} pending</p>
          </div>
          <button
            onClick={() => onNavigate('verification')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-lg hover:bg-amber-200 transition-colors"
          >
            Complete Now
            <ArrowRight className="size-3" />
          </button>
          <button
            onClick={() => setDismissVerificationBanner(true)}
            className="text-amber-400 hover:text-amber-600 transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* ========== Section 2: Stats Cards ========== */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {/* Today's Shifts */}
        <button
          type="button"
          onClick={() => onNavigate('schedule')}
          className="bg-card rounded-xl border border-gray-100 shadow-sm py-5 px-4 text-left hover:border-blue-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Today's Shifts</span>
            <div className="size-10 rounded-xl shadow-sm bg-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Calendar className="size-5 text-white" />
            </div>
          </div>
          <p className="text-xl font-bold text-gray-900 sm:text-2xl mt-2">{todayShifts.length}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Scheduled for today</p>
        </button>

        {/* This Week Earnings */}
        <button
          type="button"
          onClick={() => onNavigate('earnings')}
          className="bg-card rounded-xl border border-gray-100 shadow-sm py-5 px-4 text-left hover:border-emerald-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">This Week</span>
            <div className="size-10 rounded-xl shadow-sm bg-emerald-500 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Wallet className="size-5 text-white" />
            </div>
          </div>
          <p className="text-xl font-bold text-gray-900 sm:text-2xl mt-2">
            {formatCurrency(mockCarePartner.earnings.thisWeek)}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {mockCarePartner.earnings.lastWeek > 0 ? (
              (() => {
                const pctChange = Math.round(
                  ((mockCarePartner.earnings.thisWeek - mockCarePartner.earnings.lastWeek) / mockCarePartner.earnings.lastWeek) * 100
                );
                const isUp = pctChange >= 0;
                return (
                  <>
                    <span className={`inline-flex items-center gap-0.5 ${isUp ? 'text-emerald-600' : 'text-red-500'}`}>
                      {isUp ? <TrendingUp className="size-3" /> : <TrendingUp className="size-3 rotate-180" />}
                      {isUp ? '+' : ''}{pctChange}%
                    </span>{' '}
                    vs last week
                  </>
                );
              })()
            ) : (
              <span className="text-muted-foreground">vs last week</span>
            )}
          </p>
        </button>

        {/* Active Care Members */}
        <button
          type="button"
          onClick={() => onNavigate('patients')}
          className="bg-card rounded-xl border border-gray-100 shadow-sm py-5 px-4 text-left hover:border-violet-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Active Care Members</span>
            <div className="size-10 rounded-xl shadow-sm bg-violet-500 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="size-5 text-white" />
            </div>
          </div>
          <p className="text-xl font-bold text-gray-900 sm:text-2xl mt-2">{uniquePatientCount}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Assigned today</p>
        </button>

        {/* Pending Tasks */}
        <button
          type="button"
          onClick={() => onNavigate('care-tasks')}
          className="bg-card rounded-xl border border-gray-100 shadow-sm py-5 px-4 text-left hover:border-amber-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Pending Tasks</span>
            <div className="size-10 rounded-xl shadow-sm bg-amber-500 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ClipboardList className="size-5 text-white" />
            </div>
          </div>
          <p className="text-xl font-bold text-gray-900 sm:text-2xl mt-2">{incompleteTaskCount}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Remaining today</p>
        </button>
      </div>

      {/* ========== Section 3: Upcoming Shifts + Quick Actions ========== */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Upcoming Shifts */}
        <Card className="lg:col-span-2 border-gray-100 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-900">Upcoming Shifts</CardTitle>
            <button
              onClick={() => onNavigate('schedule')}
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              View All
              <ChevronRight className="size-4" />
            </button>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingShifts.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="size-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No upcoming shifts</p>
              </div>
            ) : (
              upcomingShifts.map((shift) => (
                <div
                  key={shift.id}
                  onClick={() => setDetailShift(shift)}
                  className="rounded-xl border border-gray-100 bg-white p-3 sm:p-4 hover:border-blue-200 hover:bg-blue-50/30 transition-colors cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs font-semibold text-gray-700 shrink-0">
                        {shift.startTime} – {shift.endTime}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{shift.patientName}</p>
                        <p className="text-xs text-gray-500 truncate">{shift.serviceType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 sm:ml-auto">
                      {getModeBadge(shift.consultationMode)}
                      {getStatusBadge(shift.status)}
                    </div>
                  </div>
                  {shift.consultationMode === 'in_home' && shift.address && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
                      <MapPin className="size-3 shrink-0" />
                      <span className="truncate">{shift.address}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="lg:col-span-1 border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button
              onClick={() => onNavigate('shifts')}
              className="w-full rounded-xl p-3.5 flex items-center gap-3 transition-all active:scale-[0.98] bg-gradient-to-r from-blue-600 to-indigo-500 text-white shadow-sm hover:shadow-md"
            >
              <div className="bg-white/20 rounded-lg p-2">
                <Briefcase className="size-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">My Shifts</p>
                <p className="text-[11px] text-blue-100">View & manage shifts</p>
              </div>
            </button>

            <button
              onClick={() => onNavigate('patients')}
              className="w-full rounded-xl p-3.5 flex items-center gap-3 transition-all active:scale-[0.98] border border-violet-200 bg-violet-50/60 hover:bg-violet-50"
            >
              <div className="text-violet-600">
                <Users className="size-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">Care Members</p>
                <p className="text-[11px] text-gray-400">View all care members</p>
              </div>
            </button>

            <button
              onClick={() => onNavigate('earnings')}
              className="w-full rounded-xl p-3.5 flex items-center gap-3 transition-all active:scale-[0.98] border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50"
            >
              <div className="text-emerald-600">
                <Wallet className="size-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">Earnings Report</p>
                <p className="text-[11px] text-gray-400">Track your income</p>
              </div>
            </button>
          </CardContent>
        </Card>
      </div>

      {/* ========== Section 4: Today's Schedule (Timeline) ========== */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900">Today's Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {todayShifts.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="size-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No shifts scheduled for today</p>
            </div>
          ) : (
            <div className="relative">
              {/* Vertical timeline line */}
              <div className="absolute left-[22px] top-0 bottom-0 w-px bg-gray-200" />

              <div className="space-y-4">
                {todayShifts.map((shift) => {
                  const dotColor =
                    shift.status === 'completed'
                      ? 'bg-emerald-500'
                      : shift.status === 'in_progress'
                        ? 'bg-blue-500'
                        : shift.status === 'confirmed'
                          ? 'bg-blue-500'
                          : 'bg-red-500';

                  const isInProgress = shift.status === 'in_progress';
                  const isCancelled = shift.status === 'cancelled';

                  return (
                    <div key={shift.id} className="relative">
                      {/* Timeline dot */}
                      <div className="relative left-[17px]">
                        <div className={`size-3 rounded-full border-2 border-white shadow-sm ${dotColor}`} />
                        {isInProgress && (
                          <div className="absolute inset-[-3px] rounded-full bg-blue-400/30 animate-pulse" />
                        )}
                      </div>

                      {/* Shift card */}
                      <div
                        onClick={() => setDetailShift(shift)}
                        className={`ml-10 rounded-xl border bg-white p-3 sm:p-4 transition-colors cursor-pointer hover:border-blue-200 ${
                          isInProgress
                            ? 'border-blue-200 bg-blue-50/40 ring-1 ring-blue-200/50'
                            : isCancelled
                              ? 'border-red-100 bg-red-50/30 opacity-70'
                              : 'border-gray-100'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <p className="text-[11px] font-semibold text-gray-600">
                              {shift.startTime} – {shift.endTime}
                            </p>
                            <p className="text-sm font-semibold text-gray-900 mt-0.5">{shift.patientName}</p>
                            <p className="text-xs text-gray-500">{shift.serviceType}</p>
                          </div>
                          {/* Live progress bar for in-progress */}
                          {isInProgress && (
                            <div className="sm:hidden mt-1.5">
                              <ShiftProgressBar
                                startTime={shift.startTime}
                                endTime={shift.endTime}
                                date={shift.date}
                                compact
                              />
                            </div>
                          )}
                          <div className="flex items-center gap-2 shrink-0">
                            {getModeBadge(shift.consultationMode)}
                            {getStatusBadge(shift.status)}
                            {isInProgress && (
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-lg text-xs h-9 px-2"
                                onClick={(e) => { e.stopPropagation(); setCompleteShift(shift); }}
                              >
                                <CheckCircle2 className="size-3 mr-1" />
                                Complete
                              </Button>
                            )}
                          </div>
                        </div>
                        {shift.consultationMode === 'in_home' && shift.address && (
                          <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
                            <MapPin className="size-3 shrink-0" />
                            <span className="truncate">{shift.address}</span>
                          </div>
                        )}
                        {/* Live progress bar for in-progress (desktop) */}
                        {isInProgress && (
                          <div className="hidden sm:block mt-2">
                            <ShiftProgressBar
                              startTime={shift.startTime}
                              endTime={shift.endTime}
                              date={shift.date}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ========== Section 5: Earnings Overview ========== */}
      <Card
        className="border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all cursor-pointer"
        onClick={() => onNavigate('earnings')}
      >
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold text-gray-900">Earnings Overview</CardTitle>
          <span className="text-xs text-gray-400">Last 6 months</span>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                <defs>
                  <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" stroke="#f1f5f9" horizontal={true} vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  dy={8}
                />
                <YAxis hide={true} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
                    fontSize: '12px',
                    border: '1px solid #f1f5f9',
                    padding: '8px 12px',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Earnings']}
                />
                <Area
                  type="monotone"
                  dataKey="earnings"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#earningsGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Shift Detail Sheet */}
      <Sheet open={!!detailShift} onOpenChange={(open) => { if (!open) setDetailShift(null); }}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
          {detailShift && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                  </div>
                  Shift Details
                </SheetTitle>
              </SheetHeader>

              <div className="mt-4 space-y-4">
                {/* Status & Date */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(detailShift.status)}
                    {getModeBadge(detailShift.consultationMode)}
                  </div>
                  <span className="text-xs text-gray-500">{format(parseISO(detailShift.date), 'EEEE, MMMM d, yyyy')}</span>
                </div>

                {/* Time */}
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium">{detailShift.startTime} — {detailShift.endTime}</span>
                </div>

                {/* Care Member */}
                <div
                  className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 space-y-2 cursor-pointer hover:bg-blue-50/30 transition-colors"
                  onClick={() => { setDetailShift(null); onNavigate('patients', detailShift.patientId); }}
                >
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Care Member</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">{detailShift.patientName}</p>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500">{detailShift.serviceType}</p>
                  {detailShift.patientPhone && (
                    <p className="text-xs text-gray-400 mt-1">{detailShift.patientPhone}</p>
                  )}
                </div>

                {/* Booking ID */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-400">Booking ID:</span>
                  <span className="text-xs text-gray-600 font-mono">{detailShift.bookingId}</span>
                </div>

                {/* Address */}
                {detailShift.consultationMode === 'in_home' && detailShift.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <span className="text-xs text-gray-600">{detailShift.address}</span>
                  </div>
                )}

                {/* Special Instructions */}
                {detailShift.specialInstructions && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <div className="flex items-start gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-amber-700 mb-0.5">Special Instructions</p>
                        <p className="text-xs text-amber-700">{detailShift.specialInstructions}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Earnings */}
                {detailShift.earnings > 0 && (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 flex items-center justify-between">
                    <span className="text-xs font-medium text-emerald-700">Earnings</span>
                    <span className="text-lg font-bold text-emerald-700">{formatCurrency(detailShift.earnings)}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 flex-wrap">
                  {detailShift.status === 'in_progress' && (
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-lg text-xs"
                      onClick={() => { setDetailShift(null); setCompleteShift(detailShift); }}
                    >
                      <CheckCircle2 className="size-3.5 mr-1" />
                      Complete Shift
                    </Button>
                  )}
                  {detailShift.status === 'in_progress' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg text-xs text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => { setDetailShift(null); setReportIssueOpen(true); }}
                    >
                      <AlertCircle className="size-3.5 mr-1" />
                      Report Issue
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg text-xs ml-auto"
                    onClick={() => { setDetailShift(null); onNavigate('shifts'); }}
                  >
                    View All Shifts
                    <ArrowRight className="size-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Shift Complete OTP Modal */}
      {completeShift && (
        <ShiftCompleteOTP
          shiftId={completeShift.id}
          bookingId={completeShift.bookingId}
          careMemberName={completeShift.patientName}
          careMemberPhone={completeShift.patientPhone}
          serviceType={completeShift.serviceType}
          serviceCategory={completeShift.serviceCategory}
          address={completeShift.address || ''}
          startTime={completeShift.startTime}
          endTime={completeShift.endTime}
          earnings={completeShift.earnings}
          onComplete={(shiftId) => {
            setCompleteShift(null);
            setShiftCompleted(true);
            setTimeout(() => setShiftCompleted(false), 3000);
          }}
          onCancel={() => setCompleteShift(null)}
        />
      )}

      {shiftCompleted && (
        <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <CheckCircle className="size-4" />
          Shift completed successfully!
        </div>
      )}

      {/* Report Issue Dialog (for active shifts) */}
      {reportIssueOpen && (
        <ReportIssueDialog
          open={reportIssueOpen}
          onClose={() => setReportIssueOpen(false)}
        />
      )}

      {/* SOS Emergency Dialog */}
      <SOSEmergencyDialog
        open={sosOpen}
        onClose={() => setSosOpen(false)}
      />
    </div>
  );
}
