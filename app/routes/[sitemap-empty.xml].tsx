export async function loader() {
  return new Response(
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
</urlset>`,
    {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': `max-age=${60 * 60 * 24}`,
      },
    },
  );
}
