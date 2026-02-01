// ============================================
// DISCOGRAPHY CONTROLLER
// Single traffic cop for ALL Spotify Cosmos/Platform calls
// Enforces strict phase machine to prevent 429 rate limits
// ============================================

type Phase = "IDLE" | "ARTISTVIEW" | "COOLDOWN" | "HYDRATING" | "DONE" | "ABORTED";

interface DiscographyRelease {
  id: string;
  name: string;
  release_date: string;
  album_type: string;
  uri: string;
  imageUrl: string;
}

// ============================================
// PHASE MACHINE STATE
// ============================================

let phase: Phase = "IDLE";
let activeArtistId: string | null = null;
let lastArtistId: string | null = null;

// ============================================
// CACHES
// ============================================

const discographyReleaseCache: Map<string, DiscographyRelease[]> = new Map();
const albumCache: Map<string, any> = new Map();
let currentReleases: DiscographyRelease[] = [];

// ============================================
// PHASE GUARD
// ============================================

function assertPhase(allowed: Phase[]): void {
  if (!allowed.includes(phase)) {
    throw new Error(`Invalid phase: ${phase}. Expected one of: ${allowed.join(", ")}`);
  }
}

// ============================================
// PHASE TRANSITIONS
// ============================================

function transitionPhase(newPhase: Phase): void {
  console.log(`[DiscographyController] Phase: ${phase} → ${newPhase}`);
  phase = newPhase;
}

function abortCurrentWork(): void {
  console.log(`[DiscographyController] ABORT triggered for artist: ${activeArtistId}`);
  transitionPhase("ABORTED");
  activeArtistId = null;
}

function reset(): void {
  console.log(`[DiscographyController] Reset to IDLE`);
  phase = "IDLE";
  activeArtistId = null;
}

// ============================================
// UTILITY HELPERS
// ============================================

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

function isRateLimitError(err: any): boolean {
  const status = err?.status || err?.response?.status || err?.statusCode;
  const message = (err?.message || "").toString();
  return status === 429 || message.includes("429") || message.toLowerCase().includes("rate");
}

// ============================================
// PHASE 1: ARTISTVIEW (Initial metadata fetch)
// ============================================

async function fetchArtistView(artistId: string): Promise<any> {
  assertPhase(["ARTISTVIEW"]);

  if (phase === "ABORTED") {
    console.log("[DiscographyController] Aborted during artistview");
    return null;
  }

  if (!Spicetify?.CosmosAsync?.get) {
    console.warn("[DiscographyController] CosmosAsync.get not available");
    return null;
  }

  try {
    const url = `https://spclient.wg.spotify.com/artistview/v1/artist/${artistId}?market=from_token&limit=200`;
    console.log(`[DiscographyController] Fetching ArtistView: ${url}`);

    const data = await Spicetify.CosmosAsync.get(url);

    if (phase === "ABORTED") {
      console.log("[DiscographyController] Aborted after artistview fetch");
      return null;
    }

    return data;
  } catch (error) {
    console.error("[DiscographyController] ArtistView fetch failed:", error);
    if (isRateLimitError(error)) {
      console.warn("[DiscographyController] 429 during ArtistView — aborting");
      transitionPhase("ABORTED");
    }
    return null;
  }
}

// ============================================
// RELEASE EXTRACTION (Deep search in object tree)
// ============================================

function normalizeReleaseItem(item: any): DiscographyRelease | null {
  if (!item) return null;

  const uri = item.uri || item?.link?.uri || item?.album?.uri || "";
  const idFromUri = typeof uri === "string" && uri.includes(":") ? uri.split(":").pop() : "";
  const id = item.id || idFromUri || "";

  let name = item.name || item.title || item.displayName || item.release_name || "";

  if (!name && typeof item === "object") {
    if (item.album?.name) name = item.album.name;
    else if (item.metadata?.name) name = item.metadata.name;
    else if (item.content?.name) name = item.content.name;
    else if (item.header?.title) name = item.header.title;
    else if (item.header?.subtitle) name = item.header.subtitle;
    else if (item.headerData?.title) name = item.headerData.title;
  }

  if (!id || !name) return null;

  const albumTypeRaw = (item.album_type || item.albumType || item.type || item.release_type || "")
    .toString()
    .toLowerCase();
  const isAlbumType = ["album", "single", "compilation", "appears_on", "ep"].includes(albumTypeRaw);
  const isAlbumUri = typeof uri === "string" && uri.includes("album");

  if (!isAlbumType && !isAlbumUri) return null;

  const releaseDate =
    item.release_date || item.releaseDate || item.release_date_iso || item.date || "";
  const images = item.images || item?.coverArt?.sources || item?.image?.sources || [];
  const imageUrl = images?.[0]?.url || images?.[0]?.uri || item?.image?.url || "";

  return {
    id,
    name,
    release_date: releaseDate,
    album_type: albumTypeRaw,
    uri: uri || (id ? `spotify:album:${id}` : ""),
    imageUrl,
  };
}

