// Feature flags — compile-time switches for parts of the site that exist in
// code but aren't ready for visitors. Flip a flag to true to bring the
// feature back; nothing else needs to change.
export const FEATURES = {
  // Blog: hidden until there's content worth showing. Hides the nav links
  // and the home-page "Latest Posts" section, and redirects /blog home.
  blog: false,
} as const
