'use client';

import { useState, useMemo, useCallback } from 'react';
import { Calendar as CalendarRaw } from '@/components/ui/calendar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CalendarDays,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { mockShifts } from '@/lib/care-partner-data';
import type { Shift } from '@/lib/care-partner-data';
import ShiftProgressBar from './ShiftProgressBar';
import { format, addMonths, subMonths } from 'date-fns';
import { formatTime, formatCurrency } from '@/lib/helpers';
const Calendar = CalendarRaw as any;

interface ScheduleViewProps {
  onNavigate: (view: string) => void;
  onStartShift?: (shift: Shift) => void;
}

type ViewTab = 'list' | 'timeline';
type StatusFilter = 'all' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

function getStatusBadge(status: Shift['status']) {
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
          <AlertCircle className="size-3" />
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

function getModeBadge(mode: Shift['consultationMode']) {
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

function getDotColorForStatus(status: Shift['status']): string {
  switch (status) {
    case 'completed':
      return 'bg-emerald-500';
    case 'in_progress':
      return 'bg-blue-500';
    case 'confirmed':
      return 'bg-amber-500';
    case 'cancelled':
      return 'bg-red-400';
    default:
      return 'bg-gray-400';
  }
}

const statusFilters: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function ScheduleView({ onNavigate, onStartShift }: ScheduleViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [dateChanged, setDateChanged] = useState(false);
  const [viewTab, setViewTab] = useState<ViewTab>('list');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Build a map of date string -> shifts for quick lookup
  const shiftsByDate = useMemo(() => {
    const map: Record<string, Shift[]> = {};
    for (const shift of mockShifts) {
      if (!map[shift.date]) map[shift.date] = [];
      map[shift.date].push(shift);
    }
    return map;
  }, []);

  // Calendar dots via CSS classes injected below in JSX
  const dayClassName = useCallback(
    (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const shifts = shiftsByDate[dateStr];
      if (!shifts || shifts.length === 0) return '';
      if (shifts.some((s) => s.status === 'in_progress')) return 'relative cal-dot-inprogress';
      if (shifts.some((s) => s.status === 'completed')) return 'relative cal-dot-completed';
      if (shifts.some((s) => s.status === 'confirmed')) return 'relative cal-dot-confirmed';
      return 'relative cal-dot-cancelled';
    },
    [shiftsByDate]
  );

  // Get shifts for the selected date
  const selectedDateStr = useMemo(
    () => format(selectedDate, 'yyyy-MM-dd'),
    [selectedDate]
  );

  const selectedShifts = useMemo(
    () =>
      (shiftsByDate[selectedDateStr] || []).sort((a, b) =>
        a.startTime.localeCompare(b.startTime)
      ),
    [shiftsByDate, selectedDateStr]
  );

  // Filter shifts by status
  const filteredShifts = useMemo(
    () =>
      statusFilter === 'all'
        ? selectedShifts
        : selectedShifts.filter((s) => s.status === statusFilter),
    [selectedShifts, statusFilter]
  );

  // Calendar navigation handlers
  const handlePrevMonth = () => setCalendarMonth((prev) => subMonths(prev, 1));
  const handleNextMonth = () => setCalendarMonth((prev) => addMonths(prev, 1));

  const formattedSelectedDate = format(selectedDate, 'EEEE, MMMM d, yyyy');

  return (
    <div className="space-y-6">
      {/* ========== Two-panel Layout ========== */}
      <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
        {/* ===== Left Panel: Calendar ===== */}
        <div className="lg:col-span-1">
          <Card className="border-gray-100 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-900">
                  Select Date
                </CardTitle>
              </div>
              {/* Month/Year Navigation */}
              <div className="flex items-center justify-between pt-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={handlePrevMonth}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="text-sm font-medium text-gray-700">
                  {format(calendarMonth, 'MMMM yyyy')}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={handleNextMonth}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Calendar shift dot styles */}
              <style>{`.cal-dot-inprogress::after{content:'';position:absolute;bottom:2px;left:50%;transform:translateX(-50%);width:4px;height:4px;border-radius:9999px;z-index:10;background:#3b82f6}.cal-dot-completed::after{content:'';position:absolute;bottom:2px;left:50%;transform:translateX(-50%);width:4px;height:4px;border-radius:9999px;z-index:10;background:#10b981}.cal-dot-confirmed::after{content:'';position:absolute;bottom:2px;left:50%;transform:translateX(-50%);width:4px;height:4px;border-radius:9999px;z-index:10;background:#f59e0b}.cal-dot-cancelled::after{content:'';position:absolute;bottom:2px;left:50%;transform:translateX(-50%);width:4px;height:4px;border-radius:9999px;z-index:10;background:#f87171}`}</style>
              <Calendar
                mode="single"
                selected={tempDate}
                onSelect={(date) => {
                  if (date) {
                    setTempDate(date);
                    setCalendarMonth(date);
                    setDateChanged(true);
                  }
                }}
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
                captionLayout="dropdown"
                fromYear={2020}
                toYear={2030}
                dayClassName={dayClassName}
                classNames={{
                  day: 'relative w-full h-full p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none',
                  day_button:
                    'h-9 w-9 rounded-lg text-sm font-normal hover:bg-accent hover:text-accent-foreground data-[selected-single=true]:bg-blue-600 data-[selected-single=true]:text-white data-[selected-single=true]:hover:bg-blue-700 data-[today=true]:font-semibold data-[today=true]:text-blue-600 data-[selected-single=true]:data-[today=true]:text-white',
                  today: 'bg-transparent',
                }}
              />

              {/* OK / Cancel */}
              <div className="flex items-center justify-between mt-2">
                <Button size="sm" variant="ghost" className="text-xs h-7" disabled={!dateChanged} onClick={() => {
                  setTempDate(selectedDate);
                  setCalendarMonth(selectedDate);
                  setDateChanged(false);
                }}>Cancel</Button>
                <Button size="sm" className="text-xs h-7 bg-blue-600 hover:bg-blue-700 text-white" disabled={!dateChanged} onClick={() => {
                  setSelectedDate(tempDate);
                  setDateChanged(false);
                }}>OK</Button>
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap items-center gap-3 px-1">
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-blue-500" />
                  <span className="text-[11px] text-gray-500">Today&apos;s shifts</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span className="text-[11px] text-gray-500">Completed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-amber-500" />
                  <span className="text-[11px] text-gray-500">Upcoming</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ===== Right Panel: Selected Day's Shifts ===== */}
        <div className="lg:col-span-2">
          <Card className="border-gray-100 shadow-sm">
            {/* Header */}
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-semibold text-gray-900">
                    {formattedSelectedDate}
                  </CardTitle>
                  <Badge variant="secondary" className="text-[11px] font-medium">
                    {selectedShifts.length} shift{selectedShifts.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                {/* View Tabs */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setViewTab('list')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      viewTab === 'list'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    List View
                  </button>
                  <button
                    onClick={() => setViewTab('timeline')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      viewTab === 'timeline'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Timeline View
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Empty State */}
              {selectedShifts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="size-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                    <CalendarDays className="size-8 text-gray-300" />
                  </div>
                  <p className="text-sm font-semibold text-gray-500">
                    No shifts scheduled
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Looks like you have a day off!
                  </p>
                </div>
              ) : (
                <>
                  {/* Filter Bar */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    {statusFilters.map((filter) => (
                      <button
                        key={filter.value}
                        onClick={() => setStatusFilter(filter.value)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                          statusFilter === filter.value
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>

                  {/* Filtered Empty */}
                  {filteredShifts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <CalendarDays className="size-8 text-gray-300 mb-2" />
                      <p className="text-sm text-gray-400">
                        No {statusFilter === 'all' ? '' : statusFilter.replace('_', ' ')} shifts found for this date
                      </p>
                    </div>
                  ) : viewTab === 'list' ? (
                    /* ===== List View ===== */
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                      {filteredShifts.map((shift) => (
                        <ShiftListCard key={shift.id} shift={shift} onNavigate={onNavigate} onStartShift={onStartShift} />
                      ))}
                    </div>
                  ) : (
                    /* ===== Timeline View ===== */
                    <div className="relative max-h-[600px] overflow-y-auto pr-1">
                      {/* Vertical timeline line */}
                      <div className="absolute left-[22px] top-0 bottom-0 w-px bg-gray-200" />

                      <div className="space-y-4">
                        {filteredShifts.map((shift) => (
                          <ShiftTimelineCard key={shift.id} shift={shift} onNavigate={onNavigate} onStartShift={onStartShift} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* =============================================
   Shift List Card
   ============================================= */
function ShiftListCard({
  shift,
  onNavigate,
  onStartShift,
}: {
  shift: Shift;
  onNavigate: (view: string) => void;
  onStartShift?: (shift: Shift) => void;
}) {
  const isInProgress = shift.status === 'in_progress';
  const isCancelled = shift.status === 'cancelled';

  return (
    <div
      className={`rounded-xl border bg-white p-4 hover:border-blue-200 transition-colors ${
        isInProgress
          ? 'border-blue-200 ring-1 ring-blue-200/50'
          : isCancelled
            ? 'border-red-100 opacity-70'
            : 'border-gray-100'
      }`}
    >
      {/* Top row: Time + Badges + Earnings */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Time Block */}
          <div className="shrink-0">
            <p className="text-sm font-semibold text-gray-700">
              {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
            </p>
          </div>

          {/* Care Member Info */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {shift.patientName}
            </p>
            <p className="text-xs text-gray-500 truncate">{shift.serviceType}</p>
          </div>
        </div>

        {/* Right: Badges + Earnings */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <div className="flex items-center gap-1.5">
            {getModeBadge(shift.consultationMode)}
            {getStatusBadge(shift.status)}
          </div>
          {shift.earnings > 0 && (
            <span className="text-sm font-medium text-emerald-600">
              {formatCurrency(shift.earnings)}
            </span>
          )}
        </div>
      </div>

      {/* Live progress bar for in-progress */}
      {isInProgress && (
        <div className="mt-2.5">
          <ShiftProgressBar
            startTime={shift.startTime}
            endTime={shift.endTime}
            date={shift.date}
          />
        </div>
      )}

      {/* Address for in-home shifts */}
      {shift.consultationMode === 'in_home' && shift.address && (
        <div className="flex items-center gap-1.5 mt-2.5 text-xs text-gray-400">
          <MapPin className="size-3 shrink-0" />
          <span className="truncate">{shift.address}</span>
        </div>
      )}

      {/* Special Instructions */}
      {shift.specialInstructions && (
        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-700">
          <span className="font-medium">Note: </span>
          {shift.specialInstructions}
        </div>
      )}

      {/* Action Button */}
      <div className="mt-3 flex items-center justify-end">
        {shift.status === 'completed' && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-9 border-gray-200 text-gray-600 hover:bg-gray-50"
            onClick={() => onNavigate('patients')}
          >
            View Details
          </Button>
        )}
        {shift.status === 'confirmed' && (
          <Button
            size="sm"
            className="text-xs h-9 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-sm"
            onClick={(e) => { e.stopPropagation(); onStartShift?.(shift); }}
          >
            Start Shift
          </Button>
        )}
      </div>
    </div>
  );
}

/* =============================================
   Shift Timeline Card
   ============================================= */
function ShiftTimelineCard({
  shift,
  onNavigate,
  onStartShift,
}: {
  shift: Shift;
  onNavigate: (view: string) => void;
  onStartShift?: (shift: Shift) => void;
}) {
  const isInProgress = shift.status === 'in_progress';
  const isCancelled = shift.status === 'cancelled';
  const dotColor = getDotColorForStatus(shift.status);

  return (
    <div className="relative">
      {/* Timeline dot */}
      <div className="relative left-[17px]">
        <div
          className={`size-3 rounded-full border-2 border-white shadow-sm ${dotColor}`}
        />
        {isInProgress && (
          <div className="absolute inset-[-3px] rounded-full bg-blue-400/30 animate-pulse" />
        )}
      </div>

      {/* Shift card */}
      <div
        className={`ml-10 rounded-xl border bg-white p-3 sm:p-4 transition-colors ${
          isInProgress
            ? 'border-blue-200 bg-blue-50/40 ring-1 ring-blue-200/50'
            : isCancelled
              ? 'border-red-100 bg-red-50/30 opacity-70'
              : 'border-gray-100'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-gray-600">
              {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
            </p>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">
              {shift.patientName}
            </p>
            <p className="text-xs text-gray-500">{shift.serviceType}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {getModeBadge(shift.consultationMode)}
            {getStatusBadge(shift.status)}
          </div>
        </div>

        {/* Live progress bar for in-progress */}
        {isInProgress && (
          <div className="mt-2">
            <ShiftProgressBar
              startTime={shift.startTime}
              endTime={shift.endTime}
              date={shift.date}
              compact
            />
          </div>
        )}

        {shift.consultationMode === 'in_home' && shift.address && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">{shift.address}</span>
          </div>
        )}

        {shift.specialInstructions && (
          <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-700">
            <span className="font-medium">Note: </span>
            {shift.specialInstructions}
          </div>
        )}

        {/* Earnings & Action in timeline */}
        <div className="mt-2 flex items-center justify-between">
          {shift.earnings > 0 ? (
            <span className="text-sm font-medium text-emerald-600">
              {formatCurrency(shift.earnings)}
            </span>
          ) : (
            <span />
          )}
          <div>
            {shift.status === 'completed' && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-9 border-gray-200 text-gray-600 hover:bg-gray-50"
                onClick={() => onNavigate('patients')}
              >
                View Details
              </Button>
            )}
            {shift.status === 'confirmed' && (
              <Button
                size="sm"
                className="text-xs h-9 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-sm"
                onClick={(e) => { e.stopPropagation(); onStartShift?.(shift); }}
              >
                Start Shift
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
