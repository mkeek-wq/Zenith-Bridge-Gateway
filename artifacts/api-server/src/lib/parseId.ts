export function parseId(id: string | string[] | undefined): number {
  if (Array.isArray(id)) id = id[0];
  const n = Number(id);
  if (!Number.isFinite(n)) {
    throw new Error("invalid_id");
  }
  return n;
}
