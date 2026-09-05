import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePartnerAuth } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  try {
    // ─── AUTH GATE ───
    const auth = await requirePartnerAuth(req);
    if (!auth.authorized) return auth.response;
    const { partner } = auth;

    const body = await req.json();
    const { name, email, specialty, experience, qualifications,
            gender, dateOfBirth, bio, languages, city, state, address, pincode,
            skills, services, certifications, availability } = body;

    // 1. Use partner!.id from JWT token — IGNORE any phone in body
    const dbPartner = await db.caregiver.findUnique({ where: { id: partner!.id } });
    if (!dbPartner) {
      return NextResponse.json({ error: 'Care partner not found' }, { status: 404 });
    }

    // 2. Update basic profile fields
    await db.caregiver.update({
      where: { id: partner!.id },
      data: {
        name: name || dbPartner.name,
        email: email || dbPartner.email,
        specialty: specialty || dbPartner.specialty,
        experience: experience != null ? experience : dbPartner.experience,
        qualifications: qualifications || dbPartner.qualifications,
        gender: gender || dbPartner.gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : dbPartner.dateOfBirth,
        bio: bio || dbPartner.bio,
        languages: languages || dbPartner.languages,
        city: city || dbPartner.city,
        state: state || dbPartner.state,
        address: address || dbPartner.address,
        pincode: pincode || dbPartner.pincode,
        onboardingCompleted: true,
      },
    });

    // 3. Replace skills
    if (Array.isArray(skills)) {
      await db.carePartnerSkill.deleteMany({ where: { caregiverId: partner!.id } });
      if (skills.length > 0) {
        await db.carePartnerSkill.createMany({
          data: skills.map((s: any) => ({
            caregiverId: partner!.id,
            skill: typeof s === 'string' ? s : s.skill || s.name,
            proficiency: typeof s === 'object' ? s.proficiency : null,
            yearsOfExp: typeof s === 'object' ? s.yearsOfExp : null,
          })),
        });
      }
    }

    // 4. Replace services
    if (Array.isArray(services)) {
      await db.carePartnerService.deleteMany({ where: { caregiverId: partner!.id } });
      if (services.length > 0) {
        await db.carePartnerService.createMany({
          data: services.map((s: any) => ({
            caregiverId: partner!.id,
            service: typeof s === 'string' ? s : s.service || s.name,
            hourlyRate: typeof s === 'object' ? s.hourlyRate : null,
            isActive: true,
          })),
        });
      }
    }

    // 5. Replace certifications
    if (Array.isArray(certifications)) {
      await db.carePartnerCertification.deleteMany({ where: { caregiverId: partner!.id } });
      if (certifications.length > 0) {
        await db.carePartnerCertification.createMany({
          data: certifications.map((c: any) => ({
            caregiverId: partner!.id,
            name: c.name || c.certification,
            issuer: c.issuer || c.institution || null,
            year: c.year || null,
            certificateFile: c.certificateFile || c.fileData || null,
            isVerified: false,
          })),
        });
      }
    }

    // 6. Replace availability
    if (Array.isArray(availability)) {
      await db.carePartnerAvailability.deleteMany({ where: { caregiverId: partner!.id } });
      if (availability.length > 0) {
        await db.carePartnerAvailability.createMany({
          data: availability.map((a: any) => ({
            caregiverId: partner!.id,
            dayOfWeek: a.dayOfWeek || a.day,
            startTime: a.startTime || a.start,
            endTime: a.endTime || a.end,
            isAvailable: true,
          })),
        });
      }
    }

    const updated = await db.caregiver.findUnique({ where: { id: partner!.id } });
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
