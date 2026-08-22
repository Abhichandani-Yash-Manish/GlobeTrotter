import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

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

  const { orderedIds } = await req.json();

  if (!Array.isArray(orderedIds)) {
    return NextResponse.json({ error: 'orderedIds must be an array' }, { status: 400 });
  }

  // Update all stop orders in a transaction
  await prisma.$transaction(
    orderedIds.map((stopId: string, index: number) =>
      prisma.tripStop.update({
        where: { id: stopId },
        data: { order: index },
      })
    )
  );

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
