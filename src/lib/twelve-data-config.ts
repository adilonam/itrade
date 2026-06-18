export const TWELVE_DATA_SERVER_KEY_ENV = 'TWELVE_DATA_API_KEY';
export const TWELVE_DATA_PUBLIC_KEY_ENV = 'NEXT_PUBLIC_TWELVE_DATA_API_KEY';

export function getTwelveDataServerApiKey(): string | null {
  const key = process.env.TWELVE_DATA_API_KEY?.trim();
  return key && key.length > 0 ? key : null;
}

export function getTwelveDataPublicApiKey(): string | null {
  const key = process.env.NEXT_PUBLIC_TWELVE_DATA_API_KEY?.trim();
  return key && key.length > 0 ? key : null;
}

export function requireTwelveDataServerApiKey(): string {
  const key = getTwelveDataServerApiKey();
  if (!key) {
    throw new Error(
      `${TWELVE_DATA_SERVER_KEY_ENV} is not set. Add it to your .env file.`
    );
  }
  return key;
}
