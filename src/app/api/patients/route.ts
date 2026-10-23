import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuthenticatedPartner } from '@/lib/api-auth';

// GET /api/patients — returns unique patients from the caregiver's bookings
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuthenticatedPartner(req as any);
    if (!auth.authorized) return auth.response;
    const { partner } = auth;
    if (!partner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get all bookings for this caregiver, extract unique patients
    const bookings = await db.booking.findMany({
      where: { caregiverId: partner.id },
      select: {
        patient: { select: { id: true, name: true, phone: true, age: true, gender: true, city: true, address: true } },
        patientName: true,
        patientPhone: true,
      },
      orderBy: { date: 'desc' },
    });

    // Deduplicate by patient ID (or phone for guest patients)
    const patientMap = new Map<string, any>();
    for (const b of bookings) {
      const id = b.patient?.id || b.patientPhone || b.patientName;
      if (id && !patientMap.has(id)) {
        patientMap.set(id, {
          id: b.patient?.id || id,
          name: b.patient?.name || b.patientName || 'Patient',
          phone: b.patient?.phone || b.patientPhone || '',
          age: b.patient?.age || null,
          gender: b.patient?.gender || 'Other',
          city: b.patient?.city || 'Gurugram',
          address: b.patient?.address || '',
          totalSessions: 1,
        });
      } else if (id) {
        const existing = patientMap.get(id);
        if (existing) existing.totalSessions++;
      }
    }

    return NextResponse.json({ patients: Array.from(patientMap.values()) });
  } catch (error) {
    console.error('Patients GET error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
