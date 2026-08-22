import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { apiData, apiError, parseRequest } from '@/lib/api';
import { requireTripAccess } from '@/lib/trip-access';
import { createOpaqueToken } from '@/lib/tokens';
import { inviteSchema } from '@/lib/validation';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to manage invites.', 401);
  const { id } = await params;
  const permission = await requireTripAccess(session.user.id, id, 'owner');
  if (!permission.allowed) return apiError('FORBIDDEN', 'Only the trip owner can manage invites.', 403);
  const invites = await prisma.tripInvite.findMany({
    where: { tripId: id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, role: true, expiresAt: true, acceptedAt: true, revokedAt: true, createdAt: true },
  });
  return apiData(invites);
}

export async function POST(request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to invite a collaborator.', 401);
  const { id } = await params;
  const permission = await requireTripAccess(session.user.id, id, 'owner');
  if (!permission.allowed) return apiError('FORBIDDEN', 'Only the trip owner can invite collaborators.', 403);
  const parsed = await parseRequest(request, inviteSchema);
  if (parsed.response) return parsed.response;

  const { token, tokenHash } = createOpaqueToken();
  const invite = await prisma.tripInvite.create({
    data: {
      tripId: id,
      creatorId: session.user.id,
      tokenHash,
      role: parsed.data.role,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    select: { id: true, role: true, expiresAt: true },
  });
  const inviteUrl = new URL(`/invites/${token}`, request.url).toString();
  return apiData({ ...invite, inviteUrl }, 201);
}

