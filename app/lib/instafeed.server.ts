/**
 * Server-only client for the Instafeed app's headless "Feed API"
 * (https://instafeed.nfcube.com/feed/v5) — the Shopify app already
 * installed and connected to @tiendafitness.co. Instafeed owns the actual
 * Instagram OAuth/token lifecycle on their side; this just reads the feed
 * they already keep in sync, so there's no Meta Developer App or access
 * token refresh job to build or maintain here.
 *
 * API key is a private Oxygen env var (INSTAFEED_API_KEY) — never expose
 * this in a PUBLIC_ var or client bundle.
 */

const INSTAFEED_ENDPOINT = 'https://instafeed.nfcube.com/feed/v5';

export interface InstagramPost {
  id: string;
  type: 'image' | 'video' | string;
  imageUrl?: string;
  permalink?: string;
  caption: string;
  likeCount: number;
  commentCount: number;
  createdAt?: number;
}

interface InstafeedRawPost {
  id: string;
  type?: string;
  images?: {standard_resolution?: {url?: string}};
  videos?: {standard_resolution?: {url?: string}};
  link?: string;
  caption?: {text?: string};
  likes?: {count?: number};
  comments?: {count?: number};
  created_time?: number;
}

interface InstafeedResponse {
  data?: InstafeedRawPost[];
}

export async function getInstagramFeed({
  apiKey,
  account,
  limit = 8,
}: {
  apiKey: string;
  account: string;
  limit?: number;
}): Promise<InstagramPost[]> {
  const url = `${INSTAFEED_ENDPOINT}?limit=${limit}&account=${encodeURIComponent(
    account,
  )}&fu=0&fid=0`;

  // Caching happens at the route loader (Cache-Control header), not here —
  // keeps this fetch portable and simple.
  const response = await fetch(url, {
    headers: {'X-API-Key': apiKey},
  });

  if (!response.ok) {
    throw new Error(
      `Instafeed API responded ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as InstafeedResponse;

  return (body.data ?? []).map((post) => ({
    id: post.id,
    type: post.type ?? 'image',
    // Every post type (including video) carries a standard_resolution image
    // — the poster frame for video — so this is always the right thumbnail.
    imageUrl: post.images?.standard_resolution?.url,
    permalink: post.link,
    caption: post.caption?.text ?? '',
    likeCount: post.likes?.count ?? 0,
    commentCount: post.comments?.count ?? 0,
    createdAt: post.created_time,
  }));
}
