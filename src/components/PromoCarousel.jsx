import PropTypes from 'prop-types'
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Plus } from 'lucide-react'
import { db, collection, onSnapshot } from '../demo/store'
import { ProductArt } from './ProductArt'
import { formatMoney } from '../utils/cart'
import { cx } from './ui'

// "Recomendados" strip: active carousel slides from the admin, each linked to
// a product. Tapping a card goes through the same addToCart flow as the menu.
export const PromoCarousel = ({ onAddToCart, toppingsMap = {} }) => {
  const [slides, setSlides] = useState([])
  const [productMap, setProductMap] = useState({})
  const trackRef = useRef(null)
  const [edges, setEdges] = useState({ start: true, end: false })

  useEffect(() => {
    const unsubSlides = onSnapshot(collection(db, 'carousel'), (snap) => {
      setSlides(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((s) => s.active === true || s.isActive === true)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      )
    })
    const unsubProducts = onSnapshot(collection(db, 'products'), (snap) => {
      const map = {}
      snap.docs.forEach((d) => { map[d.id] = { id: d.data().id ?? d.id, ...d.data() } })
      setProductMap(map)
    })
    return () => { unsubSlides(); unsubProducts() }
  }, [])

  const visibleSlides = slides.filter((s) => productMap[s.linkedId] && productMap[s.linkedId].isActive !== false)

  const updateEdges = () => {
    const el = trackRef.current
    if (!el) return
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 })
  }

  useEffect(updateEdges, [visibleSlides.length])

  const scrollBy = (dir) => {
    const el = trackRef.current
    if (!el) return
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.8, 640), behavior: 'smooth' })
  }

  const triggerAdd = (slide, artEl) => {
    const p = productMap[slide.linkedId]
    if (!p) return
    onAddToCart?.({
      id: p.id,
      name: p.name,
      price: p.price,
      desc: p.desc,
      long_desc: p.long_desc,
      image: p.image,
      imageUrl: p.imageUrl,
      icon: p.icon,
      section: p.section,
      fromRect: artEl?.getBoundingClientRect() ?? null,
      flyImageSrc: p.imageUrl || null,
      optionGroups: Array.isArray(p.optionGroups) ? p.optionGroups : [],
      availableToppings: (p.toppingIds || []).map((tid) => toppingsMap[tid]).filter(Boolean),
    })
  }

  if (visibleSlides.length === 0) return null

  return (
    <section aria-labelledby="recomendados" className="mx-auto max-w-6xl pt-8">
      <div className="flex items-end justify-between gap-4 px-4 sm:px-6">
        <div>
          <p className="font-script text-2xl leading-none text-accent-ink" aria-hidden="true">Algo que quizás te guste…</p>
          <h2 id="recomendados" className="font-wide mt-1 font-display text-xl font-extrabold uppercase tracking-tight text-primary sm:text-2xl">
            Recomendados de la casa
          </h2>
        </div>
        {!(edges.start && edges.end) && (
          <div className="hidden gap-2 sm:flex">
            <button type="button" onClick={() => scrollBy(-1)} disabled={edges.start} aria-label="Anteriores" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line-strong bg-surface text-ink transition hover:bg-surface-2 disabled:opacity-30">
              <ArrowLeft size={18} />
            </button>
            <button type="button" onClick={() => scrollBy(1)} disabled={edges.end} aria-label="Siguientes" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line-strong bg-surface text-ink transition hover:bg-surface-2 disabled:opacity-30">
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>

      <ul
        ref={trackRef}
        onScroll={updateEdges}
        className="mt-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:scroll-px-6 scrollbar-hide sm:gap-4 sm:px-6"
      >
        {visibleSlides.map((slide, i) => (
          <SlideCard key={slide.id} slide={slide} product={productMap[slide.linkedId]} index={i} onAdd={triggerAdd} />
        ))}
      </ul>
    </section>
  )
}

const SlideCard = ({ slide, product, index, onAdd }) => {
  const artRef = useRef(null)
  // Three tones in turn: espresso, sage, cream.
  const tone = ['dark', 'sage', 'cream'][index % 3]
  const dark = tone === 'dark'
  return (
    <li className="w-[78%] shrink-0 snap-start sm:w-[340px]">
      <button
        type="button"
        onClick={() => onAdd(slide, artRef.current)}
        className={cx(
          'group flex h-full w-full items-stretch gap-4 rounded-3xl p-3 pr-4 text-left transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.99]',
          tone === 'dark' && 'bg-primary text-on-primary',
          tone === 'sage' && 'bg-secondary text-on-secondary',
          tone === 'cream' && 'border border-line bg-surface text-ink',
        )}
      >
        <ProductArt ref={artRef} product={slide.imageUrl ? { ...product, imageUrl: slide.imageUrl } : product} className="h-28 w-28 shrink-0" rounded="rounded-2xl" iconSize={44} />
        <div className="flex min-w-0 flex-1 flex-col py-1">
          <p className={cx('font-script text-xl leading-none', dark ? 'text-brand-terracotta' : 'text-accent-ink')}>{slide.altText || 'Recomendado'}</p>
          <p className="mt-1.5 font-display text-lg font-bold leading-tight">{product.name}</p>
          <div className="mt-auto flex items-center justify-between pt-2">
            <span className="tabular font-display text-lg font-extrabold">{formatMoney(Number(product.price))}</span>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent text-on-accent transition-transform group-hover:scale-105">
              <Plus size={18} strokeWidth={2.5} />
            </span>
          </div>
        </div>
      </button>
    </li>
  )
}

SlideCard.propTypes = {
  slide: PropTypes.object.isRequired,
  product: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  onAdd: PropTypes.func.isRequired,
}

PromoCarousel.propTypes = {
  onAddToCart: PropTypes.func,
  toppingsMap: PropTypes.object,
}
