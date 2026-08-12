'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Briefcase,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  IndianRupee,
  CheckCircle2,
  Phone,
} from 'lucide-react';

import { NURTUREE_HELPLINE } from '@/lib/constants';
import { mockShifts } from '@/lib/care-partner-data';
import type { Shift } from '@/lib/care-partner-data';
import ShiftCheckIn from './ShiftCheckIn';
import ShiftCompleteOTP from './ShiftCompleteOTP';
import ShiftProgressBar from './ShiftProgressBar';
import PatientDetailSheet from './PatientDetailSheet';
import ReportIssueDialog from './ReportIssueDialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { format, parseISO, isToday, isTomorrow, isYesterday, isSameDay, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

type StatusFilter = 'All' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled' | 'Upcoming';

interface ShiftsViewProps {
  onNavigate: (view: string, patientId?: string) => void;
}

const statusBadgeMap: Record<string, { label: string; className: string }> = {
  confirmed: {
    label: 'Confirmed',
    className: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100',
  },
  completed: {
    label: 'Completed',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-600 border-red-200 hover:bg-red-100',
  },
};

const leftBorderMap: Record<string, string> = {
  confirmed: 'border-l-blue-500',
  in_progress: 'border-l-blue-500',
  completed: 'border-l-emerald-500',
  cancelled: 'border-l-red-500',
};

function getDateGroupLabel(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEE, MMM d, yyyy');
}

function getDateGroupSortKey(dateStr: string): number {
  const date = parseISO(dateStr);
  if (isToday(date)) return 0;
  if (isTomorrow(date)) return 1;
  if (isYesterday(date)) return -1;
  return date.getTime();
}

