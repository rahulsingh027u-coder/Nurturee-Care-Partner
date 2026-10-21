import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuthenticatedPartner } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    // ─── AUTH GATE ───
    const auth = await requireAuthenticatedPartner(req);
    if (!auth.authorized) return auth.response;
    const { partner } = auth;

    const dbPartner = await db.caregiver.findUnique({ where: { id: partner!.id } });
    if (!dbPartner) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: dbPartner.id,
      caregiverId: dbPartner.caregiverId,
      name: dbPartner.name,
      phone: dbPartner.phone,
      email: dbPartner.email,
      specialty: dbPartner.specialty,
      experience: dbPartner.experience,
      qualifications: dbPartner.qualifications,
      isVerified: dbPartner.isVerified,
      isAvailable: dbPartner.isAvailable,
      aadhaarVerified: dbPartner.aadhaarVerified,
      policeVerified: dbPartner.policeVerified,
      medicalFitness: dbPartner.medicalFitness,
      videoVerified: dbPartner.videoVerified,
      isSuspended: dbPartner.isSuspended,
      rating: dbPartner.rating,
    });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // ─── AUTH GATE ───
    const auth = await requireAuthenticatedPartner(req);
    if (!auth.authorized) return auth.response;
    const { partner } = auth;

    const { name, email, qualifications, experience, specialty } = await req.json();

    const updated = await db.caregiver.update({
      where: { id: partner!.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(qualifications && { qualifications }),
        ...(experience !== undefined && { experience }),
        ...(specialty && { specialty }),
      },
    });

    return NextResponse.json({ success: true, partner: updated });
  } catch (error) {
    console.error('Profile PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
