import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const addStopSchema = z.object({
  cityId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  notes: z.string().optional(),
});

export async function GET(
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

  const stops = await prisma.tripStop.findMany({
    where: { tripId: id },
    include: {
      city: true,
      activities: {
        include: { activity: true },
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { order: 'asc' },
  });

  return NextResponse.json(stops);
}

export async function POST(
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
  const result = addStopSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.errors[0].message },
      { status: 400 }
    );
  }

  const { cityId, startDate, endDate, notes } = result.data;
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end < start) {
    return NextResponse.json(
      { error: 'End date must be after start date' },
      { status: 400 }
    );
  }

  // Get the highest current order
  const maxOrder = await prisma.tripStop.findFirst({
    where: { tripId: id },
    orderBy: { order: 'desc' },
    select: { order: true },
  });

  const stop = await prisma.tripStop.create({
    data: {
      tripId: id,
      cityId,
      startDate: start,
      endDate: end,
      order: (maxOrder?.order ?? -1) + 1,
      notes,
    },
    include: {
      city: true,
      activities: {
        include: { activity: true },
      },
    },
  });

  return NextResponse.json(stop, { status: 201 });
}
