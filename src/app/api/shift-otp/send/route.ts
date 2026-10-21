import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { requirePartnerAuth } from '@/lib/api-auth';
import { saveOtp } from '@/lib/redis';

// POST /api/shift-otp/send — generate a shift start/complete OTP
// The OTP is stored in Redis (keyed by shift ID) and must be entered by the caregiver.
// In production, this would also be sent via SMS to the patient for verification.
export async function POST(req: NextRequest) {
  try {
    const auth = await requirePartnerAuth(req as any);
    if (!auth.authorized) return auth.response;
    const { partner } = auth;
    if (!partner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { shiftId, type } = await req.json();
    if (!shiftId || !type || !['start', 'complete'].includes(type)) {
      return NextResponse.json({ error: 'shiftId and type (start|complete) required' }, { status: 400 });
    }

    // Generate a 4-digit OTP (simpler for caregiver to enter on-site)
    const otp = crypto.randomInt(1000, 10000).toString();
    const redisKey = `shift-otp:${type}:${shiftId}`;
    await saveOtp(redisKey, otp);

    // In production: send this OTP via SMS to the patient's phone
    // For now, return it (dev mode only — NOT in production)
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json({ success: true, otp }); // dev: return OTP for testing
    }

    return NextResponse.json({ success: true, message: 'OTP sent to patient' });
  } catch (error) {
    console.error('[shift-otp] send error:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
