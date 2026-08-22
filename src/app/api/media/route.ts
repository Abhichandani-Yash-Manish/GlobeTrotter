import sharp from 'sharp';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { apiData, apiError } from '@/lib/api';
import { mediaMetadataSchema } from '@/lib/validation';

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to upload an image.', 401);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return apiError('INVALID_FORM', 'Upload a JPEG, PNG, or WebP image.', 400);
  }
  const file = formData.get('file');
  const metadata = mediaMetadataSchema.safeParse({ altText: formData.get('altText') });
  if (!(file instanceof File)) return apiError('FILE_REQUIRED', 'Choose an image to upload.', 400);
  if (!metadata.success) return apiError('INVALID_ALT_TEXT', 'Add a short image description.', 400);
  if (!ALLOWED_TYPES.has(file.type)) return apiError('INVALID_FILE_TYPE', 'Use a JPEG, PNG, or WebP image.', 415);
  if (file.size > MAX_UPLOAD_BYTES) return apiError('FILE_TOO_LARGE', 'Images must be 2 MB or smaller.', 413);

  try {
    const input = Buffer.from(await file.arrayBuffer());
    const decoded = sharp(input, { failOn: 'error' }).rotate().resize({ width: 1800, height: 1200, fit: 'inside', withoutEnlargement: true });
    const info = await decoded.metadata();
    if (!['jpeg', 'png', 'webp'].includes(info.format ?? '')) {
      return apiError('INVALID_IMAGE', 'The file contents do not match a supported image.', 415);
    }
    const bytes = await decoded.webp({ quality: 82 }).toBuffer();
    const finalInfo = await sharp(bytes).metadata();
    const asset = await prisma.mediaAsset.create({
      data: {
        ownerId: session.user.id,
        mimeType: 'image/webp',
        bytes,
        width: finalInfo.width ?? 0,
        height: finalInfo.height ?? 0,
        size: bytes.byteLength,
        altText: metadata.data.altText,
      },
      select: { id: true, width: true, height: true, size: true, altText: true },
    });
    return apiData({ ...asset, url: `/api/media/${asset.id}` }, 201);
  } catch {
    return apiError('INVALID_IMAGE', 'This image could not be decoded.', 415);
  }
}

