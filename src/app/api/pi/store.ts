// Shared in-memory store for dev-only session data

export interface StoredPhoto {
  base64: string
  ts: number
  name?: string
}

export const photoStore: Record<string, StoredPhoto> = {}


