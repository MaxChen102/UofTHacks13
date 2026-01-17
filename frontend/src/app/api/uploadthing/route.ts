import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

export const runtime = "nodejs";
 
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  config: {
    isDev: process.env.NODE_ENV === "development",
    callbackUrl: process.env.NODE_ENV === "development" 
      ? "http://localhost:3000/api/uploadthing"
      : undefined,
  },
});
