// Decode HTML entities (&#038;, &amp;, &#8211;, etc.) that the WordPress
// REST API returns in title.rendered fields. Browser-side trick: write to a
// detached <textarea>, read back .value. Handles all named + numeric entities.
export function decodeHtml(text: string | undefined | null): string {
  if (!text) return ''
  const el = document.createElement('textarea')
  el.innerHTML = text
  return el.value
}
