/**
 * Usage (PowerShell):
 *   $env:GOOGLE_MAPS_API_KEY="YOUR_KEY"
 *   node scripts/testPlaces.mjs "Nobu"
 *
 * This hits the local Next.js route: POST http://localhost:3000/api/places
 * so make sure `npm run dev` is running in `frontend/`.
 */

const query = process.argv.slice(2).join(" ").trim();
if (!query) {
  console.error('Please provide a query, e.g. node scripts/testPlaces.mjs "Nobu"');
  process.exit(1);
}

async function main() {
  const res = await fetch("http://localhost:3000/api/places", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  const json = await res.json().catch(() => null);
  console.log("");
  console.log("=== Vibely Places Lookup ===");
  console.log("query:", query);
  console.log("status:", res.status);

  if (!res.ok) {
    console.log("");
    console.log("error:", json?.error ?? "(no error message)");
    if (json?.debug) console.log("debug:", json.debug);
    if (json?.message) console.log("message:", json.message);
    if (
      typeof json?.error === "string" &&
      json.error.includes("Missing GOOGLE_MAPS_API_KEY")
    ) {
      console.log("");
      console.log("Fix:");
      console.log(
        '  In PowerShell, set the key in the SAME terminal you run `npm run dev` (example script: scripts/set-maps-env.example.ps1)'
      );
      console.log(
        '  Then rerun: node scripts/testPlaces.mjs "Nobu"'
      );
    }
    if (json?.debug === "REQUEST_DENIED") {
      console.log("");
      console.log("Common causes:");
      console.log("  - Places API not enabled for your Google Cloud project");
      console.log("  - Billing not enabled");
      console.log("  - API key restrictions block Places (or referrer/IP restrictions)");
      console.log("");
      console.log("Try a more specific query too, e.g. \"Nobu Toronto\".");
    }
    console.log("");
    console.log("raw:", JSON.stringify(json, null, 2));
    console.log("");
    process.exit(1);
  }

  console.log("");
  console.log("name:", json?.name ?? "");
  console.log("placeId:", json?.placeId ?? "");
  console.log("address:", json?.formattedAddress ?? "");
  console.log("lat,lng:", `${json?.lat ?? ""}, ${json?.lng ?? ""}`);
  if (typeof json?.rating === "number") {
    const total = typeof json?.userRatingsTotal === "number" ? json.userRatingsTotal : "";
    console.log("google rating:", `${json.rating}${total !== "" ? ` (${total} reviews)` : ""}`);
  }
  if (json?.website) console.log("website:", json.website);
  if (json?.phoneNumber) console.log("phone:", json.phoneNumber);
  if (json?.googleMapsUrl) console.log("maps url:", json.googleMapsUrl);
  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

