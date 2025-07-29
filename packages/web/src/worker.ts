/**
 * This is a Cloudflare Worker script that handles `/api/` requests.
 * Currently, it redirects requests starting with `/api/` to a specified base URL of the backend.
 */

interface Env {
  API_BASE_URL?: string;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname, search } = url;

    if (pathname.startsWith("/api/")) {
      const base = env.API_BASE_URL || "http://localhost:3000";
      const pathnameWithoutApi = pathname.replace(/^\/api\//, "/");
      const destinationURL = `${base}${pathnameWithoutApi}${search}`;
      console.log(`Redirecting to: ${destinationURL}`);
      console.log(`Request: ${JSON.stringify(request)}`);
      const req = new Request(destinationURL, request);
      const res = await fetch(req);
      console.log(`Response: ${JSON.stringify(res)}`);
      return res;
    }

    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
