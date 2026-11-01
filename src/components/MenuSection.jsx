import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { MenuCard } from './MenuCard.jsx'
import { SectionBanner } from './SectionBanner.jsx'
import { Skeleton } from './ui'
import { db, collection, onSnapshot, query, where } from '../demo/store'

// One menu section: header plus its products (live from the demo store).
export const MenuSection = ({ children, desc, icon, onAddToCart, toppingsMap = {} }) => {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!children) return undefined
    return onSnapshot(
      query(collection(db, 'products'), where('section', '==', children)),
      (snapshot) => {
        setItems(
          snapshot.docs
            .map((d) => ({ id: d.data()?.id ?? d.id, docId: d.id, ...d.data() }))
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        )
        setIsLoading(false)
      },
      () => setIsLoading(false)
    )
  }, [children])

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pt-8 sm:px-6">
      <SectionBanner desc={desc} icon={icon} count={isLoading ? null : items.length}>{children}</SectionBanner>
      <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="flex gap-3 rounded-2xl border border-line bg-surface p-3 sm:flex-col sm:p-2">
                <Skeleton className="h-24 w-24 shrink-0 sm:aspect-[4/3] sm:h-auto sm:w-full" />
                <div className="flex-1 space-y-2 py-1 sm:px-2 sm:pb-3">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </li>
            ))
          : items.map((product) => {
              const availableToppings = Array.isArray(product.toppingIds)
                ? product.toppingIds.map((tid) => toppingsMap[tid]).filter(Boolean)
                : []
              return (
                <MenuCard
                  key={product.docId ?? product.id}
                  id={product.id}
                  name={product.name}
                  desc={product.desc}
                  long_desc={product.long_desc}
                  price={product.price}
                  image={product.image}
                  imageUrl={product.imageUrl}
                  icon={product.icon}
                  section={product.section}
                  isActive={product.isActive}
                  featured={product.featured || false}
                  popular={product.popular || false}
                  availableToppings={availableToppings}
                  optionGroups={Array.isArray(product.optionGroups) ? product.optionGroups : []}
                  onAddToCart={onAddToCart}
                />
              )
            })}
      </ul>
    </section>
  )
}

MenuSection.propTypes = {
  children: PropTypes.string.isRequired,
  desc: PropTypes.string,
  icon: PropTypes.string,
  onAddToCart: PropTypes.func,
  toppingsMap: PropTypes.object,
}
