import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePartnerAuth } from '@/lib/api-auth';

// GET /api/earnings — fetch earnings summary for the logged-in caregiver
// Returns shapes matching care-partner-data.ts mock arrays
export async function GET(req: NextRequest) {
  try {
    const auth = await requirePartnerAuth(req);
    if (!auth.authorized) return auth.response;
    const { partner } = auth;
    if (!partner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const bookings = await db.booking.findMany({
      where: { caregiverId: partner.id },
      orderBy: { date: 'desc' },
      include: { service: { select: { name: true } } },
    });

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    let today = 0, thisWeek = 0, thisMonth = 0, total = 0;
    const monthlyMap: Record<string, number> = {};
    const weeklyMap: Record<string, number> = {};
    const transactions: any[] = [];

    for (const b of bookings) {
      const amount = Number(b.doctorEarnings || b.totalAmount || 0);
      total += amount;
      const bDateStr = b.date || '';
      const bookingDate = bDateStr ? new Date(bDateStr) : null;

      if (bookingDate) {
        if (bDateStr === todayStr) today += amount;
        if (bookingDate >= startOfWeek) {
          thisWeek += amount;
          weeklyMap[bDateStr] = (weeklyMap[bDateStr] || 0) + amount;
        }
        if (bookingDate.getMonth() === now.getMonth() && bookingDate.getFullYear() === now.getFullYear()) {
          thisMonth += amount;
        }
        const monthKey = bookingDate.toISOString().slice(0, 7);
        monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + amount;
      }

      transactions.push({
        id: b.id, date: bDateStr, bookingId: b.bookingId,
        patientName: b.patientName || 'Patient',
        serviceType: b.service?.name || 'Care Service',
        amount,
        status: b.status === 'completed' ? 'paid' : b.status === 'cancelled' ? 'processing' : 'pending',
      });
    }

    const monthlyBreakdown = Object.entries(monthlyMap).map(([month, earnings]) => ({ month, earnings })).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
    const weeklyBreakdown = Object.entries(weeklyMap).map(([week, earnings]) => ({ week, earnings })).sort((a, b) => a.week.localeCompare(b.week)).slice(-8);

    return NextResponse.json({
      summary: { today, thisWeek, thisMonth, total },
      monthlyBreakdown, weeklyBreakdown, transactions,
      totalBookings: bookings.length,
    });
  } catch (error) {
    console.error('Earnings GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch earnings' }, { status: 500 });
  }
}
