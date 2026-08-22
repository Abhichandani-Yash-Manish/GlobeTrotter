import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { apiData, apiError, parseRequest } from '@/lib/api';
import { signupSchema } from '@/lib/validation';

export async function POST(request: Request) {
  const parsed = await parseRequest(request, signupSchema);
  if (parsed.response) return parsed.response;

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });
  if (existingUser) {
    return apiError('EMAIL_IN_USE', 'An account with this email already exists.', 409, {
      email: ['Use another email address or sign in.'],
    });
  }

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
    },
    select: { id: true, name: true, email: true },
  });

  return apiData(user, 201);
}
