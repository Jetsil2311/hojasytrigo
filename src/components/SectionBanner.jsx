/* eslint-disable react/prop-types */
import { ProductIcon } from './ProductArt'

// Section heading: a stamped icon, the wide uppercase name, a short mood line
// and the product count.
export const SectionBanner = ({ children, desc, icon, count }) => (
  <header className="flex items-end justify-between gap-4">
    <div className="flex min-w-0 items-start gap-4">
      {icon && (
        <span className="mt-0.5 hidden h-14 w-14 shrink-0 items-center justify-center rounded-full border border-dashed border-accent/60 bg-accent-soft text-accent-ink sm:flex" aria-hidden="true">
          <ProductIcon name={icon} size={24} strokeWidth={1.75} />
        </span>
      )}
      <div className="min-w-0">
        <h2 className="font-wide text-balance font-display text-2xl font-extrabold uppercase leading-[1.05] tracking-tight text-primary sm:text-3xl">{children}</h2>
        {desc && <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-muted sm:text-base">{desc}</p>}
      </div>
    </div>
    {count !== null && count !== undefined && (
      <span className="tabular hidden shrink-0 rounded-full border border-line-strong px-3 py-1 text-xs font-semibold text-muted sm:block">
        {count} {count === 1 ? 'producto' : 'productos'}
      </span>
    )}
  </header>
)