export default function ShiftsView({ onNavigate }: ShiftsViewProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [startCalOpen, setStartCalOpen] = useState(false);
  const [endCalOpen, setEndCalOpen] = useState(false);
  const [tempStart, setTempStart] = useState<Date | undefined>(undefined);
  const [tempEnd, setTempEnd] = useState<Date | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Upcoming');
  const [startShift, setStartShift] = useState<Shift | null>(null);
  const [shiftStarted, setShiftStarted] = useState(false);
  const [completeShift, setCompleteShift] = useState<Shift | null>(null);
  const [shiftCompleted, setShiftCompleted] = useState(false);
  const [reportingShift, setReportingShift] = useState<Shift | null>(null);
  const [detailShift, setDetailShift] = useState<Shift | null>(null);
  const [detailPatientId, setDetailPatientId] = useState<string | null>(null);

  // Shifts in the active date range (used for stats counts)
  const dateRangeShifts = useMemo(() => {
    return mockShifts.filter((shift) => {
      const shiftDate = parseISO(shift.date);
      if (startDate || endDate) {
        // User picked a custom range
        if (startDate && shiftDate < startDate && !isSameDay(shiftDate, startDate)) return false;
        if (endDate && shiftDate > endDate && !isSameDay(shiftDate, endDate)) return false;
      } else {
        // Default: current month
        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        if (!isWithinInterval(shiftDate, { start: monthStart, end: monthEnd })) return false;
      }
      return true;
    });
  }, [startDate, endDate]);

  const stats = useMemo(() => {
    const total = dateRangeShifts.length;
    const completed = dateRangeShifts.filter((s) => s.status === 'completed').length;
    const upcoming = dateRangeShifts.filter(
      (s) => s.status === 'confirmed' || s.status === 'in_progress'
    ).length;
    const cancelled = dateRangeShifts.filter((s) => s.status === 'cancelled').length;
    return { total, completed, upcoming, cancelled };
  }, [dateRangeShifts]);

  const filteredShifts = useMemo(() => {
    return mockShifts.filter((shift) => {
      const shiftDate = parseISO(shift.date);

      // Date range filter
      if (startDate && shiftDate < startDate && !isSameDay(shiftDate, startDate)) return false;
      if (endDate && shiftDate > endDate && !isSameDay(shiftDate, endDate)) return false;

      // Status filter
      if (statusFilter === 'Confirmed' && shift.status !== 'confirmed') return false;
      if (statusFilter === 'In Progress' && shift.status !== 'in_progress') return false;
      if (statusFilter === 'Completed' && shift.status !== 'completed') return false;
      if (statusFilter === 'Cancelled' && shift.status !== 'cancelled') return false;
      if (statusFilter === 'Upcoming' && shift.status !== 'confirmed' && shift.status !== 'in_progress') return false;

      return true;
    });
  }, [startDate, endDate, statusFilter]);

  // Group shifts by date
  const groupedShifts = useMemo(() => {
    const groups: Record<string, typeof mockShifts> = {};

    for (const shift of filteredShifts) {
      const label = getDateGroupLabel(shift.date);
      if (!groups[label]) groups[label] = [];
      groups[label].push(shift);
    }

    // Sort groups: Today first, then Tomorrow, then other future dates, then past
    const sortedEntries = Object.entries(groups).sort(([, a], [, b]) => {
      const keyA = getDateGroupSortKey(a[0].date);
      const keyB = getDateGroupSortKey(b[0].date);
      return keyA - keyB;
    });

    return sortedEntries;
  }, [filteredShifts]);

  const statusPills: { key: StatusFilter; label: string; icon: React.ElementType; count: number; color: string; activeColor: string }[] = [
    { key: 'All', label: 'Total', icon: Briefcase, count: stats.total, color: 'text-gray-500', activeColor: 'text-blue-600 border-blue-300 bg-blue-50 ring-1 ring-blue-100' },
    { key: 'Upcoming', label: 'Upcoming', icon: Clock, count: stats.upcoming, color: 'text-blue-500', activeColor: 'text-blue-600 border-blue-300 bg-blue-50 ring-1 ring-blue-100' },
    { key: 'Completed', label: 'Completed', icon: CheckCircle, count: stats.completed, color: 'text-emerald-500', activeColor: 'text-emerald-600 border-emerald-300 bg-emerald-50 ring-1 ring-emerald-100' },
    { key: 'Cancelled', label: 'Cancelled', icon: XCircle, count: stats.cancelled, color: 'text-red-400', activeColor: 'text-red-600 border-red-300 bg-red-50 ring-1 ring-red-100' },
  ];

  return (
    <div className="space-y-5">
      {/* Section 1: Header + Unified Filter Bar */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50">
            <Briefcase className="w-5 h-5 text-blue-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">My Shifts</h1>
        </div>

        {/* Unified filter bar: Status pills + Date filters in one row */}
        <div className="flex items-center gap-2 flex-wrap">
          {statusPills.map((pill) => {
            const Icon = pill.icon;
            const isActive = statusFilter === pill.key;
            return (
              <button
                type="button"
                key={pill.key}
                onClick={() => setStatusFilter(pill.key)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer ${
                  isActive ? pill.activeColor : 'border-gray-100 bg-white hover:border-gray-300'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? '' : pill.color} transition-colors`} />
                <span className={`text-xs font-medium ${isActive ? '' : 'text-gray-500'} transition-colors`}>{pill.label}</span>
                <span className={`text-sm font-bold ${isActive ? '' : pill.color} transition-colors`}>{pill.count}</span>
              </button>
            );
          })}

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />

          {/* Start Date Picker */}
          <Popover open={startCalOpen} onOpenChange={(open) => {
            if (open) { setTempStart(startDate); }
            setStartCalOpen(open);
          }}>
            <PopoverTrigger asChild>
              <button
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all hover:shadow-sm ${
                  startDate
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                {startDate ? format(startDate, 'MMM d, yyyy') : 'Start Date'}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={tempStart}
                onSelect={(date) => setTempStart(date ?? undefined)}
                captionLayout="dropdown"
                fromYear={2020}
                toYear={2030}
              />
              <div className="flex items-center justify-between border-t px-3 py-2">
                <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setStartCalOpen(false)}>Cancel</Button>
                <Button size="sm" className="text-xs h-7 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => {
                  setStartDate(tempStart);
                  setStartCalOpen(false);
                }}>OK</Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* End Date Picker */}
          <Popover open={endCalOpen} onOpenChange={(open) => {
            if (open) { setTempEnd(endDate); }
            setEndCalOpen(open);
          }}>
            <PopoverTrigger asChild>
              <button
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all hover:shadow-sm ${
                  endDate
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                {endDate ? format(endDate, 'MMM d, yyyy') : 'End Date'}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={tempEnd}
                onSelect={(date) => setTempEnd(date ?? undefined)}
                captionLayout="dropdown"
                fromYear={2020}
                toYear={2030}
              />
              <div className="flex items-center justify-between border-t px-3 py-2">
                <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setEndCalOpen(false)}>Cancel</Button>
                <Button size="sm" className="text-xs h-7 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => {
                  setEndDate(tempEnd);
                  setEndCalOpen(false);
                }}>OK</Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Clear date filter */}
          {(startDate || endDate) && (
            <button
              onClick={() => { setStartDate(undefined); setEndDate(undefined); }}
              className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Section 3: Shifts List */}
      {groupedShifts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Briefcase className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-500">No shifts found</p>
          <p className="text-xs text-gray-400 mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-5">
          {groupedShifts.map(([groupLabel, shifts]) => (
            <div key={groupLabel}>
              <div className="flex items-center gap-2 mb-2">
                <CalendarIcon className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">{groupLabel}</span>
                <span className="text-xs text-gray-400">({shifts.length})</span>
              </div>

              <div className="space-y-3">
                {shifts.map((shift) => {
                  const badgeInfo = statusBadgeMap[shift.status];
                  const borderClass = leftBorderMap[shift.status];
                  const isInProgress = shift.status === 'in_progress';
                  const isCancelled = shift.status === 'cancelled';

                  return (
                    <div
                      key={shift.id}
                      className={`rounded-xl border border-gray-100 bg-white p-4 border-l-[3px] ${borderClass} ${isCancelled ? 'opacity-60' : ''} ${!isCancelled ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:scale-[0.995] transition-all' : ''}`}
                      onClick={() => { if (!isCancelled) setDetailPatientId(shift.patientId); }}
                    >
                      {/* Row 1: Time + Status + Earnings */}
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-sm font-medium">
                              {shift.startTime} - {shift.endTime}
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-[11px] px-2 py-0 ${badgeInfo.className}`}
                          >
                            {isInProgress && (
                              <span className="relative flex h-2 w-2 mr-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                              </span>
                            )}
                            {badgeInfo.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-emerald-600">
                          <IndianRupee className="w-3.5 h-3.5" />
                          <span className="text-sm font-semibold">
                            {shift.earnings > 0
                              ? `₹${shift.earnings.toLocaleString('en-IN')}`
                              : '—'}
                          </span>
                        </div>
                      </div>

                      {/* Row 2: Patient name + Service type */}
                      <div className="flex items-center gap-2 mb-2 min-w-0">
                        <span className="text-sm font-semibold text-gray-900 truncate">
                          {shift.patientName}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{shift.serviceType}</span>
                      </div>

                      {/* Live Progress Bar (in-progress only) */}
                      {isInProgress && (
                        <div className="mb-2">
                          <ShiftProgressBar
                            startTime={shift.startTime}
                            endTime={shift.endTime}
                            date={shift.date}
                          />
                        </div>
                      )}

                      {/* Row 3: Mode badge + Booking ID */}
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className={
                            shift.consultationMode === 'in_home'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-[11px] px-2 py-0'
                              : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50 text-[11px] px-2 py-0'
                          }
                        >
                          {shift.consultationMode === 'in_home' ? '🏠 In-Home' : '💻 Online'}
                        </Badge>
                        <span className="text-xs text-gray-400 font-mono">{shift.bookingId}</span>
                      </div>

                      {/* Row 4: Address (if in_home) */}
                      {shift.consultationMode === 'in_home' && shift.address && (
                        <div className="flex items-start gap-1.5 mb-2">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                          <span className="text-xs text-gray-500 truncate">{shift.address}</span>
                        </div>
                      )}

                      {/* Row 5: Notes */}
                      {shift.notes && (
                        <div className="bg-gray-50 rounded-lg p-2 mb-2">
                          <p className="text-xs text-gray-600">{shift.notes}</p>
                        </div>
                      )}

                      {/* Row 6: Special Instructions */}
                      {shift.specialInstructions && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3">
                          <div className="flex items-start gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                            <p className="text-xs text-amber-700">{shift.specialInstructions}</p>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                        {shift.status === 'confirmed' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-lg text-xs h-9 px-3"
                              onClick={(e) => { e.stopPropagation(); setStartShift(shift); }}
                            >
                              Start Shift
                            </Button>
                            <a
                              href={NURTUREE_HELPLINE}
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 px-3 h-9 text-xs font-medium hover:bg-emerald-100 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Phone className="size-3" />
                              Call
                            </a>
                          </>
                        )}
                        {shift.status === 'in_progress' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-lg text-xs h-9 px-3"
                              onClick={(e) => { e.stopPropagation(); setCompleteShift(shift); }}
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Complete Shift
                            </Button>
                            <a
                              href={NURTUREE_HELPLINE}
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 px-3 h-9 text-xs font-medium hover:bg-emerald-100 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Phone className="size-3" />
                              Call
                            </a>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-lg text-xs h-9 px-3 text-gray-600"
                              onClick={(e) => { e.stopPropagation(); setReportingShift(shift); }}
                            >
                              Report Issue
                            </Button>
                          </>
                        )}
                        {shift.status === 'completed' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-lg text-xs h-9 px-3 text-blue-600 border-blue-200 hover:bg-blue-50"
                              onClick={(e) => { e.stopPropagation(); setDetailShift(shift); }}
                            >
                              View Details
                            </Button>
                            <div className="flex items-center gap-1 text-emerald-600 ml-auto">
                              <IndianRupee className="w-3.5 h-3.5" />
                              <span className="text-sm font-semibold">
                                ₹{shift.earnings.toLocaleString('en-IN')} earned
                              </span>
                            </div>
                          </>
                        )}
                        {shift.status === 'cancelled' && (
                          <>
                            <Badge
                              variant="outline"
                              className="bg-red-50 text-red-500 border-red-200 text-xs px-2.5 py-0.5"
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Cancelled
                            </Badge>
                            {shift.notes && (
                              <span className="text-xs text-gray-400 italic ml-2">
                                {shift.notes}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Shift Check-In Modal (Location + Selfie + OTP) */}
      {startShift && (
        <ShiftCheckIn
          shift={startShift}
          onStart={(shiftId) => {
            setStartShift(null);
            setShiftStarted(true);
            setTimeout(() => setShiftStarted(false), 3000);
          }}
          onCancel={() => setStartShift(null)}
        />
      )}

      {shiftStarted && (
        <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <CheckCircle className="size-4" />
          Shift started successfully!
        </div>
      )}

      {/* Shift Complete OTP Modal */}
      {completeShift && (
        <ShiftCompleteOTP
          shiftId={completeShift.id}
          bookingId={completeShift.bookingId}
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

      {/* Shift Detail Sheet */}
      <Sheet open={!!detailShift} onOpenChange={(open) => { if (!open) setDetailShift(null); }}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
          {detailShift && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  Shift Details
                </SheetTitle>
              </SheetHeader>

              <div className="mt-4 space-y-4">
                {/* Status & Date */}
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs px-2.5 py-0.5">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Completed
                  </Badge>
                  <span className="text-xs text-gray-500">{format(parseISO(detailShift.date), 'EEEE, MMMM d, yyyy')}</span>
                </div>

                {/* Time */}
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium">{detailShift.startTime} — {detailShift.endTime}</span>
                </div>

                {/* Patient */}
                <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 space-y-2">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Care Member</p>
                  <p className="text-sm font-semibold text-gray-900">{detailShift.patientName}</p>
                  <p className="text-xs text-gray-500">{detailShift.serviceType}</p>
                </div>

                {/* Mode + Booking */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className={
                      detailShift.consultationMode === 'in_home'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] px-2 py-0'
                        : 'bg-blue-50 text-blue-700 border-blue-200 text-[11px] px-2 py-0'
                    }
                  >
                    {detailShift.consultationMode === 'in_home' ? '🏠 In-Home' : '💻 Online'}
                  </Badge>
                  <span className="text-xs text-gray-400 font-mono">{detailShift.bookingId}</span>
                </div>

                {/* Address */}
                {detailShift.consultationMode === 'in_home' && detailShift.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <span className="text-xs text-gray-600">{detailShift.address}</span>
                  </div>
                )}

                {/* Notes */}
                {detailShift.notes && (
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs font-medium text-gray-400 mb-1">Notes</p>
                    <p className="text-xs text-gray-600">{detailShift.notes}</p>
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
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-emerald-700">Earnings</span>
                  <div className="flex items-center gap-1 text-emerald-700">
                    <IndianRupee className="w-4 h-4" />
                    <span className="text-lg font-bold">₹{detailShift.earnings.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Report Issue Dialog */}
      {reportingShift && (
        <ReportIssueDialog
          open={!!reportingShift}
          onClose={() => setReportingShift(null)}
          patientName={reportingShift.patientName}
          bookingId={reportingShift.bookingId}
          shiftDate={format(parseISO(reportingShift.date), 'MMM d')}
        />
      )}

      {/* Patient Detail Sheet — opens as overlay without navigating away */}
      <PatientDetailSheet
        patientId={detailPatientId}
        onClose={() => setDetailPatientId(null)}
      />
    </div>
  );
}
