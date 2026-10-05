const allowlist = {
  allowed_urls: [
    "https://github.com",
    "https://www.youtube.com",
    "https://en.wikipedia.org",
  ],
  description: "These are the URLs currently allowed for users to add.",
  rules: {
    format: "exact_origin",
    user_additions: "Only add trusted URLs after review.",
  },
}

export function GET() {
  return Response.json(allowlist, {
    headers: {
      "Cache-Control": "no-store",
    },
  })
}
