import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const updateTripSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  coverImage: z.string().nullable().optional(),
  budget: z.number().positive().nullable().optional(),
  isPublic: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      stops: {
        include: {
          city: true,
          activities: {
            include: { activity: true },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      },
      expenses: {
        orderBy: { date: 'asc' },
      },
      user: {
        select: { id: true, name: true, avatar: true },
      },
    },
  });

  if (!trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  // Check ownership or public access
  if (trip.userId !== session?.user?.id && !trip.isPublic) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  return NextResponse.json(trip);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const trip = await prisma.trip.findUnique({ where: { id } });
  if (!trip || trip.userId !== session.user.id) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  const body = await req.json();
  const result = updateTripSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.errors[0].message },
      { status: 400 }
    );
  }

  const data: any = {};
  if (result.data.name) data.name = result.data.name;
  if (result.data.description !== undefined) data.description = result.data.description;
  if (result.data.startDate) data.startDate = new Date(result.data.startDate);
  if (result.data.endDate) data.endDate = new Date(result.data.endDate);
  if (result.data.coverImage !== undefined) data.coverImage = result.data.coverImage;
  if (result.data.budget !== undefined) data.budget = result.data.budget;
  if (result.data.isPublic !== undefined) data.isPublic = result.data.isPublic;

  const updated = await prisma.trip.update({
    where: { id },
    data,
    include: {
      stops: {
        include: { city: true },
        orderBy: { order: 'asc' },
      },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const trip = await prisma.trip.findUnique({ where: { id } });
  if (!trip || trip.userId !== session.user.id) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  await prisma.trip.delete({ where: { id } });

  return NextResponse.json({ message: 'Trip deleted successfully' });
}
