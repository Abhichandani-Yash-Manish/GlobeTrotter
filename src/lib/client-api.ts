import type { ApiResult } from '@/types/domain';

export async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  const result = (await response.json()) as ApiResult<T>;
  if ('error' in result) throw new Error(result.error.message);
  return result.data;
}
