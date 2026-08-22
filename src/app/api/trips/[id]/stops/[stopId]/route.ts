import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stopId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, stopId } = await params;

  const trip = await prisma.trip.findUnique({ where: { id } });
  if (!trip || trip.userId !== session.user.id) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  const body = await req.json();
  const data: any = {};

  if (body.startDate) data.startDate = new Date(body.startDate);
  if (body.endDate) data.endDate = new Date(body.endDate);
  if (body.notes !== undefined) data.notes = body.notes;
  if (body.order !== undefined) data.order = body.order;

  const stop = await prisma.tripStop.update({
    where: { id: stopId },
    data,
    include: {
      city: true,
      activities: {
        include: { activity: true },
        orderBy: { order: 'asc' },
      },
    },
  });

  return NextResponse.json(stop);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stopId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, stopId } = await params;

  const trip = await prisma.trip.findUnique({ where: { id } });
  if (!trip || trip.userId !== session.user.id) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  await prisma.tripStop.delete({ where: { id: stopId } });

  // Re-order remaining stops
  const remainingStops = await prisma.tripStop.findMany({
    where: { tripId: id },
    orderBy: { order: 'asc' },
  });

  for (let i = 0; i < remainingStops.length; i++) {
    await prisma.tripStop.update({
      where: { id: remainingStops[i].id },
      data: { order: i },
    });
  }

  return NextResponse.json({ message: 'Stop removed' });
}
