export function marketImageSrc(marketId: string): string {
  return `/api/polymarket/markets/${marketId}/image`
}

export function userAvatarSrc(userId: string): string {
  return `/api/polymarket/users/${userId}/avatar`
}
