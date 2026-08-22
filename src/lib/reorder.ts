export function validateExactReorder(orderedIds: string[], ownedIds: string[]): string | null {
  if (new Set(orderedIds).size !== orderedIds.length) {
    return 'Each item must appear exactly once.';
  }
  const owned = new Set(ownedIds);
  if (orderedIds.length !== owned.size || orderedIds.some((id) => !owned.has(id))) {
    return 'The reorder list must contain every owned item exactly once.';
  }
  return null;
}
