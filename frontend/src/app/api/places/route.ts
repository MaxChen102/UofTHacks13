import { NextResponse } from "next/server";

export const runtime = "nodejs";

type PlacesLookupRequest = {
  query: string;
};

type PlaceResult = {
  placeId: string;
  name: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  rating?: number;
  userRatingsTotal?: number;
  website?: string;
  phoneNumber?: string;
  googleMapsUrl?: string;
};

function getApiKey() {
  return process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
}

export async function POST(req: Request) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing GOOGLE_MAPS_API_KEY (or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)" },
      { status: 500 }
    );
  }

  let body: PlacesLookupRequest;
  try {
    body = (await req.json()) as PlacesLookupRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const query = body.query?.trim();
  if (!query) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  // Places API (New): https://places.googleapis.com/
  // We use a text search and return the top match.
  const fieldMask = [
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.location",
    "places.rating",
    "places.userRatingCount",
    "places.websiteUri",
    "places.nationalPhoneNumber",
    "places.googleMapsUri",
  ].join(",");

  const searchRes = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": fieldMask,
    },
    body: JSON.stringify({
      textQuery: query,
      maxResultCount: 1,
      languageCode: "en",
    }),
    cache: "no-store",
  });

  const searchJson = (await searchRes.json().catch(() => null)) as any;
  if (!searchRes.ok) {
    const err = searchJson?.error;
    return NextResponse.json(
      {
        error: "Google Places request failed",
        debug: err?.status ?? searchRes.status,
        message: err?.message,
      },
      { status: typeof err?.code === "number" ? err.code : 500 }
    );
  }

  const place = searchJson?.places?.[0];
  if (!place?.id) {
    return NextResponse.json({ error: "No place found for query" }, { status: 404 });
  }

  const loc = place?.location;
  const out: PlaceResult = {
    placeId: String(place.id),
    name: String(place?.displayName?.text ?? query),
    formattedAddress: String(place?.formattedAddress ?? ""),
    lat: Number(loc?.latitude ?? 0),
    lng: Number(loc?.longitude ?? 0),
    rating: typeof place?.rating === "number" ? place.rating : undefined,
    userRatingsTotal:
      typeof place?.userRatingCount === "number" ? place.userRatingCount : undefined,
    website: typeof place?.websiteUri === "string" ? place.websiteUri : undefined,
    phoneNumber:
      typeof place?.nationalPhoneNumber === "string" ? place.nationalPhoneNumber : undefined,
    googleMapsUrl: typeof place?.googleMapsUri === "string" ? place.googleMapsUri : undefined,
  };

  return NextResponse.json(out);
}

