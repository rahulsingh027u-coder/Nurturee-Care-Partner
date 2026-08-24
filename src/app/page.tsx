'use client';
import { useState, useEffect } from 'react'
import CarePartnerLogin from '@/components/care-partner/CarePartnerLogin'
import OnboardingWizard from '@/components/care-partner/OnboardingWizard'
import CarePartnerLayout from '@/components/care-partner/CarePartnerLayout'
import DashboardView from '@/components/care-partner/DashboardView'
import ScheduleView from '@/components/care-partner/ScheduleView'
import PatientsView from '@/components/care-partner/PatientsView'
import CareTasksView from '@/components/care-partner/CareTasksView'
import ShiftsView from '@/components/care-partner/ShiftsView'
import ShiftCheckIn from '@/components/care-partner/ShiftCheckIn'
import EarningsView from '@/components/care-partner/EarningsView'
import ProfileView from '@/components/care-partner/ProfileView'
import NotificationsView from '@/components/care-partner/NotificationsView'
import VerificationPage from '@/components/care-partner/VerificationPage'
import TermsAcceptance from '@/components/care-partner/TermsAcceptance'
import { mockNotifications } from '@/lib/care-partner-data'
import type { Notification, Shift } from '@/lib/care-partner-data'
import { isOnboarded, getStoredOnboarding } from '@/lib/onboarding-data'
import {
  AADHAAR_PASSED_KEY,
  TERMS_ACCEPTED_KEY,
} from '@/lib/constants'

type AuthState = 'login' | 'onboarding' | 'pending_verification' | 'terms_acceptance' | 'authenticated'

interface PartnerData {
  id: string
  caregiverId: string
  name: string
  phone: string
  email: string
  specialty: string
  experience: number
  qualifications: string
  isVerified: boolean
  aadhaarVerified: boolean
  policeVerified: boolean
  medicalFitness: boolean
  videoVerified: boolean
  isSuspended: boolean
}

