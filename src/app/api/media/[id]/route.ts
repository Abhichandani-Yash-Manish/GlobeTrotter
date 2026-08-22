import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { apiError } from '@/lib/api';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const [session, asset] = await Promise.all([auth(), prisma.mediaAsset.findUnique({ where: { id } })]);
  if (!asset) return apiError('NOT_FOUND', 'Image not found.', 404);

  const path = `/api/media/${id}`;
  const viewerId = session?.user?.id;
  const mayRead =
    viewerId === asset.ownerId ||
    (await prisma.trip.count({
      where: {
        OR: [
          { isPublic: true, OR: [{ coverImage: path }, { user: { avatar: path } }] },
          ...(viewerId ? [{ coverImage: path, OR: [{ userId: viewerId }, { members: { some: { userId: viewerId } } }] }] : []),
        ],
      },
    })) > 0;
  if (!mayRead) return apiError('NOT_FOUND', 'Image not found.', 404);

  return new Response(asset.bytes, {
    headers: {
      'Content-Type': asset.mimeType,
      'Content-Length': String(asset.size),
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