function collectReleasesDeep(
  value: any,
  releasesMap: Map<string, DiscographyRelease>,
  depth: number = 0,
): void {
  if (!value || depth > 10) return;

  if (Array.isArray(value)) {
    value.forEach((item) => collectReleasesDeep(item, releasesMap, depth + 1));
    return;
  }

  if (typeof value === "object") {
    const release = normalizeReleaseItem(value);
    if (release && !releasesMap.has(release.id)) {
      releasesMap.set(release.id, release);
    }
    Object.values(value).forEach((child) => collectReleasesDeep(child, releasesMap, depth + 1));
  }
}

// ============================================
// EXTENDED ARTIST ALBUMS (Paged fetch)
// ============================================

async function fetchArtistAlbumsPaged(
  artistId: string,
  releasesMap: Map<string, DiscographyRelease>,
  maxPages: number = 2,
): Promise<void> {
  if (!Spicetify?.CosmosAsync?.get) return;

  const limit = 50;
  let offset = 0;
  let page = 0;

  while (page < maxPages) {
    if (phase === "ABORTED") return;

    const url = `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single,compilation,appears_on&limit=${limit}&offset=${offset}`;
    try {
      console.log(`[DiscographyController] Fetching artist albums page ${page + 1}: ${url}`);
      const data = (await Spicetify.CosmosAsync.get(url)) as any;

      const items = Array.isArray(data?.items) ? data.items : [];
      if (items.length === 0) break;

      items.forEach((item: any) => {
        const release = normalizeReleaseItem(item);
        if (release && !releasesMap.has(release.id)) {
          releasesMap.set(release.id, release);
        }
      });

      if (!data?.next) break;

      page += 1;
      offset += limit;

      // Delay between pages to avoid rate limits
      await delay(5000);
    } catch (error) {
      console.error("[DiscographyController] Artist albums page fetch failed:", error);
      if (isRateLimitError(error)) {
        console.warn("[DiscographyController] 429 during artist albums paging — stopping");
      }
      break;
    }
  }
}

// ============================================
// PHASE 2: COOLDOWN (Hard wait before hydration)
// ============================================

async function cooldown(): Promise<void> {
  assertPhase(["COOLDOWN"]);

  console.log("[DiscographyController] Entering COOLDOWN (10s)...");
  const cooldownMs = 10000;
  const startTime = Date.now();

  while (Date.now() - startTime < cooldownMs) {
    if (phase === "ABORTED") {
      console.log("[DiscographyController] Cooldown interrupted by ABORT");
      return;
    }
    await delay(100);
  }

  console.log("[DiscographyController] Cooldown complete");
}

// ============================================
// PHASE 3: HYDRATION (Lazy album metadata fetch)
// ============================================

async function hydrateAlbumsBatch(
  albumIds: string[],
  batchSize: number = 5,
  delayMs: number = 900,
): Promise<void> {
  assertPhase(["HYDRATING"]);

  const missing = albumIds.filter((id) => !albumCache.has(id));

  if (missing.length === 0) {
    console.log("[DiscographyController] All albums already cached");
    return;
  }

  console.log(
    `[DiscographyController] Hydrating ${missing.length} albums in batches of ${batchSize}...`,
  );

  for (let i = 0; i < missing.length; i += batchSize) {
    // Check abort before each batch
    if (phase === "ABORTED") {
      console.log("[DiscographyController] Hydration stopped: ABORT signal");
      return;
    }

    const chunk = missing.slice(i, i + batchSize);
    const url = `https://api.spotify.com/v1/albums?ids=${chunk.join(",")}`;

    try {
      console.log(
        `[DiscographyController] Hydrating batch ${Math.floor(i / batchSize) + 1} (${chunk.length} albums)`,
      );
      const res = (await Spicetify.CosmosAsync.get(url)) as any;

      res?.albums?.forEach((album: any) => {
        if (album?.id) {
          albumCache.set(album.id, album);
        }
      });

      // Inter-batch delay
      await delay(delayMs);
    } catch (error) {
      if (isRateLimitError(error)) {
        console.warn("[DiscographyController] 429 during hydration — ABORT");
        transitionPhase("ABORTED");
        return;
      }
      console.error("[DiscographyController] Hydration batch failed:", error);
      return;
    }
  }

  console.log("[DiscographyController] Hydration complete");
}

// ============================================
// MAIN ORCHESTRATION
// ============================================

