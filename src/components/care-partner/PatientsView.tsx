'use client';

import { useState, useMemo, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Users,
  UserPlus,
  Clock,
  MapPin,
  Activity,
  HandHeart,
  GraduationCap,
} from 'lucide-react';
import { mockPatients } from '@/lib/care-partner-data';
import type { Patient } from '@/lib/care-partner-data';
import PatientDetailSheet from './PatientDetailSheet';
import { getAvatarColor, getInitials, formatDate, careTypeLabel } from '@/lib/helpers';

interface PatientsViewProps {
  onNavigate: (view: string) => void;
  preselectPatientId?: string;
}

function careTypeBadgeClasses(careType: Patient['careType']): string {
  if (careType === 'elder_care') {
    return 'bg-violet-100 text-violet-700 border-violet-200';
  }
  if (careType === 'child_care') {
    return 'bg-rose-100 text-rose-700 border-rose-200';
  }
  return 'bg-gray-100 text-gray-600 border-gray-200';
}

function PatientCard({ patient, onClick }: { patient: Patient; onClick: () => void }) {
  const bgClass = getAvatarColor(patient.name);

  return (
    <div
      onClick={onClick}
      className="rounded-xl border border-gray-100 bg-white p-4 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer"
    >
      {/* Top: Avatar + Name + Age/Gender + CareType badge */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className={`size-12 rounded-full ${bgClass} flex items-center justify-center shrink-0`}
        >
          <span className={`text-sm font-semibold text-white`}>
            {getInitials(patient.name)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-gray-900 truncate">
            {patient.name}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-gray-500">
              {patient.age} yrs
            </span>
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-4 bg-gray-100 text-gray-600"
            >
              {patient.gender}
            </Badge>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 h-4 ${careTypeBadgeClasses(patient.careType)}`}
            >
              {careTypeLabel(patient.careType)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Middle: City, Last Session */}
      <div className="flex flex-col gap-1.5 mb-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <MapPin className="size-3 shrink-0" />
          <span>{patient.city}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Clock className="size-3 shrink-0" />
          <span>Last session: {formatDate(patient.lastSession)}</span>
        </div>
      </div>

      {/* Conditions (elder care) / School info (child care) */}
      {patient.careType === 'child_care' && patient.schoolName && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
          <GraduationCap className="size-3 shrink-0" />
          <span className="truncate">{patient.schoolName} • {patient.grade}</span>
        </div>
      )}
      {patient.careType !== 'child_care' && patient.conditions && patient.conditions.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {patient.conditions.map((condition) => (
            <span
              key={condition}
              className="rounded-full bg-blue-50 text-blue-700 text-[10px] px-2 py-0.5"
            >
              {condition}
            </span>
          ))}
        </div>
      )}

      {/* Bottom: Sessions + View Details */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-500">
          {patient.totalSessions} sessions
        </span>
        <span className="text-sm text-blue-600 font-medium">
          View Details →
        </span>
      </div>
    </div>
  );
}

export default function PatientsView({ onNavigate, preselectPatientId }: PatientsViewProps) {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [statsFilter, setStatsFilter] = useState<'all' | 'new' | 'repeat'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailPatientId, setDetailPatientId] = useState<string | null>(null);

  // Auto-select patient when preselectPatientId changes
  useEffect(() => {
    if (preselectPatientId) {
      setDetailPatientId(preselectPatientId);
    }
  }, [preselectPatientId]);

  const filteredPatients = useMemo(() => {
    let patients = mockPatients;

    // Filter by stats card click
    if (statsFilter === 'new') {
      patients = patients.filter((p) => p.totalSessions <= 12);
    } else if (statsFilter === 'repeat') {
      patients = patients.filter((p) => p.totalSessions > 10);
    }

    // Filter by tab (care type)
    if (statsFilter === 'all') {
      if (activeTab === 'elder_care') {
        patients = patients.filter((p) => p.careType === 'elder_care');
      } else if (activeTab === 'child_care') {
        patients = patients.filter((p) => p.careType === 'child_care');
      }
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      patients = patients.filter(
        (p) =>
          p.name.toLowerCase().includes(q)
      );
    }

    return patients;
  }, [searchQuery, activeTab, statsFilter]);

  const elderCount = mockPatients.filter((p) => p.careType === 'elder_care').length;
  const childCount = mockPatients.filter((p) => p.careType === 'child_care').length;
  const newThisMonth = mockPatients.filter((p) => p.totalSessions <= 12).length;
  const repeatPatients = mockPatients.filter((p) => p.totalSessions > 10).length;

  function openPatientDetail(patient: Patient) {
    setDetailPatientId(patient.id);
  }

  // Render the patient cards grid
  function renderPatientCards(patients: Patient[]) {
    if (patients.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="size-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Users className="size-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            No care members found
          </h3>
          <p className="text-sm text-gray-500">
            Try a different search term or tab
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {patients.map((patient) => (
          <PatientCard
            key={patient.id}
            patient={patient}
            onClick={() => openPatientDetail(patient)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section 1: Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => { setActiveTab('all'); setStatsFilter('all'); }}
          className="bg-card rounded-xl border border-gray-100 shadow-sm py-4 px-4 flex items-center gap-3 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all cursor-pointer text-left group"
        >
          <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Users className="size-5 text-blue-600" />
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">
              {mockPatients.length}
            </div>
            <div className="text-xs text-gray-500">Total Care Members</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => { setStatsFilter('new'); }}
          className="bg-card rounded-xl border border-gray-100 shadow-sm py-4 px-4 flex items-center gap-3 hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all cursor-pointer text-left group"
        >
          <div className="size-10 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
            <UserPlus className="size-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">{newThisMonth}</div>
            <div className="text-xs text-gray-500">New This Month</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => { setStatsFilter('repeat'); }}
          className="bg-card rounded-xl border border-gray-100 shadow-sm py-4 px-4 flex items-center gap-3 hover:border-violet-300 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all cursor-pointer text-left group"
        >
          <div className="size-10 rounded-xl bg-violet-50 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Activity className="size-5 text-violet-600" />
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">{repeatPatients}</div>
            <div className="text-xs text-gray-500">Repeat Care Members</div>
          </div>
        </button>
      </div>

      {/* Section 2: Category Tabs + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setStatsFilter('all'); }}>
          <TabsList className="h-auto p-1">
            <TabsTrigger value="all" className="gap-1.5 px-3 py-1.5 text-xs font-medium">
              All
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-4 bg-gray-200 text-gray-600 hover:bg-gray-200">
                {mockPatients.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="elder_care" className="gap-1.5 px-3 py-1.5 text-xs font-medium">
              <HandHeart className="size-3.5 text-violet-600" />
              Elder Care
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-4 bg-violet-100 text-violet-700 hover:bg-violet-100">
                {elderCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="child_care" className="gap-1.5 px-3 py-1.5 text-xs font-medium">
              <GraduationCap className="size-3.5 text-rose-600" />
              Child Care
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-4 bg-rose-100 text-rose-700 hover:bg-rose-100">
                {childCount}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative flex-1 w-full sm:max-w-xs sm:ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Search care members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl border-gray-200 bg-white h-9 text-sm"
          />
        </div>
      </div>

      {/* Section 3: Patient Cards Grid */}
      {renderPatientCards(filteredPatients)}

      {/* Patient Detail Sheet (shared component) */}
      <PatientDetailSheet
        patientId={detailPatientId}
        onClose={() => setDetailPatientId(null)}
      />
    </div>
  );
}
