// Plain text of an HTML fragment, for the excerpt and content fields the
// WordPress REST API returns as rendered HTML. The browser parses the markup
// into a detached document (nothing in it runs or loads) and we read back
// its text, so tags are removed and entities (&amp;, &#8217;, &hellip;) are
// decoded in one step. A regex cannot do this reliably.
export function stripHtml(html: string | undefined | null): string {
  if (!html) return ''
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent ?? ''
}
