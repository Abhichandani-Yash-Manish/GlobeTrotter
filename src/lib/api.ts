import { NextResponse } from 'next/server';
import type { ZodType } from 'zod';
import type { ApiResult } from '@/types/domain';

export function apiData<T>(data: T, status = 200): NextResponse<ApiResult<T>> {
  return NextResponse.json({ data }, { status });
}

export function apiError(
  code: string,
  message: string,
  status: number,
  fields?: Record<string, string[]>,
): NextResponse<ApiResult<never>> {
  return NextResponse.json(
    { error: { code, message, ...(fields ? { fields } : {}) } },
    { status },
  );
}

type ParsedRequest<T> =
  | { data: T; response?: never }
  | { data?: never; response: NextResponse<ApiResult<never>> };

export async function parseRequest<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<ParsedRequest<T>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      response: apiError('MALFORMED_JSON', 'The request body must be valid JSON.', 400),
    };
  }

  const result = schema.safeParse(body);
  if (result.success) return { data: result.data };

  const fields: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || 'form';
    fields[key] = [...(fields[key] ?? []), issue.message];
  }

  return {
    response: apiError(
      'VALIDATION_ERROR',
      result.error.issues[0]?.message ?? 'Please check the submitted values.',
      400,
      fields,
    ),
  };
}
