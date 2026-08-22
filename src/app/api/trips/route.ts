import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const createTripSchema = z.object({
  name: z.string().min(1, 'Trip name is required'),
  description: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  coverImage: z.string().optional(),
  budget: z.number().positive().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  const where: any = { userId: session.user.id };

  if (search) {
    where.name = { contains: search };
  }

  const now = new Date();
  if (status === 'upcoming') {
    where.startDate = { gt: now };
  } else if (status === 'ongoing') {
    where.startDate = { lte: now };
    where.endDate = { gte: now };
  } else if (status === 'completed') {
    where.endDate = { lt: now };
  }

  const trips = await prisma.trip.findMany({
    where,
    include: {
      stops: {
        include: {
          city: true,
        },
        orderBy: { order: 'asc' },
      },
      _count: {
        select: { stops: true, expenses: true },
      },
    },
    orderBy: { startDate: 'desc' },
  });

  return NextResponse.json(trips);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const result = createTripSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.errors[0].message },
      { status: 400 }
    );
  }

  const { name, description, startDate, endDate, coverImage, budget } = result.data;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end < start) {
    return NextResponse.json(
      { error: 'End date must be after start date' },
      { status: 400 }
    );
  }

  const trip = await prisma.trip.create({
    data: {
      name,
      description,
      startDate: start,
      endDate: end,
      coverImage,
      budget,
      userId: session.user.id,
    },
  });

  return NextResponse.json(trip, { status: 201 });
}
