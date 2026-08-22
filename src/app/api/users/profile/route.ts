import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  avatar: z.string().nullable().optional(),
  language: z.string().optional(),
  defaultPrivacy: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      role: true,
      language: true,
      defaultPrivacy: true,
      createdAt: true,
      _count: { select: { trips: true, savedDestinations: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const result = updateProfileSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.errors[0].message },
      { status: 400 }
    );
  }

  const data: any = {};
  if (result.data.name) data.name = result.data.name;
  if (result.data.email) data.email = result.data.email;
  if (result.data.avatar !== undefined) data.avatar = result.data.avatar;
  if (result.data.language) data.language = result.data.language;
  if (result.data.defaultPrivacy) data.defaultPrivacy = result.data.defaultPrivacy;

  if (result.data.newPassword && result.data.currentPassword) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const isValid = await bcrypt.compare(result.data.currentPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }
    data.passwordHash = await bcrypt.hash(result.data.newPassword, 10);
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      role: true,
      language: true,
      defaultPrivacy: true,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await prisma.user.delete({
    where: { id: session.user.id },
  });

  return NextResponse.json({ message: 'Account deleted successfully' });
}
