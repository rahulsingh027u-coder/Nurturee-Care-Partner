import { NextRequest, NextResponse } from 'next/server';
import { requirePartnerAuth } from '@/lib/api-auth';
import { getOtp, deleteOtp } from '@/lib/redis';

// POST /api/shift-otp/verify — verify a shift start/complete OTP
export async function POST(req: NextRequest) {
  try {
    const auth = await requirePartnerAuth(req as any);
    if (!auth.authorized) return auth.response;
    const { partner } = auth;
    if (!partner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { shiftId, type, otp } = await req.json();
    if (!shiftId || !type || !otp) {
      return NextResponse.json({ error: 'shiftId, type, and otp required' }, { status: 400 });
    }

    const redisKey = `shift-otp:${type}:${shiftId}`;
    const stored = await getOtp(redisKey);
    if (!stored || stored !== otp) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 });
    }

    await deleteOtp(redisKey);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[shift-otp] verify error:', error);
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}
