/* eslint-disable react/prop-types */
// Divider between menu sections: two hairlines with the café's leaf + wheat
// mark in the middle. Decorative only.
export const SectionOrnament = () => (
  <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 pt-14 sm:px-6" aria-hidden="true">
    <span className="h-px flex-1 bg-line-strong" />
    <img src="/brand/hojas-mark-espresso.png" alt="" width="28" height="28" className="h-7 w-7 opacity-40" />
    <span className="h-px flex-1 bg-line-strong" />
  </div>
)
