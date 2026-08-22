import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { apiData, apiError, parseRequest } from '@/lib/api';
import { savedDestinationSchema } from '@/lib/validation';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to view saved destinations.', 401);
  const saved = await prisma.savedDestination.findMany({
    where: { userId: session.user.id },
    include: { city: true },
    orderBy: { createdAt: 'desc' },
  });
  return apiData(saved.map((item) => item.city));
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to save a destination.', 401);
  const parsed = await parseRequest(request, savedDestinationSchema);
  if (parsed.response) return parsed.response;
  const city = await prisma.city.findUnique({ where: { id: parsed.data.cityId }, select: { id: true } });
  if (!city) return apiError('NOT_FOUND', 'Destination not found.', 404);
  await prisma.savedDestination.upsert({
    where: { userId_cityId: { userId: session.user.id, cityId: city.id } },
    create: { userId: session.user.id, cityId: city.id },
    update: {},
  });
  return apiData({ cityId: city.id, saved: true }, 201);
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to update saved destinations.', 401);
  const parsed = await parseRequest(request, savedDestinationSchema);
  if (parsed.response) return parsed.response;
  await prisma.savedDestination.deleteMany({
    where: { userId: session.user.id, cityId: parsed.data.cityId },
  });
  return apiData({ cityId: parsed.data.cityId, saved: false });
}