export default function CarePartnerPortal() {
  const [authState, setAuthState] = useState<AuthState>('login')
  const [activeView, setActiveView] = useState('dashboard')
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [scheduleStartShift, setScheduleStartShift] = useState<Shift | null>(null)
  const [shiftStarted, setShiftStarted] = useState(false)
  const [preselectPatientId, setPreselectPatientId] = useState<string | null>(null)
  const [partnerData, setPartnerData] = useState<PartnerData | null>(null)

  // Hydration: restore auth state from localStorage
  useEffect(() => {
    const storedPartner = localStorage.getItem('care_partner_data')
    if (storedPartner) {
      try {
        const parsed = JSON.parse(storedPartner)
        setPartnerData(parsed)
        if (parsed.isVerified && localStorage.getItem(TERMS_ACCEPTED_KEY) === 'true') {
          setAuthState('authenticated')
        } else if (parsed.isVerified) {
          setAuthState('terms_acceptance')
        } else if (isOnboarded()) {
          setAuthState('pending_verification')
        } else {
          setAuthState('onboarding')
        }
      } catch {
        // ignore corrupt data
      }
    }
  }, [])

  const handleLogin = (phone: string, data: PartnerData) => {
    setPartnerData(data)
    localStorage.setItem('care_partner_data', JSON.stringify(data))

    if (data.isVerified && localStorage.getItem(TERMS_ACCEPTED_KEY) === 'true') {
      setAuthState('authenticated')
    } else if (data.isVerified) {
      setAuthState('terms_acceptance')
    } else if (isOnboarded()) {
      setAuthState('pending_verification')
    } else {
      setAuthState('onboarding')
    }
  }

  const handleOnboardingComplete = async () => {
    // 1. Save ALL onboarding data (skills, services, certs, availability) to DB
    const onboardingData = getStoredOnboarding()
    if (onboardingData && partnerData) {
      try {
        // Save full onboarding data to new onboarding/save API
        await fetch('/api/onboarding/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: partnerData.phone,
            name: onboardingData.name,
            email: onboardingData.email,
            specialty: onboardingData.specialty,
            experience: onboardingData.experience,
            qualifications: onboardingData.qualifications,
            skills: onboardingData.skills || [],
            services: onboardingData.services || [],
            certifications: onboardingData.certifications || [],
            availability: onboardingData.availability || [],
          }),
        })

        // Also update basic profile fields via PATCH
        const res = await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: partnerData.phone,
            name: onboardingData.name,
            email: onboardingData.email,
            qualifications: onboardingData.qualifications,
            experience: onboardingData.experience,
            specialty: onboardingData.specialty,
          }),
        })
        const json = await res.json()
        if (json.success && json.partner) {
          const updated = { ...partnerData, ...json.partner }
          setPartnerData(updated)
          localStorage.setItem('care_partner_data', JSON.stringify(updated))
        }
      } catch (err) {
        console.error('Failed to save onboarding data:', err)
      }
    }
    setAuthState('pending_verification')
  }

  const handleVerificationComplete = () => {
    localStorage.setItem(AADHAAR_PASSED_KEY, 'true')
    if (partnerData) {
      const updated = { ...partnerData, isVerified: true, aadhaarVerified: true }
      setPartnerData(updated)
      localStorage.setItem('care_partner_data', JSON.stringify(updated))
    }
    setAuthState('terms_acceptance')
  }

  const handleTermsAccepted = () => {
    localStorage.setItem(TERMS_ACCEPTED_KEY, 'true')
    setAuthState('authenticated')
    setActiveView('dashboard')
  }

  const handleSignOut = () => {
    setAuthState('login')
    setActiveView('dashboard')
  }

  const handleNavigate = (view: string, patientId?: string) => {
    setPreselectPatientId(patientId || null)
    setActiveView(view)
  }

  // Partner display info from real DB data
  const displayName = partnerData?.name || 'Care Partner'
  const displaySpecialty = partnerData?.specialty === 'elder_care'
    ? 'Elder Care Specialist'
    : partnerData?.specialty === 'child_care'
      ? 'Child Care Specialist'
      : 'Care Partner'
  const displayPartnerId = partnerData?.caregiverId || 'CP-000'

  // Login screen
  if (authState === 'login') {
    return (
      <div className="min-h-screen bg-gray-50">
        <CarePartnerLogin onLogin={handleLogin} />
      </div>
    )
  }

  // Onboarding wizard (personal details, skills, services, availability)
  if (authState === 'onboarding') {
    return (
      <OnboardingWizard
        phone={partnerData?.phone || ''}
        onComplete={handleOnboardingComplete}
      />
    )
  }

  // Mandatory verification screen
  if (authState === 'pending_verification') {
    return (
      <VerificationPage
        partnerId={partnerData?.id}
        onComplete={handleVerificationComplete}
      />
    )
  }

  // Terms & Privacy acceptance
  if (authState === 'terms_acceptance') {
    return (
      <TermsAcceptance onAccept={handleTermsAccepted} />
    )
  }

  // Authenticated — full portal
  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <DashboardView
            carePartnerName={displayName}
            specialty={displaySpecialty}
            onNavigate={handleNavigate}
            partnerId={partnerData?.id}
          />
        )
      case 'schedule':
        return (
          <ScheduleView
            onNavigate={setActiveView}
            onStartShift={(shift) => setScheduleStartShift(shift)}
          />
        )
      case 'patients':
        return <PatientsView onNavigate={setActiveView} preselectPatientId={preselectPatientId || undefined} />
      case 'care-tasks':
        return <CareTasksView />
      case 'shifts':
        return <ShiftsView onNavigate={handleNavigate} />
      case 'earnings':
        return <EarningsView />
      case 'profile':
        return <ProfileView onNavigate={handleNavigate} partnerId={partnerData?.id} />
      case 'notifications':
        return <NotificationsView />
      case 'verification':
        return (
          <VerificationPage
            optionalMode
            partnerId={partnerData?.id}
            onComplete={() => setActiveView('profile')}
          />
        )
      default:
        return (
          <DashboardView
            carePartnerName={displayName}
            specialty={displaySpecialty}
            onNavigate={handleNavigate}
            partnerId={partnerData?.id}
          />
        )
    }
  }

  const pageTitleMap: Record<string, string> = {
    dashboard: 'Dashboard',
    schedule: 'My Schedule',
    patients: 'Care Members',
    'care-tasks': 'Care Tasks',
    shifts: 'My Shifts',
    earnings: 'Earnings',
    profile: 'My Profile',
    notifications: 'Notifications',
    verification: 'Verification Status',
  }

  return (
    <CarePartnerLayout
      carePartnerName={displayName}
      carePartnerId={displayPartnerId}
      activeView={activeView}
      onViewChange={setActiveView}
      notifications={notifications}
      onSignOut={handleSignOut}
    >
      <div className="space-y-6">
        <div className="md:hidden">
          <h1 className="text-lg font-semibold text-gray-900">
            {pageTitleMap[activeView] || 'Dashboard'}
          </h1>
        </div>
        {renderView()}
      </div>

      {/* Schedule Start Shift Check-In */}
      {scheduleStartShift && (
        <ShiftCheckIn
          shift={scheduleStartShift}
          onStart={() => {
            setScheduleStartShift(null)
            setShiftStarted(true)
            setTimeout(() => setShiftStarted(false), 3000)
          }}
          onCancel={() => setScheduleStartShift(null)}
        />
      )}
      {shiftStarted && (
        <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 animate-in slide-in-from-bottom-5">
          Shift started successfully!
        </div>
      )}
    </CarePartnerLayout>
  )
}
