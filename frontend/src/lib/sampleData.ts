export type RecentItem = {
  id: string;
  title: string;
  emoji: string;
  timeAgo: string;
  imageUrl: string;
};

export type PinLink = {
  id: string;
  emoji: string;
  title: string;
  href: string;
  actionLabel?: string; // defaults to "↗ Open Link"
};

export type PinLocation = {
  name: string;
  description: string;
  address: string;
  directionsHref: string;
  mapEmbedSrc?: string;
  placeId?: string;
  lat?: number;
  lng?: number;
  googleRating?: number;
  userRatingsTotal?: number;
  website?: string;
  phoneNumber?: string;
  googleMapsUrl?: string;
};

export type Pin = {
  id: string;
  title: string;
  emoji: string;
  aiSummary?: string;
  aiSuggestedRating?: number;
  aiDescription?: string;
  links: PinLink[];
  notes: string;
  location: PinLocation;
  sourceImageUrl: string;
};

export type ListItem = {
  id: string;
  name: string;
  savesLabel: string; // e.g. "📌 10 saves"
};

export const recentItems: RecentItem[] = [
  {
    id: "alo",
    title: "Alo Restaurant",
    emoji: "🍽️",
    timeAgo: "48 min ago",
    imageUrl: "https://www.figma.com/api/mcp/asset/d8901bac-db9e-413b-af94-7c2e712cc672",
  },
  {
    id: "pai",
    title: "Pai Northern Thai Kitchen",
    emoji: "🍜",
    timeAgo: "2 hr ago",
    imageUrl: "https://www.figma.com/api/mcp/asset/e224ce08-1be5-4b3c-aa62-f032c97ee5bb",
  },
  {
    id: "canoe",
    title: "Canoe Restaurant & Bar",
    emoji: "🏙️",
    timeAgo: "5 hr ago",
    imageUrl: "https://www.figma.com/api/mcp/asset/dc59625a-abda-49ac-9494-8a4a3d144759",
  },
  {
    id: "richmond",
    title: "Richmond Station",
    emoji: "🍔",
    timeAgo: "8 hr ago",
    imageUrl: "https://www.figma.com/api/mcp/asset/66bb39d3-aa5d-40af-a15d-385b6704d7b1",
  },
  {
    id: "byblos",
    title: "Byblos",
    emoji: "🥙",
    timeAgo: "12 hr ago",
    imageUrl: "https://www.figma.com/api/mcp/asset/6ad61581-cf42-468c-8451-c7b96671b488",
  },
];

export const lists: ListItem[] = [
  { id: "all-saves", name: "All Saves", savesLabel: "📌 10 saves" },
];

export const pins: Pin[] = [
  {
    id: "alo",
    title: "Alo Restaurant",
    emoji: "🍽️",
    aiSummary:
      "Upscale French fine dining with tasting menus and a polished, special-occasion vibe. Book ahead and expect a more formal dress code.",
    aiSuggestedRating: 4.6,
    aiDescription:
      "A polished tasting-menu experience with top-tier service and a special-occasion vibe. Best if you plan ahead and enjoy fine dining.",
    links: [
      {
        id: "reserve",
        emoji: "📅",
        title: "Make Reservation",
        href: "https://www.alorestaurant.com/",
      },
      {
        id: "menu",
        emoji: "📋",
        title: "View Menu",
        href: "https://www.alorestaurant.com/menu",
      },
      {
        id: "reviews",
        emoji: "⭐",
        title: "Read Reviews",
        href: "https://www.google.com/search?q=Alo+Restaurant+reviews",
      },
    ],
    notes:
      "Upscale French fine dining with tasting menus. Requires reservations months in advance. Dress code enforced.",
    location: {
      name: "Alo Restaurant",
      description:
        "Contemporary French cuisine in an elegant setting with panoramic city views from the 3rd floor.",
      address: "163 Spadina Ave 3rd Floor, Toronto, ON M5V 2L6",
      directionsHref:
        "https://www.google.com/maps/search/?api=1&query=163%20Spadina%20Ave%203rd%20Floor%2C%20Toronto%2C%20ON%20M5V%202L6",
      // Optional: set this once you have a Google Maps Embed API key wired
      mapEmbedSrc: "",
    },
    sourceImageUrl:
      "https://www.figma.com/api/mcp/asset/99fa7836-5832-406f-af04-dad5f3756790",
  },
];

export function getPinById(id: string): Pin | undefined {
  return pins.find((p) => p.id === id);
}
