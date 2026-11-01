/* eslint-disable react/prop-types */
import { SearchX } from 'lucide-react'
import { MenuSection } from './MenuSection'
import { SectionOrnament } from './SectionOrnament'
import { EmptyState, Skeleton } from './ui'

// Renders the visible sections with loading, error and empty states.
export const SectionsList = ({ isLoading, error, sections, onAddToCart, toppingsMap = {} }) => {
  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 pt-10 sm:px-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
        <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
        <div className="rounded-2xl bg-danger-soft px-5 py-4 text-sm font-medium text-danger">{error}</div>
      </div>
    )
  }

  if (!sections.length) {
    return (
      <EmptyState
        icon={SearchX}
        title="Aquí todavía no hay nada"
        text="Esta categoría no tiene secciones visibles. Actívalas desde el panel de administración."
      />
    )
  }

  return sections.map((section, i) => (
    <div key={section.docId ?? section.id} id={`section-${section.name}`} data-section-anchor={section.name} data-reveal>
      {i > 0 && <SectionOrnament />}
      <MenuSection desc={section.desc} icon={section.icon} onAddToCart={onAddToCart} toppingsMap={toppingsMap}>
        {section.name}
      </MenuSection>
    </div>
  ))
}
