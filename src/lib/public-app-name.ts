export const DEFAULT_PUBLIC_APP_NAME = 'Trade Nova';

export function getPublicAppName(): string {
  return process.env.NEXT_PUBLIC_APP_NAME?.trim() || DEFAULT_PUBLIC_APP_NAME;
}

export function withAppName(text: string, appName: string): string {
  return text.replaceAll('{appName}', appName);
}
