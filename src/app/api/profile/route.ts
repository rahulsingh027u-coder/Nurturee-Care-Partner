import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const phone = req.nextUrl.searchParams.get('phone');
    if (!phone) {
      return NextResponse.json({ error: 'Phone required' }, { status: 400 });
    }

    const partner = await db.caregiver.findFirst({ where: { phone } });

    if (!partner) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: partner.id,
      caregiverId: partner.caregiverId,
      name: partner.name,
      phone: partner.phone,
      email: partner.email,
      specialty: partner.specialty,
      experience: partner.experience,
      qualifications: partner.qualifications,
      isVerified: partner.isVerified,
      isAvailable: partner.isAvailable,
      aadhaarVerified: partner.aadhaarVerified,
      policeVerified: partner.policeVerified,
      medicalFitness: partner.medicalFitness,
      videoVerified: partner.videoVerified,
      isSuspended: partner.isSuspended,
      rating: partner.rating,
    });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { phone, name, email, qualifications, experience, specialty } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone required' }, { status: 400 });
    }

    const existing = await db.caregiver.findFirst({ where: { phone } });
    if (!existing) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const partner = await db.caregiver.update({
      where: { id: existing.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(qualifications && { qualifications }),
        ...(experience !== undefined && { experience }),
        ...(specialty && { specialty }),
      },
    });

    return NextResponse.json({ success: true, partner });
  } catch (error) {
    console.error('Profile PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
