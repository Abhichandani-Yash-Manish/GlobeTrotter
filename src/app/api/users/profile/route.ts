import type { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { apiData, apiError, parseRequest } from '@/lib/api';
import { deleteAccountSchema, profileSchema } from '@/lib/validation';

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  role: true,
  language: true,
  defaultPrivacy: true,
  createdAt: true,
  _count: { select: { trips: true, savedDestinations: true } },
} satisfies Prisma.UserSelect;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to view your profile.', 401);
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: safeUserSelect });
  return user ? apiData(user) : apiError('NOT_FOUND', 'User not found.', 404);
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to update your profile.', 401);
  const parsed = await parseRequest(request, profileSchema);
  if (parsed.response) return parsed.response;

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return apiError('NOT_FOUND', 'User not found.', 404);
  if (parsed.data.newPassword && !parsed.data.currentPassword) {
    return apiError('PASSWORD_REQUIRED', 'Enter your current password before choosing a new one.', 400);
  }
  if (
    parsed.data.newPassword &&
    parsed.data.currentPassword &&
    !(await bcrypt.compare(parsed.data.currentPassword, user.passwordHash))
  ) {
    return apiError('INVALID_PASSWORD', 'Current password is incorrect.', 400);
  }
  if (parsed.data.email && parsed.data.email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) return apiError('EMAIL_IN_USE', 'That email address is already in use.', 409);
  }

  const data: Prisma.UserUpdateInput = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.email !== undefined) data.email = parsed.data.email;
  if (parsed.data.avatar !== undefined) data.avatar = parsed.data.avatar;
  if (parsed.data.language !== undefined) data.language = parsed.data.language;
  if (parsed.data.defaultPrivacy !== undefined) data.defaultPrivacy = parsed.data.defaultPrivacy;
  if (parsed.data.newPassword) data.passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: safeUserSelect,
  });
  return apiData(updated);
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to delete your account.', 401);
  const parsed = await parseRequest(request, deleteAccountSchema);
  if (parsed.response) return parsed.response;
  await prisma.user.delete({ where: { id: session.user.id } });
  return apiData({ deleted: true });
}