export async function fetchDiscographyForArtist(artistId: string): Promise<DiscographyRelease[]> {
  console.log(`[DiscographyController] fetchDiscographyForArtist called: ${artistId}`);

  // ❌ ABORT if this is a different artist
  if (activeArtistId && activeArtistId !== artistId) {
    console.log(
      `[DiscographyController] Artist changed from ${activeArtistId} to ${artistId} — aborting previous work`,
    );
    abortCurrentWork();
  }

  // ✅ Check cache first
  if (discographyReleaseCache.has(artistId)) {
    console.log(`[DiscographyController] Returning cached result for ${artistId}`);
    return discographyReleaseCache.get(artistId) || [];
  }

  // ❌ Already working on this artist
  if (activeArtistId === artistId && phase !== "IDLE" && phase !== "DONE") {
    console.log(`[DiscographyController] Already processing ${artistId}, returning current result`);
    return currentReleases;
  }

  // ============================================
  // START NEW PIPELINE
  // ============================================

  activeArtistId = artistId;
  reset();

  try {
    // ─────────────────────────────────────────
    // PASS 1: ArtistView (one call, fast)
    // ─────────────────────────────────────────

    transitionPhase("ARTISTVIEW");

    const artistViewData = await fetchArtistView(artistId);
    if (!artistViewData || phase === "ABORTED") {
      console.log("[DiscographyController] ArtistView failed or aborted");
      reset();
      return [];
    }

    // Extract album IDs from ArtistView
    const releasesMap = new Map<string, DiscographyRelease>();
    collectReleasesDeep(artistViewData, releasesMap);

    // Fetch additional albums via paged Web API to expand beyond ArtistView cap
    await fetchArtistAlbumsPaged(artistId, releasesMap, 2);

    if (releasesMap.size === 0) {
      console.log("[DiscographyController] No releases found in ArtistView");
      transitionPhase("DONE");
      reset();
      return [];
    }

    // Store as current result
    currentReleases = Array.from(releasesMap.values()).sort((a, b) =>
      b.release_date.localeCompare(a.release_date),
    );

    console.log(
      `[DiscographyController] ArtistView pass complete: ${currentReleases.length} releases`,
    );

    // ─────────────────────────────────────────
    // SKIP HYDRATION - Lazy load on demand
    // ─────────────────────────────────────────

    transitionPhase("DONE");
    console.log(
      `[DiscographyController] Pipeline complete (lazy hydration enabled): ${currentReleases.length} releases`,
    );

    // Cache result
    discographyReleaseCache.set(artistId, currentReleases);

    return currentReleases;
  } catch (error) {
    console.error("[DiscographyController] Unexpected error in pipeline:", error);
    transitionPhase("ABORTED");
    reset();
    return currentReleases;
  } finally {
    // Reset for next artist
    if (phase !== "ABORTED") {
      reset();
    }
  }
}

// ============================================
// LAZY HYDRATION (On-demand)
// ============================================

export async function hydrateAlbumDetails(albumId: string): Promise<DiscographyRelease | null> {
  console.log(`[DiscographyController] Hydrating album on-demand: ${albumId}`);

  // Check cache first
  if (albumCache.has(albumId)) {
    const cached = albumCache.get(albumId);
    return {
      id: albumId,
      name: cached.name || albumId,
      release_date: cached.release_date || "",
      album_type: cached.album_type || "",
      uri: `spotify:album:${albumId}`,
      imageUrl: cached.images?.[0]?.url || "",
    };
  }

  // Long delay before fetching (30 seconds to avoid rate limits)
  console.log("[DiscographyController] Waiting 30s before fetching album details...");
  await delay(30000);

  if (!Spicetify?.CosmosAsync?.get) {
    console.warn("[DiscographyController] CosmosAsync.get not available");
    return null;
  }

  try {
    const url = `https://api.spotify.com/v1/albums/${albumId}`;
    console.log(`[DiscographyController] Fetching album details: ${url}`);

    const album = await Spicetify.CosmosAsync.get(url);

    if (album) {
      albumCache.set(albumId, album);
      console.log(`[DiscographyController] ✅ Hydrated: ${album.name}`);

      return {
        id: albumId,
        name: album.name || albumId,
        release_date: album.release_date || "",
        album_type: album.album_type || "",
        uri: album.uri || `spotify:album:${albumId}`,
        imageUrl: album.images?.[0]?.url || "",
      };
    }
  } catch (error) {
    console.error("[DiscographyController] Album hydration failed:", error);
    if (isRateLimitError(error)) {
      console.warn("[DiscographyController] 429 on album fetch — will retry on next click");
    }
  }

  return null;
}

// ============================================
// ABORT SIGNAL (call when navigating away)
// ============================================

export function abortDiscographyFetch(): void {
  if (phase !== "IDLE" && phase !== "DONE") {
    abortCurrentWork();
  }
}

// ============================================
// STATUS QUERY
// ============================================

export function getDiscographyStatus(): {
  phase: Phase;
  artistId: string | null;
  releasesCount: number;
} {
  return {
    phase,
    artistId: activeArtistId,
    releasesCount: currentReleases.length,
  };
}
