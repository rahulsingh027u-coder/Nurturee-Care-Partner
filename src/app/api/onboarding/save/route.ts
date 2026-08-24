import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/*
  POST /api/onboarding/save
  Saves ALL onboarding data to the database.
  Accepts full onboarding payload and upserts into:
    - Caregiver (basic profile fields)
    - CarePartnerSkill (selected skills)
    - CarePartnerService (selected services)
    - CarePartnerCertification (certifications)
    - CarePartnerAvailability (weekly availability slots)
*/

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, name, email, specialty, experience, qualifications,
            gender, dateOfBirth, bio, languages, city, state, address, pincode,
            skills, services, certifications, availability } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // 1. Find the care partner by phone
    const partner = await db.caregiver.findFirst({ where: { phone } });
    if (!partner) {
      return NextResponse.json({ error: 'Care partner not found' }, { status: 404 });
    }

    // 2. Update basic profile fields on Caregiver table
    await db.caregiver.update({
      where: { id: partner.id },
      data: {
        name: name || partner.name,
        email: email || partner.email,
        specialty: specialty || partner.specialty,
        experience: experience != null ? experience : partner.experience,
        qualifications: qualifications || partner.qualifications,
        gender: gender || partner.gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : partner.dateOfBirth,
        bio: bio || partner.bio,
        languages: languages || partner.languages,
        city: city || partner.city,
        state: state || partner.state,
        address: address || partner.address,
        pincode: pincode || partner.pincode,
        onboardingCompleted: true,
      },
    });

    // 3. Replace skills (delete existing, insert new)
    if (Array.isArray(skills)) {
      await db.carePartnerSkill.deleteMany({ where: { caregiverId: partner.id } });
      if (skills.length > 0) {
        await db.carePartnerSkill.createMany({
          data: skills.map((s: any) => ({
            caregiverId: partner.id,
            skill: typeof s === 'string' ? s : s.skill || s.name,
            proficiency: typeof s === 'object' ? s.proficiency : null,
            yearsOfExp: typeof s === 'object' ? s.yearsOfExp : null,
          })),
        });
      }
    }

    // 4. Replace services (delete existing, insert new)
    if (Array.isArray(services)) {
      await db.carePartnerService.deleteMany({ where: { caregiverId: partner.id } });
      if (services.length > 0) {
        await db.carePartnerService.createMany({
          data: services.map((s: any) => ({
            caregiverId: partner.id,
            service: typeof s === 'string' ? s : s.service || s.name,
            hourlyRate: typeof s === 'object' ? s.hourlyRate : null,
            isActive: true,
          })),
        });
      }
    }

    // 5. Replace certifications (delete existing, insert new)
    if (Array.isArray(certifications)) {
      await db.carePartnerCertification.deleteMany({ where: { caregiverId: partner.id } });
      if (certifications.length > 0) {
        await db.carePartnerCertification.createMany({
          data: certifications.map((c: any) => ({
            caregiverId: partner.id,
            name: c.name || c.certification,
            issuer: c.issuer || c.institution || null,
            year: c.year || null,
            certificateFile: c.certificateFile || c.fileData || null,
            isVerified: false,
          })),
        });
      }
    }

    // 6. Replace availability (delete existing, insert new)
    if (Array.isArray(availability)) {
      await db.carePartnerAvailability.deleteMany({ where: { caregiverId: partner.id } });
      if (availability.length > 0) {
        await db.carePartnerAvailability.createMany({
          data: availability.map((a: any) => ({
            caregiverId: partner.id,
            dayOfWeek: a.dayOfWeek || a.day,
            startTime: a.startTime || a.start,
            endTime: a.endTime || a.end,
            isAvailable: true,
          })),
        });
      }
    }

    // 7. Return updated partner
    const updated = await db.caregiver.findFirst({ where: { id: partner.id } });

    console.log(`Onboarding data saved for ${phone} (${partner.caregiverId})`);
    return NextResponse.json({
      success: true,
      message: 'Onboarding data saved successfully',
      partner: updated,
    });
  } catch (error) {
    console.error('Save onboarding error:', error);
    return NextResponse.json({ error: 'Failed to save onboarding data' }, { status: 500 });
  }
}
