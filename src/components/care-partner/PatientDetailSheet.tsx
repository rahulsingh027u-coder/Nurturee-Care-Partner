'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  MapPin,
  Phone,
  AlertTriangle,
  Heart,
  FileText,
  Save,
  X,
  GraduationCap,
  Stethoscope,
  Pencil,
  CheckCircle,
} from 'lucide-react';
import { mockPatients, mockCareTasks } from '@/lib/care-partner-data';
import type { Patient } from '@/lib/care-partner-data';
import { getAvatarColor, getInitials, formatDate, careTypeLabel } from '@/lib/helpers';

// ── Props ────────────────────────────────────────────────────────────
interface PatientDetailSheetProps {
  /** Patient ID to show — pass null/undefined to close */
  patientId: string | null;
  /** Called when the sheet is dismissed */
  onClose: () => void;
}

// ── Component ────────────────────────────────────────────────────────
export default function PatientDetailSheet({ patientId, onClose }: PatientDetailSheetProps) {
  const sheetOpen = patientId !== null;
  const selectedPatient = patientId ? mockPatients.find((p) => p.id === patientId) ?? null : null;

  // Derived data
  const patientTasks = selectedPatient
    ? mockCareTasks.find((ct) => ct.patientId === selectedPatient.id)
    : null;

  // Local state
  const [careNotes, setCareNotes] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());

  // Sync notes when patient changes
  useEffect(() => {
    if (selectedPatient) {
      setCareNotes(selectedPatient.careNotes);
      setEditingNotes(false);
      setCompletedTaskIds(new Set());
    }
  }, [selectedPatient?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSaveNotes() {
    setEditingNotes(false);
  }

  function handleCancelEdit() {
    if (selectedPatient) setCareNotes(selectedPatient.careNotes);
    setEditingNotes(false);
  }

  return (
    <Sheet open={sheetOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        {selectedPatient && (
          <div className="flex flex-col h-full">
            {/* ── Hero Header ── */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-5 pt-6 pb-12 rounded-b-2xl relative">
              <div className="flex justify-end mb-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-white/70 hover:text-white hover:bg-white/10"
                  onClick={onClose}
                >
                  <X className="size-4" />
                </Button>
              </div>
              <div className="flex items-center gap-4 relative z-10">
                {(() => {
                  const bgClass = getAvatarColor(selectedPatient.name);
                  return (
                    <div
                      className={`size-16 rounded-full border-[3px] border-white/30 ${bgClass} flex items-center justify-center shrink-0 shadow-lg`}
                    >
                      <span className="text-xl font-bold text-white">
                        {getInitials(selectedPatient.name)}
                      </span>
                    </div>
                  );
                })()}
                <div className="min-w-0 flex-1">
                  <SheetTitle className="text-xl font-bold text-white leading-tight">
                    {selectedPatient.name}
                  </SheetTitle>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-sm text-blue-100">{selectedPatient.age} years</span>
                    <Badge variant="secondary" className="text-xs px-2.5 py-0.5 h-5 bg-white/15 text-white border border-white/20">
                      {selectedPatient.gender}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-xs px-2.5 py-0.5 h-5 border border-white/25 text-white bg-white/10 ${selectedPatient.careType === 'elder_care' ? 'text-violet-200' : 'text-rose-200'}`}
                    >
                      {careTypeLabel(selectedPatient.careType)}
                    </Badge>
                  </div>
                  {selectedPatient.address && (
                    <p className="text-xs text-blue-200/80 mt-2 flex items-center gap-1.5">
                      <MapPin className="size-3 shrink-0" />
                      <span className="truncate">{selectedPatient.address}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Quick Stats ── */}
            <div className="-mt-5 relative z-10 mx-5 mb-4">
              <div className="grid grid-cols-3 gap-2.5 bg-white rounded-2xl border border-gray-100 shadow-md p-3">
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-900">{selectedPatient.totalSessions}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 font-medium">Sessions</p>
                </div>
                <div className="text-center border-x border-gray-100">
                  <p className="text-base font-bold text-gray-900">{formatDate(selectedPatient.lastSession)}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 font-medium">Last Visit</p>
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-gray-900 capitalize">
                    {selectedPatient.careType === 'child_care' ? 'Child' : 'Elder'}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5 font-medium">Care Type</p>
                </div>
              </div>
            </div>

            {/* ── Scrollable Content ── */}
            <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-5">
              {/* Health Info */}
              <section>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5 px-1">
                  Health Information
                </h3>
                <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                  <div className="flex items-center gap-3.5 px-4 py-3.5">
                    <div className="size-9 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                      <Heart className="size-4 text-rose-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-gray-400 font-medium">Blood Group</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">{selectedPatient.bloodGroup || 'Not recorded'}</p>
                    </div>
                  </div>
                  <Separator className="bg-gray-50" />
                  {selectedPatient.allergies && (
                    <>
                      <div className="flex items-center gap-3.5 px-4 py-3.5">
                        <div className="size-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                          <AlertTriangle className="size-4 text-amber-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-gray-400 font-medium">Allergies</p>
                          <p className="text-sm font-semibold text-amber-700 mt-0.5">{selectedPatient.allergies}</p>
                        </div>
                      </div>
                      <Separator className="bg-gray-50" />
                    </>
                  )}
                  {selectedPatient.primaryDoctor && (
                    <>
                      <div className="flex items-center gap-3.5 px-4 py-3.5">
                        <div className="size-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                          <Stethoscope className="size-4 text-violet-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-gray-400 font-medium">Primary Doctor</p>
                          <p className="text-sm font-semibold text-gray-900 mt-0.5">{selectedPatient.primaryDoctor}</p>
                        </div>
                      </div>
                      <Separator className="bg-gray-50" />
                    </>
                  )}
                  {selectedPatient.emergencyContact && (
                    <div className="flex items-center gap-3.5 px-4 py-3.5">
                      <div className="size-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                        <Phone className="size-4 text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-gray-400 font-medium">Emergency Contact</p>
                        <p className="text-sm font-semibold text-gray-900 mt-0.5">{selectedPatient.emergencyContact}</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Medical History / School Info */}
              <section>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5 px-1">
                  {selectedPatient.careType === 'child_care' ? 'School Information' : 'Medical History'}
                </h3>
                <div className="rounded-2xl border border-gray-100 bg-white p-4">
                  {selectedPatient.careType === 'child_care' ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3.5">
                        <div className="size-9 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                          <GraduationCap className="size-4 text-rose-500" />
                        </div>
                        <div>
                          <p className="text-[11px] text-gray-400 font-medium">School</p>
                          <p className="text-sm font-semibold text-gray-900 mt-0.5">{selectedPatient.schoolName || 'Not specified'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3.5">
                        <div className="size-9 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                          <FileText className="size-4 text-rose-500" />
                        </div>
                        <div>
                          <p className="text-[11px] text-gray-400 font-medium">Grade</p>
                          <p className="text-sm font-semibold text-gray-900 mt-0.5">{selectedPatient.grade || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedPatient.conditions && selectedPatient.conditions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {selectedPatient.conditions.map((condition) => (
                            <Badge
                              key={condition}
                              variant="outline"
                              className="text-xs border-blue-200 bg-blue-50 text-blue-700 px-2.5 py-0.5"
                            >
                              {condition}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {selectedPatient.medicalHistory || 'No medical history recorded.'}
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* Care Notes */}
              <section>
                <div className="flex items-center justify-between mb-2.5 px-1">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Care Notes
                  </h3>
                  {!editingNotes && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1 px-2"
                      onClick={() => setEditingNotes(true)}
                    >
                      <Pencil className="size-3" />
                      Edit
                    </Button>
                  )}
                </div>
                {editingNotes ? (
                  <div className="space-y-3 rounded-2xl border border-blue-200 bg-blue-50/30 p-4">
                    <Textarea
                      value={careNotes}
                      onChange={(e) => setCareNotes(e.target.value)}
                      className="min-h-[100px] w-full rounded-xl border border-gray-200 p-3 text-sm resize-none"
                      placeholder="Add care notes for this patient..."
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <Button variant="outline" size="sm" className="text-xs h-8 rounded-lg px-3" onClick={handleCancelEdit}>
                        <X className="size-3 mr-1" /> Cancel
                      </Button>
                      <Button size="sm" className="text-xs h-8 rounded-lg px-3" onClick={handleSaveNotes}>
                        <Save className="size-3 mr-1" /> Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {careNotes || 'No care notes added yet. Tap Edit to add notes about this patient.'}
                    </p>
                  </div>
                )}
              </section>

              {/* Session History */}
              <section>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5 px-1">
                  Session History
                </h3>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4">
                    <div className="size-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle className="size-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-gray-900">{formatDate(selectedPatient.lastSession)}</span>
                        <Badge variant="secondary" className="text-[10px] h-5 px-2 bg-emerald-50 text-emerald-700">Completed</Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                        {selectedPatient.careType === 'child_care'
                          ? 'After-school care session. Homework help and recreational activities completed.'
                          : 'Routine check-up and medication review. Patient stable.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4">
                    <div className="size-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle className="size-4 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {(() => {
                            const prevDate = new Date(selectedPatient.lastSession);
                            prevDate.setDate(prevDate.getDate() - 3);
                            return formatDate(prevDate.toISOString());
                          })()}
                        </span>
                        <Badge variant="secondary" className="text-[10px] h-5 px-2 bg-emerald-50 text-emerald-700">Completed</Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                        {selectedPatient.careType === 'child_care'
                          ? 'Full-day care. Art activities, outdoor play, and lunch provided.'
                          : 'Follow-up visit. Wound dressing and vitals monitoring.'}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 mt-2.5 text-center font-medium">
                  Total {selectedPatient.totalSessions} sessions
                </p>
              </section>

              {/* Today's Tasks */}
              {patientTasks && patientTasks.tasks.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5 px-1">
                    Today&apos;s Tasks
                  </h3>
                  <div className="space-y-2">
                    {patientTasks.tasks.map((task) => {
                      const isDone = completedTaskIds.has(task.id) || task.isCompleted;
                      return (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => {
                            setCompletedTaskIds((prev) => {
                              const next = new Set(prev);
                              if (isDone) next.delete(task.id); else next.add(task.id);
                              return next;
                            });
                          }}
                          className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4 cursor-pointer hover:bg-gray-50 transition-all w-full text-left"
                        >
                          <div
                            className={`mt-0.5 size-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                              isDone ? 'border-blue-600 bg-blue-600' : 'border-gray-300 bg-white'
                            }`}
                            aria-hidden="true"
                          >
                            {isDone && (
                              <svg className="size-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className={`text-sm ${isDone ? 'line-through text-gray-400' : 'text-gray-900 font-medium'}`}>
                              {task.title}
                            </span>
                            <p className="text-xs text-gray-400 mt-0.5">{task.scheduledTime}</p>
                          </div>
                          {isDone && (
                            <Badge variant="secondary" className="text-[10px] h-5 px-2 bg-emerald-50 text-emerald-700 shrink-0">
                              Done
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>

            {/* ── Bottom Action Bar ── */}
            <div className="border-t border-gray-100 bg-white/95 backdrop-blur-sm px-5 py-3 flex gap-2.5 shrink-0">
              <Button variant="outline" className="flex-1 rounded-xl h-10 gap-2 text-sm font-medium">
                <Phone className="size-4" />
                Call
              </Button>
              <Button className="flex-1 rounded-xl h-10 gap-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white">
                <AlertTriangle className="size-4" />
                Emergency
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
