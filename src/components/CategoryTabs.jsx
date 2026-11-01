import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { cx } from './ui'

// Sticky section tabs under the top bar. Highlights the section in view and
// keeps the active tab scrolled into sight on narrow screens.
export const CategoryTabs = ({ sections, activeSection, onTabClick }) => {
  const scrollerRef = useRef(null)

  useEffect(() => {
    // Scroll only the tab strip (not the page) so it never fights the
    // smooth page scroll started by a tab click.
    const scroller = scrollerRef.current
    const el = scroller?.querySelector('[aria-selected="true"]')
    if (!scroller || !el) return
    const left = el.offsetLeft - scroller.clientWidth / 2 + el.clientWidth / 2
    scroller.scrollTo({ left, behavior: 'smooth' })
  }, [activeSection])

  if (!sections || sections.length === 0) return null

  return (
    <div className="sticky top-16 z-30 border-b border-line/70 bg-bg/85 backdrop-blur-md">
      <div
        ref={scrollerRef}
        className="relative mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-4 py-2.5 scrollbar-hide sm:px-6"
        role="tablist"
        aria-label="Secciones del menú"
      >
        {sections.map((section) => {
          const isActive = activeSection === section.name
          return (
            <button
              key={section.docId ?? section.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabClick(section.name)}
              className={cx(
                'h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors duration-200',
                isActive ? 'bg-accent text-on-accent' : 'border border-line-strong text-muted hover:border-accent hover:text-ink',
              )}
            >
              {section.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}

CategoryTabs.propTypes = {
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      docId: PropTypes.string,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  activeSection: PropTypes.string,
  onTabClick: PropTypes.func.isRequired,
}
