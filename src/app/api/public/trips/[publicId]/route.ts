import { apiData, apiError } from '@/lib/api';
import { getPublicTripDetail } from '@/lib/trip-data';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ publicId: string }> },
) {
  const { publicId } = await params;
  const trip = await getPublicTripDetail(publicId);
  return trip
    ? apiData(trip)
    : apiError('NOT_FOUND', 'This shared trip is private or no longer available.', 404);
}
