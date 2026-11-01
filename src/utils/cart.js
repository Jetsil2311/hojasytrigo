// Cart helpers shared by the menu and the POS.

// Whole amounts print without cents ($58); fractional ones keep two ($58.50).
export const formatMoney = (value) => {
  const n = Number(value) || 0
  const whole = Math.abs(n - Math.round(n)) < 0.005
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(whole ? Math.round(n) : n)
}

// Unit price = base + selected options + selected toppings.
export const unitPrice = (item) =>
  Number(item.price || 0)
  + (item.selectedOptions || []).reduce((s, o) => s + Number(o.priceModifier || 0), 0)
  + (item.selectedToppings || []).reduce((s, t) => s + Number(t.price || 0), 0)

export const lineTotal = (item) => unitPrice(item) * (item.qty || 0)

// toppingIds is an optional array of topping doc IDs; sorted for stable keys.
// selectedOptionIds is an optional array of option IDs from optionGroups; sorted for stable keys.
export const getCartKey = (id, option, toppingIds = [], selectedOptionIds = []) =>
  `${id}::${option ?? ''}::${[...toppingIds].sort().join(',')}::${[...selectedOptionIds].sort().join(',')}`

// Short "fly to cart" animation from the product card to the cart button.
export const flyToCart = ({ fromRect, imgSrc, target }) => {
  if (!target || !fromRect) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    target.classList.add('animate-bump')
    setTimeout(() => target.classList.remove('animate-bump'), 500)
    return
  }

  const toRect = target.getBoundingClientRect()
  const el = imgSrc ? document.createElement('img') : document.createElement('div')

  if (imgSrc) {
    el.src = imgSrc
    el.alt = ''
    el.style.width = '48px'
    el.style.height = '48px'
    el.style.objectFit = 'cover'
    el.style.borderRadius = '14px'
  } else {
    el.style.width = '22px'
    el.style.height = '22px'
    el.style.borderRadius = '9999px'
    el.style.background = 'var(--color-accent)'
  }

  el.style.position = 'fixed'
  el.style.left = `${fromRect.left + fromRect.width / 2}px`
  el.style.top = `${fromRect.top + fromRect.height / 2}px`
  el.style.boxShadow = 'var(--shadow-pop)'
  el.style.zIndex = '80'
  el.style.transform = 'translate(-50%, -50%) scale(1)'
  el.style.transition = 'transform 700ms cubic-bezier(.2,.9,.2,1), opacity 700ms ease-in'
  el.style.pointerEvents = 'none'

  document.body.appendChild(el)

  const dx = toRect.left + toRect.width / 2 - (fromRect.left + fromRect.width / 2)
  const dy = toRect.top + toRect.height / 2 - (fromRect.top + fromRect.height / 2)

  requestAnimationFrame(() => {
    el.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.3)`
    el.style.opacity = '0.6'
  })

  let done = false
  const cleanup = () => {
    if (done) return
    done = true
    el.remove()
    target.classList.add('animate-bump')
    setTimeout(() => target.classList.remove('animate-bump'), 500)
  }

  el.addEventListener('transitionend', cleanup, { once: true })
  setTimeout(cleanup, 900) // safety net if transitionend never fires
}
