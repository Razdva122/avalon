# Material Icons subset

`material-icons.woff2` is a subset of the installed
`material-design-icons-iconfont` font, licensed under the adjacent Apache license.
The generated `../../styles/material-icons.css` preserves ligatures and icon-name
pseudo-element classes, including Vuetify's Material Design aliases. Fixed icon
boxes reserve layout space while the font loads.

Normal builds need no font tooling. When source icon names or Vuetify aliases
change, run the optional regeneration commands documented at the top of
`packages/ui/scripts/subset-material-icons.py` from the repository root. The
script scans source tokens conservatively with the shared Node scanner, excludes
comments using the installed Vue/TypeScript parsers, subsets the font, and uses
HarfBuzz to verify that every retained name and codepoint shape to the same glyph.
Names must occur literally in source; use complete names in a lookup table
instead of constructing them from fragments.

`node --test packages/ui/scripts/material-icons.test.cjs` checks coverage against
current source and Vuetify without Python dependencies. The original font was
125,116 bytes; this subset is 13,128 bytes (89.5% smaller).
