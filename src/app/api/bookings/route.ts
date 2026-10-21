import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePartnerAuth } from '@/lib/api-auth';

// GET /api/bookings — fetch all bookings assigned to the logged-in caregiver
// Returns Shift[] shape (matching care-partner-data.ts interface)
export async function GET(req: NextRequest) {
  try {
    const auth = await requirePartnerAuth(req);
    if (!auth.authorized) return auth.response;
    const { partner } = auth;
    if (!partner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const bookings = await db.booking.findMany({
      where: { caregiverId: partner.id },
      orderBy: { date: 'desc' },
      include: {
        service: { select: { id: true, name: true, category: true } },
        patient: { select: { id: true, name: true, phone: true, age: true, gender: true, city: true, address: true } },
      },
    });

    const shifts = bookings.map((b) => {
      const serviceCategory =
        b.service?.category === 'child_care' || b.service?.category === 'elder_care'
          ? (b.service.category as 'child_care' | 'elder_care')
          : 'elder_care';
      return {
        id: b.id,
        bookingId: b.bookingId,
        patientId: b.patient?.id || b.patientId || '',
        patientName: b.patient?.name || b.patientName || 'Patient',
        patientPhone: b.patient?.phone || b.patientPhone || '',
        serviceType: b.service?.name || 'Care Service',
        serviceCategory,
        consultationMode: (b.consultationMode as 'online' | 'in_home') || 'in_home',
        status: (b.status as 'confirmed' | 'in_progress' | 'completed' | 'cancelled') || 'confirmed',
        date: b.date || '',
        startTime: b.startTime || '09:00',
        endTime: b.endTime || '17:00',
        address: b.address || b.patient?.address || undefined,
        city: b.city || b.patient?.city || undefined,
        notes: b.notes || undefined,
        earnings: Number(b.doctorEarnings || b.totalAmount || 0),
        specialInstructions: b.notes || undefined,
      };
    });

    return NextResponse.json({ shifts, total: shifts.length });
  } catch (error) {
    console.error('Bookings GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}
