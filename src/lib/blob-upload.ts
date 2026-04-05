/** Options for @vercel/blob `put`; token from `BLOB_READ_WRITE_TOKEN` env. */
export async function getBlobPutOptions(): Promise<{ token: string } | Record<string, never>> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (token) {
    return { token };
  }
  return {};
}
