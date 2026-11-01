import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router'
import { AtSign, Bike, Check, ChefHat, Clock, Coffee, MapPin, Moon, PawPrint, Wheat } from 'lucide-react'
import { BrandSeal } from '../components/BrandSeal'
import { Navbar, CategorySwitch } from '../components/Navbar'
import { PromoCarousel } from '../components/PromoCarousel'
import { CartButton } from '../components/CartButton'
import { CartOverlay } from '../components/CartOverlay'
import { ToppingsOverlay } from '../components/ToppingsOverlay'
import { BottomSheet } from '../components/BottomSheet'
import { PromoBanner } from '../components/PromoBanner'
import { SectionsList } from '../components/SectionsList'
import { CategoryTabs } from '../components/CategoryTabs'
import { Toast } from '../components/ui'
import { DemoGuide } from '../components/DemoGuide'
import { db, addDoc, collection, onSnapshot, serverTimestamp } from '../demo/store'
import { usePromotion } from '../hooks/usePromotion'
import { useSections } from '../hooks/useSections'
import { useSettings } from '../hooks/useSettings'
import { flyToCart, formatMoney, getCartKey, lineTotal, unitPrice } from '../utils/cart'
import { BUSINESS_ADDRESS, BUSINESS_EVENING, BUSINESS_HOURS, BUSINESS_NAME, BUSINESS_PHONE, BUSINESS_TAGLINE, BUSINESS_INSTAGRAM } from '../config/demo'

// Walkthrough for people opening the demo for the first time.
const MENU_GUIDE_STEPS = [
  { title: 'Elige algo', text: 'Toca cualquier producto o el botón + para agregarlo.' },
  { title: 'Personalízalo', text: 'Escoge tamaño, leche o extras. El precio se ajusta solo.' },
  { title: 'Envía el pedido', text: 'Abre tu pedido abajo y toca “Enviar pedido”.' },
  { title: 'Míralo llegar', text: 'Así lo recibe el negocio, al instante.', to: '/admin/pedidos', linkLabel: 'Abrir el panel', newTab: true },
]

// The café's own promises (Instagram bio and printed menu).
const VALUES = [
  { icon: ChefHat, title: 'Cocina con intención', text: 'Brunch mexicano de la casa' },
  { icon: Coffee, title: 'Café de especialidad', text: 'Espresso, cacao y matcha' },
  { icon: Wheat, title: 'Pan de masa madre', text: 'En chapatas y rollos' },
  { icon: PawPrint, title: 'Pet friendly', text: 'Tu perro también es bienvenido' },
]

const greeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export const Home = () => {
  const { category } = useParams()
  // Optional WhatsApp copy of the order — settings/general.orderNotificationPhone
  const { settings } = useSettings()
  const WHATSAPP_NUMBER = (settings?.orderNotificationPhone || '').replace(/\D/g, '')

  // Cart + overlay state.
  const [cart, setCart] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [orderNotes, setOrderNotes] = useState('')
  const [orderState, setOrderState] = useState('idle') // 'idle' | 'sending' | 'sent'
  const [lastOrder, setLastOrder] = useState(null) // { orderId, message }

  // Toppings map: docId → {id, name, price, description}
  const [toppingsMap, setToppingsMap] = useState({})

  // ── BottomSheet state ─────────────────────────────────────────────────────
  // Product currently open in the BottomSheet (null = closed).
  const [bottomSheetProduct, setBottomSheetProduct] = useState(null)

  // When BottomSheet completes and the product ALSO has toppings, we park the
  // partial result here before showing the ToppingsOverlay.
  const [pendingBottomSheetResult, setPendingBottomSheetResult] = useState(null)

  // ── ToppingsOverlay state ─────────────────────────────────────────────────
  const [pendingToppingItem, setPendingToppingItem] = useState(null)
  const [editingToppingCartItemId, setEditingToppingCartItemId] = useState(null)

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState(null)
  const toastTimerRef = useRef(null)

  const showToast = (msg) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast(msg)
    toastTimerRef.current = setTimeout(() => setToast(null), 1800)
  }

  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current) }, [])

  useEffect(() => { document.title = `${BUSINESS_NAME} · Menú` }, [])

  // ── Sections / promos ─────────────────────────────────────────────────────
  const { sections, isLoading: sectionsLoading, error: sectionsError } = useSections()
  const { promotion } = usePromotion()
  const cartBtnRef = useRef(null)
  const [isPromoVisible, setIsPromoVisible] = useState(true)
  const [activeSection, setActiveSection] = useState('')

  const visibleSections = sections.filter(
    (s) => !category || s.category?.toLowerCase?.() === category.toLowerCase()
  )

  // Live toppings.
  useEffect(() => {
    return onSnapshot(collection(db, 'toppings'), (snap) => {
      const map = {}
      snap.docs.forEach((d) => {
        const data = d.data()
        if (data.isActive !== false) {
          map[d.id] = { id: d.id, name: data.name, price: Number(data.price || 0), description: data.description || null }
        }
      })
      setToppingsMap(map)
    })
  }, [])

  // ── Cart metrics ──────────────────────────────────────────────────────────
  const cartCount = cart.reduce((sum, item) => sum + (item.qty || 0), 0)
  // Base + options + toppings, per unit, times quantity.
  const cartTotal = cart.reduce((sum, item) => sum + lineTotal(item), 0)

  const clearCart = () => {
    setCart([])
    setOrderNotes('')
  }

  // ── Core cart mutators ────────────────────────────────────────────────────

  // Writes a resolved item into the cart (merges if identical key).
  const _commitToCart = ({
    id,
    name,
    price,
    option = null,
    fromRect = null,
    flyImageSrc = null,
    selectedToppings = [],
    availableToppings = [],
    selectedOptions = [],
    qty: addQty = 1,
  }) => {
    if (fromRect) {
      flyToCart({ fromRect, imgSrc: flyImageSrc, target: cartBtnRef.current })
    }
    if (orderState === 'sent') setOrderState('idle')

    setCart((prev) => {
      const toppingIds = selectedToppings.map((t) => t.id)
      const optionIds = selectedOptions.map((o) => o.optionId)
      const key = getCartKey(id, option, toppingIds, optionIds)

      const idx = prev.findIndex((it) => {
        const itToppingIds = (it.selectedToppings || []).map((t) => t.id)
        const itOptionIds = (it.selectedOptions || []).map((o) => o.optionId)
        return getCartKey(it.id, it.option, itToppingIds, itOptionIds) === key
      })

      if (idx === -1) {
        return [
          ...prev,
          {
            cartItemId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            id, name, price, option,
            qty: addQty,
            selectedToppings,
            availableToppings,
            selectedOptions,
          },
        ]
      }

      const next = [...prev]
      next[idx] = { ...next[idx], qty: (next[idx].qty || 0) + addQty }
      return next
    })
  }

  // Single entry point for MenuCard and PromoCarousel taps.
  const addToCart = ({
    id, name, price,
    desc = '', long_desc = '', image = null, imageUrl = null, icon = null, section = null,
    option = null, fromRect = null, flyImageSrc = null,
    availableToppings = [], optionGroups = [],
  }) => {
    // 1. Has option groups → open BottomSheet
    if (Array.isArray(optionGroups) && optionGroups.length > 0) {
      setBottomSheetProduct({
        id, name, price, desc, long_desc, image, imageUrl, icon, section,
        option, fromRect, flyImageSrc, availableToppings, optionGroups,
      })
      return
    }

    // 2. Has toppings only → open ToppingsOverlay
    if (availableToppings.length > 0) {
      setPendingToppingItem({ id, name, price, option, fromRect, flyImageSrc, availableToppings })
      return
    }

    // 3. No options / toppings → add directly + toast
    _commitToCart({ id, name, price, option, fromRect, flyImageSrc, selectedToppings: [], selectedOptions: [] })
    showToast(`${name} va para tu pedido`)
  }

  const handleBottomSheetConfirm = ({ selectedOptions, qty }) => {
    if (!bottomSheetProduct) return
    const { id, name, price, option, fromRect, flyImageSrc, availableToppings } = bottomSheetProduct

    setBottomSheetProduct(null)

    if (availableToppings.length > 0) {
      setPendingBottomSheetResult({ id, name, price, option, fromRect, flyImageSrc, availableToppings, selectedOptions, qty })
      setPendingToppingItem({ id, name, price, option, fromRect, flyImageSrc, availableToppings })
      return
    }

    _commitToCart({ id, name, price, option, fromRect, flyImageSrc, selectedToppings: [], availableToppings, selectedOptions, qty })
    showToast(`${name} va para tu pedido`)
  }

  const handleToppingConfirmAdd = (selectedToppings) => {
    if (pendingBottomSheetResult) {
      const { id, name, price, option, fromRect, flyImageSrc, availableToppings, selectedOptions, qty } = pendingBottomSheetResult
      _commitToCart({ id, name, price, option, fromRect, flyImageSrc, selectedToppings, availableToppings, selectedOptions, qty })
      setPendingBottomSheetResult(null)
      showToast(`${name} va para tu pedido`)
    } else if (pendingToppingItem) {
      const { id, name, price, option, fromRect, flyImageSrc, availableToppings } = pendingToppingItem
      _commitToCart({ id, name, price, option, fromRect, flyImageSrc, selectedToppings, availableToppings, selectedOptions: [], qty: 1 })
      showToast(`${name} va para tu pedido`)
    }
    setPendingToppingItem(null)
  }

  const handleToppingConfirmEdit = (selectedToppings) => {
    if (!editingToppingCartItemId) return
    setCart((prev) =>
      prev.map((item) => (item.cartItemId === editingToppingCartItemId ? { ...item, selectedToppings } : item))
    )
    setEditingToppingCartItemId(null)
  }

  // Adjust quantity by delta; removes item when it hits 0.
  const changeQty = (cartItemId, delta) => {
    setCart((prev) => {
      const idx = prev.findIndex((it) => it.cartItemId === cartItemId)
      if (idx === -1) return prev
      const next = [...prev]
      const nextQty = (next[idx].qty || 0) + delta
      if (nextQty <= 0) {
        next.splice(idx, 1)
        return next
      }
      next[idx] = { ...next[idx], qty: nextQty }
      return next
    })
  }

  // ── Placing the order ─────────────────────────────────────────────────────
  const buildOrderMessage = (orderId) => {
    const notes = orderNotes.trim()
    const lines = [
      `Pedido ${BUSINESS_NAME} #${orderId.slice(-4)}`,
      '',
      'Items:',
      ...cart.map((item, idx) => {
        const extras = [
          ...(item.selectedOptions || []).map((o) => (o.priceModifier > 0 ? `${o.optionName} (+$${o.priceModifier})` : o.optionName)),
          ...(item.selectedToppings || []).map((t) => t.name),
        ]
        const extrasText = extras.length ? ` [${extras.join(', ')}]` : ''
        return `${idx + 1}. ${item.qty} x ${item.name}${extrasText} - ${formatMoney(lineTotal(item))}`
      }),
      '',
      `Total: ${formatMoney(cartTotal)}`,
    ]
    if (notes) lines.push('', `Notas: ${notes}`)
    return lines.join('\n')
  }

  // Saves the order into the demo store; it shows up live in /admin/pedidos.
  const handlePlaceOrder = async () => {
    if (cart.length === 0 || orderState === 'sending') return
    setOrderState('sending')
    const orderId = `MN-${Date.now().toString(36).toUpperCase()}`
    const message = buildOrderMessage(orderId)
    try {
      await addDoc(collection(db, 'orders'), {
        orderId,
        content: message,
        items: cart.map((it) => ({
          id: it.id ?? null,
          name: it.name,
          price: Number(it.price || 0),
          qty: it.qty,
          itemNote: null,
          selectedOptions: it.selectedOptions || [],
          selectedToppings: (it.selectedToppings || []).map((t) => ({ id: t.id, name: t.name, price: Number(t.price || 0) })),
        })),
        total: Number(cartTotal || 0),
        status: 'Nuevo',
        source: 'menu',
        generalNote: orderNotes.trim() || null,
        createdAt: serverTimestamp(),
      })
      setLastOrder({ orderId, message })
      setCart([])
      setOrderNotes('')
      setOrderState('sent')
    } catch (error) {
      console.error('No se pudo guardar el pedido:', error)
      setOrderState('idle')
      showToast('No se pudo enviar. Intenta otra vez.')
    }
  }

  const handleWhatsApp = () => {
    if (!WHATSAPP_NUMBER || !lastOrder) return
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lastOrder.message)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const closeCart = () => {
    setIsCartOpen(false)
    if (orderState === 'sent') setTimeout(() => setOrderState('idle'), 300)
  }

  // ── Scroll reveal + scroll spy ────────────────────────────────────────────
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('[data-reveal]:not(.is-visible)'))
    if (!els.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.05, rootMargin: '0px 0px -5% 0px' }
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [category, visibleSections.length])

  useEffect(() => {
    const els = Array.from(document.querySelectorAll('[data-section-anchor]'))
    if (!els.length) return
    setActiveSection(els[0].dataset.sectionAnchor)

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.dataset.sectionAnchor)
        })
      },
      { threshold: 0, rootMargin: '-130px 0px -60% 0px' }
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [visibleSections.length, category])

  useEffect(() => {
    if (promotion) setIsPromoVisible(true)
  }, [promotion?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleTabClick = (name) => {
    const el = document.getElementById(`section-${name}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveSection(name)
  }

  // Derived data for the toppings overlays
  const editingCartItem = editingToppingCartItemId
    ? cart.find((it) => it.cartItemId === editingToppingCartItemId)
    : null
  const toppingOverlayAddProduct = pendingBottomSheetResult ?? pendingToppingItem
  // Running total in the extras step = base + options already chosen.
  const toppingOverlayPrice = unitPrice({ ...toppingOverlayAddProduct, selectedToppings: [] })

  return (
    <>
      <Navbar />

      <main className="paper-grain">
        {/* Page header: one espresso band joined to the navbar, like the dark
            top of the café's printed menu, closed by a scalloped edge.
            Visit info lives here, not hidden. */}
        <div className="relative overflow-hidden bg-primary text-on-primary">
          <img
            src="/brand/hojas-mark-cream.png"
            alt=""
            aria-hidden="true"
            width="256"
            height="256"
            className="pointer-events-none absolute -right-10 -bottom-10 w-56 opacity-[0.07] sm:hidden"
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 pt-7 pb-9 sm:grid-cols-[1fr_auto] sm:px-6 sm:pt-12 sm:pb-14">
            <div className="min-w-0">
              <p className="font-script text-2xl leading-none text-brand-sage-light sm:text-3xl">{greeting()},</p>
              <h1 className="font-wide mt-2 max-w-3xl text-balance font-display text-[2.15rem] font-black uppercase leading-[1.02] tracking-tight sm:text-6xl">
                ¿Qué se te <span className="text-brand-terracotta">antoja</span> hoy?
              </h1>
              <p className="mt-3 max-w-md text-base text-on-primary/80 sm:text-lg">{BUSINESS_TAGLINE}</p>
              <ul className="mt-5 flex flex-col gap-2 text-sm text-on-primary/85 sm:flex-row sm:flex-wrap sm:gap-x-6">
                <li className="flex items-center gap-2"><Clock size={16} className="shrink-0 text-brand-terracotta" aria-hidden="true" />{BUSINESS_HOURS}</li>
                <li className="flex items-center gap-2"><MapPin size={16} className="shrink-0 text-brand-terracotta" aria-hidden="true" />{BUSINESS_ADDRESS}</li>
                <li>
                  <a href={`tel:+52${BUSINESS_PHONE.replace(/\D/g, '')}`} className="flex items-center gap-2 underline-offset-4 hover:underline">
                    <Bike size={16} className="shrink-0 text-brand-terracotta" aria-hidden="true" />
                    A domicilio: {BUSINESS_PHONE}
                  </a>
                </li>
              </ul>
              <div className="mt-6">
                <CategorySwitch />
              </div>
            </div>
            <BrandSeal className="hidden w-52 text-on-primary sm:block lg:w-60" />
          </div>
        </div>
        <div className="scallop-down" aria-hidden="true" />

        {/* What the café stands for, from its own Instagram bio. */}
        <ul className="mx-auto mt-6 grid max-w-6xl grid-cols-2 gap-x-4 gap-y-4 px-4 sm:mt-8 sm:grid-cols-4 sm:px-6">
          {VALUES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-on-secondary" aria-hidden="true">
                <Icon size={18} strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold leading-snug text-ink">{title}</p>
                <p className="text-xs leading-snug text-muted sm:text-sm">{text}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <DemoGuide
            id="menu"
            className="mt-6"
            title="Cómo probar esta demo"
            intro="Haz un pedido como si fueras un cliente. Nada se cobra y todo se queda en este navegador."
            steps={MENU_GUIDE_STEPS}
          />
        </div>

        {promotion && isPromoVisible && (
          <PromoBanner
            title={promotion.title || 'Promoción'}
            message={promotion.message || ''}
            onClose={() => setIsPromoVisible(false)}
          />
        )}

        {!category && <PromoCarousel onAddToCart={addToCart} toppingsMap={toppingsMap} />}

        <div className="mt-8">
          {visibleSections.length > 1 && (
            <CategoryTabs sections={visibleSections} activeSection={activeSection} onTabClick={handleTabClick} />
          )}

          <SectionsList
            isLoading={sectionsLoading}
            error={sectionsError}
            sections={visibleSections}
            onAddToCart={addToCart}
            toppingsMap={toppingsMap}
          />
        </div>

        <footer className="mt-20">
          <div className="scallop-up" aria-hidden="true" />
          <div className="bg-primary text-on-primary">
            <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-12 sm:grid-cols-[1.3fr_1fr] sm:px-6 sm:pt-14 pb-28 sm:pb-24">
              <figure>
                <blockquote className="font-script text-3xl leading-tight text-on-primary sm:text-4xl">
                  “Déjate sorprender con las maravillas del café.”
                </blockquote>
                <figcaption className="mt-3 text-sm text-on-primary/70">Alicia en el país de las maravillas</figcaption>
              </figure>
              <div className="flex flex-col gap-4 text-sm text-on-primary/85">
                <div className="flex items-center gap-3">
                  <img src="/logo.svg" alt="" width="40" height="40" className="h-10 w-10" />
                  <p translate="no" className="font-wide font-display text-base font-extrabold uppercase tracking-tight text-on-primary">{BUSINESS_NAME}</p>
                </div>
                <ul className="flex flex-col gap-2">
                  <li className="flex items-center gap-2"><Clock size={16} className="shrink-0 text-brand-terracotta" aria-hidden="true" />{BUSINESS_HOURS}</li>
                  <li className="flex items-center gap-2"><Moon size={16} className="shrink-0 text-brand-terracotta" aria-hidden="true" />{BUSINESS_EVENING}</li>
                  <li className="flex items-center gap-2"><MapPin size={16} className="shrink-0 text-brand-terracotta" aria-hidden="true" />{BUSINESS_ADDRESS}</li>
                  <li>
                    <a href={`https://www.instagram.com/${BUSINESS_INSTAGRAM}/`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 underline-offset-4 hover:underline">
                      <AtSign size={16} className="shrink-0 text-brand-terracotta" aria-hidden="true" />{BUSINESS_INSTAGRAM}
                    </a>
                  </li>
                </ul>
                <Link to="/admin" className="text-on-primary/60 underline-offset-4 hover:text-on-primary hover:underline">Abrir el panel</Link>
              </div>
            </div>
          </div>
        </footer>
      </main>

      <Toast message={toast} icon={Check} />

      <CartButton
        ref={cartBtnRef}
        isOpen={isCartOpen}
        count={cartCount}
        total={cartTotal}
        onClick={() => setIsCartOpen((v) => !v)}
      />

      <CartOverlay
        isOpen={isCartOpen}
        onClose={closeCart}
        cart={cart}
        cartCount={cartCount}
        cartTotal={cartTotal}
        orderNotes={orderNotes}
        setOrderNotes={setOrderNotes}
        onChangeQty={changeQty}
        onOrder={handlePlaceOrder}
        onClearCart={clearCart}
        onEditToppings={(cartItemId) => setEditingToppingCartItemId(cartItemId)}
        orderState={orderState}
        lastOrderId={lastOrder?.orderId}
        onWhatsApp={WHATSAPP_NUMBER ? handleWhatsApp : null}
        onNewOrder={closeCart}
      />

      {/* BottomSheet — option groups */}
      <BottomSheet
        isOpen={Boolean(bottomSheetProduct)}
        onClose={() => setBottomSheetProduct(null)}
        product={bottomSheetProduct}
        onConfirm={handleBottomSheetConfirm}
      />

      {/* ToppingsOverlay — add flow */}
      <ToppingsOverlay
        isOpen={Boolean(pendingToppingItem)}
        onClose={() => {
          setPendingToppingItem(null)
          setPendingBottomSheetResult(null)
        }}
        productName={toppingOverlayAddProduct?.name ?? ''}
        productPrice={toppingOverlayPrice}
        toppings={toppingOverlayAddProduct?.availableToppings ?? []}
        initialSelected={[]}
        onConfirm={handleToppingConfirmAdd}
        confirmLabel="Agregar al pedido"
      />

      {/* ToppingsOverlay — edit flow */}
      <ToppingsOverlay
        isOpen={Boolean(editingToppingCartItemId)}
        onClose={() => setEditingToppingCartItemId(null)}
        productName={editingCartItem?.name ?? ''}
        productPrice={unitPrice({ ...editingCartItem, selectedToppings: [] })}
        toppings={editingCartItem?.availableToppings ?? []}
        initialSelected={editingCartItem?.selectedToppings ?? []}
        onConfirm={handleToppingConfirmEdit}
        confirmLabel="Guardar extras"
      />
    </>
  )
}
