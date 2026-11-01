/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router'
import { db, writeBatch, doc } from '../../demo/store'
import { useAdminData } from '../../hooks/useAdminData'
import {
  Plus, Pencil, Trash2, ChevronDown, GripVertical, X, Check, AlertCircle,
  ImagePlus, Layers, Sparkles, Star, Eye, EyeOff, Search,
} from 'lucide-react'
import { ProductArt, ProductIcon, ICON_CHOICES } from '../../components/ProductArt'
import { MenuCard } from '../../components/MenuCard'
import { SearchField } from '../../components/admin/AdminUI'
import {
  Badge, Button, Card, ConfirmDialog, EmptyState, Field, IconButton, Segmented, Skeleton, Switch,
  cx, inputCls, labelCls, useLockBodyScroll,
} from '../../components/ui'
import { formatMoney } from '../../utils/cart'

// ── Option groups editor ──────────────────────────────────────────────────────
// Group schema: { id, name, type: 'single' | 'multi', required, options: [{ id, name, priceModifier }] }
const OptionGroupsEditor = ({ groups = [], onChange }) => {
  const newId = (p) => `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  const addGroup = () => onChange([...groups, { id: newId('group'), name: '', type: 'single', required: false, options: [{ id: newId('opt'), name: '', priceModifier: 0 }] }])
  const updateGroup = (gIdx, field, value) => onChange(groups.map((g, i) => (i === gIdx ? { ...g, [field]: value } : g)))
  const removeGroup = (gIdx) => onChange(groups.filter((_, i) => i !== gIdx))
  const addOption = (gIdx) => updateGroup(gIdx, 'options', [...(groups[gIdx].options || []), { id: newId('opt'), name: '', priceModifier: 0 }])
  const updateOption = (gIdx, oIdx, field, value) =>
    updateGroup(gIdx, 'options', (groups[gIdx].options || []).map((o, i) => (i === oIdx ? { ...o, [field]: value } : o)))
  const removeOption = (gIdx, oIdx) => updateGroup(gIdx, 'options', (groups[gIdx].options || []).filter((_, i) => i !== oIdx))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">Opciones para elegir</p>
          <p className="text-xs text-muted">Tamaño, tipo de leche, proteína… Se muestran al tocar el producto.</p>
        </div>
        <Button size="sm" variant="secondary" onClick={addGroup}><Plus size={14} /> Grupo</Button>
      </div>

      {groups.map((group, gIdx) => (
        <div key={group.id} className="space-y-3 rounded-2xl border border-line bg-surface-2 p-4">
          <div className="flex items-center gap-2">
            <input className={inputCls} placeholder="Nombre del grupo, por ejemplo Tamaño" aria-label="Nombre del grupo" value={group.name} onChange={(e) => updateGroup(gIdx, 'name', e.target.value)} />
            <IconButton size="sm" label="Eliminar grupo" onClick={() => removeGroup(gIdx)} className="hover:text-danger"><Trash2 size={16} /></IconButton>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Segmented
              size="sm"
              value={group.type}
              onChange={(v) => updateGroup(gIdx, 'type', v)}
              options={[{ value: 'single', label: 'Elige una' }, { value: 'multi', label: 'Elige varias' }]}
            />
            <label className="flex items-center gap-2 text-sm font-medium text-ink">
              Obligatorio
              <Switch label="Obligatorio" checked={!!group.required} onChange={(v) => updateGroup(gIdx, 'required', v)} />
            </label>
          </div>
          <div className="space-y-2">
            {(group.options || []).map((opt, oIdx) => (
              <div key={opt.id} className="flex items-center gap-2">
                <input className={inputCls} placeholder="Opción, por ejemplo Grande" aria-label="Nombre de la opción" value={opt.name} onChange={(e) => updateOption(gIdx, oIdx, 'name', e.target.value)} />
                <div className="relative w-28 shrink-0">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-subtle">+$</span>
                  <input
                    className={cx(inputCls, 'pl-8')}
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    aria-label="Costo extra"
                    value={opt.priceModifier === 0 ? '' : opt.priceModifier}
                    onChange={(e) => updateOption(gIdx, oIdx, 'priceModifier', e.target.value === '' ? 0 : Number(e.target.value))}
                  />
                </div>
                <IconButton size="sm" label="Eliminar opción" onClick={() => removeOption(gIdx, oIdx)}><X size={16} /></IconButton>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => addOption(gIdx)} className="inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-ink hover:underline">
            <Plus size={14} /> Agregar opción
          </button>
        </div>
      ))}
    </div>
  )
}

// ── Side drawer (full sheet on phones) ────────────────────────────────────────
const Drawer = ({ isOpen, onClose, title, children, footer }) => {
  useLockBodyScroll(isOpen)
  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-scrim/50 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 flex max-h-[94dvh] flex-col rounded-t-3xl bg-surface shadow-pop animate-sheet-up md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[560px] md:rounded-none md:rounded-l-3xl">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-5 py-4 md:px-6">
          <h2 className="font-display text-xl font-bold text-ink">{title}</h2>
          <IconButton label="Cerrar" onClick={onClose}><X size={20} /></IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 md:px-6">{children}</div>
        {footer && <div className="shrink-0 border-t border-line px-5 py-4 pb-safe md:px-6 md:pb-5">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

const Notice = ({ tone, children }) => (
  <p className={cx('flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold', tone === 'error' ? 'bg-danger-soft text-danger' : 'bg-success-soft text-success')}>
    {tone === 'error' ? <AlertCircle size={16} /> : <Check size={16} />} {children}
  </p>
)

// ── Product drawer form ───────────────────────────────────────────────────────
const ProductDrawer = ({
  isOpen, onClose, title, item, onChange, onSave, onImageChange, imageFile,
  isSubmitting, error, success, menuSections, menuSectionsLoading, toppingsList,
}) => {
  const fileRef = useRef(null)
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    if (!imageFile) { setPreview(null); return }
    const url = URL.createObjectURL(imageFile)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  const previewProduct = {
    ...item,
    id: item.id ?? item.docId ?? 'nuevo',
    imageUrl: preview || item.imageUrl,
    name: item.name || 'Nombre del producto',
    price: Number(item.price) || 0,
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1" onClick={onSave} disabled={isSubmitting}>{isSubmitting ? 'Guardando…' : 'Guardar producto'}</Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Live preview */}
        <div>
          <p className={labelCls}>Así se verá en el menú</p>
          <ul className="pointer-events-none rounded-2xl bg-bg p-3" aria-hidden="true">
            <MenuCard
              layout="row"
              id={previewProduct.id}
              name={previewProduct.name}
              desc={item.desc}
              price={previewProduct.price}
              imageUrl={previewProduct.imageUrl}
              icon={item.icon}
              section={item.section}
              isActive={item.isActive !== false}
              popular={!!item.popular}
              optionGroups={item.optionGroups || []}
              availableToppings={(item.toppingIds || []).map((id) => ({ id }))}
            />
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Nombre" htmlFor="p-name" className="col-span-2">
            <input id="p-name" className={inputCls} value={item.name || ''} onChange={(e) => onChange('name', e.target.value)} placeholder="Latte de vainilla" />
          </Field>
          <Field label="Sección" htmlFor="p-section">
            {menuSectionsLoading ? <Skeleton className="h-11" /> : (
              <select id="p-section" className={inputCls} value={item.section || ''} onChange={(e) => onChange('section', e.target.value)}>
                <option value="">Elige una</option>
                {menuSections.map((s) => <option key={s.docId ?? s.name} value={s.name}>{s.name}</option>)}
              </select>
            )}
          </Field>
          <Field label="Precio" htmlFor="p-price">
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-subtle">$</span>
              <input id="p-price" className={cx(inputCls, 'pl-7')} type="number" min="0" step="0.5" value={item.price ?? ''} onChange={(e) => onChange('price', e.target.value)} />
            </div>
          </Field>
          <Field label="Descripción corta" htmlFor="p-desc" hint="Una frase que antoje. Se ve en la tarjeta." className="col-span-2">
            <input id="p-desc" className={inputCls} value={item.desc || ''} onChange={(e) => onChange('desc', e.target.value)} maxLength={90} />
          </Field>
          <Field label="Más detalles (opcional)" htmlFor="p-long" hint="Aparece al tocar el botón de información." className="col-span-2">
            <textarea id="p-long" className={cx(inputCls, 'resize-none py-3')} rows={3} value={item.long_desc || ''} onChange={(e) => onChange('long_desc', e.target.value)} />
          </Field>
        </div>

        {/* Picture or illustration */}
        <div>
          <p className={labelCls}>Imagen</p>
          <div className="flex items-start gap-4">
            <ProductArt product={previewProduct} className="h-20 w-20 shrink-0" iconSize={30} />
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}><ImagePlus size={15} /> Subir foto</Button>
                {(preview || item.imageUrl) && (
                  <Button size="sm" variant="ghost" onClick={() => { onImageChange(null); onChange('imageUrl', '') }}>Quitar foto</Button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onImageChange(e.target.files?.[0] ?? null)} />
              </div>
              <div>
                <p className="mb-1.5 text-xs text-muted">Sin foto, usamos una ilustración:</p>
                <div className="flex flex-wrap gap-1.5">
                  {ICON_CHOICES.map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onChange('icon', key)}
                      aria-label={`Ilustración ${key}`}
                      aria-pressed={item.icon === key}
                      className={cx('inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors', item.icon === key ? 'border-primary bg-primary text-on-primary' : 'border-line text-muted hover:border-line-strong hover:text-ink')}
                    >
                      <ProductIcon name={key} size={17} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <OptionGroupsEditor groups={Array.isArray(item.optionGroups) ? item.optionGroups : []} onChange={(groups) => onChange('optionGroups', groups)} />

        {toppingsList.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-ink">Extras disponibles</p>
            <p className="mb-2.5 text-xs text-muted">Se ofrecen después de elegir las opciones.</p>
            <div className="flex flex-wrap gap-2">
              {toppingsList.map((t) => {
                const checked = (item.toppingIds || []).includes(t.docId)
                return (
                  <button
                    key={t.docId}
                    type="button"
                    aria-pressed={checked}
                    onClick={() => onChange('toppingIds', checked ? (item.toppingIds || []).filter((id) => id !== t.docId) : [...(item.toppingIds || []), t.docId])}
                    className={cx('inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors', checked ? 'border-primary bg-primary text-on-primary' : 'border-line-strong text-ink hover:border-ink')}
                  >
                    {checked && <Check size={14} />} {t.name}
                    <span className={cx('tabular text-xs', checked ? 'opacity-80' : 'text-subtle')}>+{formatMoney(t.price)}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="space-y-3 rounded-2xl bg-surface-2 p-4">
          <label className="flex items-center justify-between gap-4">
            <span>
              <span className="block text-sm font-semibold text-ink">Disponible</span>
              <span className="block text-xs text-muted">Apágalo cuando se acabe. Se muestra como agotado.</span>
            </span>
            <Switch label="Disponible" checked={item.isActive !== false} onChange={(v) => onChange('isActive', v)} />
          </label>
        </div>

        {error && <Notice tone="error">{error}</Notice>}
        {success && <Notice>{success}</Notice>}
      </div>
    </Drawer>
  )
}

// ── Section drawer form ───────────────────────────────────────────────────────
const SectionDrawer = ({ isOpen, onClose, title, item, onChange, onSave, isSubmitting, error, success }) => (
  <Drawer
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    footer={
      <div className="flex gap-2">
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button className="flex-1" onClick={onSave} disabled={isSubmitting}>{isSubmitting ? 'Guardando…' : 'Guardar sección'}</Button>
      </div>
    }
  >
    <div className="space-y-4">
      <Field label="Nombre" htmlFor="s-name">
        <input id="s-name" className={inputCls} value={item.name || ''} onChange={(e) => onChange('name', e.target.value)} placeholder="Bebidas Heladas" />
      </Field>
      <Field label="Categoría" htmlFor="s-cat" hint="Agrupa secciones en el menú: Bebidas o Alimentos.">
        <select id="s-cat" className={inputCls} value={item.category || ''} onChange={(e) => onChange('category', e.target.value)}>
          <option value="">Elige una</option>
          <option value="Bebidas">Bebidas</option>
          <option value="Alimentos">Alimentos</option>
        </select>
      </Field>
      <Field label="Descripción" htmlFor="s-desc" hint="Una o dos frases. Mejor si cuentan cómo se siente, no qué lleva.">
        <textarea id="s-desc" className={cx(inputCls, 'resize-none py-3')} rows={2} value={item.desc || ''} onChange={(e) => onChange('desc', e.target.value)} />
      </Field>
      <Field label="Posición" htmlFor="s-order" hint="También puedes arrastrar las secciones en la lista.">
        <input id="s-order" className={inputCls} type="number" min="0" value={item.order ?? ''} onChange={(e) => onChange('order', e.target.value)} />
      </Field>
      {error && <Notice tone="error">{error}</Notice>}
      {success && <Notice>{success}</Notice>}
    </div>
  </Drawer>
)

// ── Products tab ──────────────────────────────────────────────────────────────
const ProductsTab = ({ data }) => {
  const {
    menuItems, menuLoading, menuError, menuSections, menuSectionsLoading,
    menuSectionsError, menuSavingId, toppingsList,
    handleSaveMenuItem, handleDeleteMenuItem, handleToggleProductActive, handleToggleSectionVisible,
    handleAddProduct, handleAddSection, handleSaveSection, handleDeleteSection,
    editingItem, setEditingItem, editingImageFile, setEditingImageFile,
    deleteTarget, setDeleteTarget,
    editingSection, setEditingSection,
    deleteSectionTarget, setDeleteSectionTarget,
    isSubmitting, error, setError,
    productName, setProductName, productSection, setProductSection,
    productDesc, setProductDesc, productLongDesc, setProductLongDesc,
    productPrice, setProductPrice, productIcon, setProductIcon,
    productImageFile, setProductImageFile,
    productToppingIds, setProductToppingIds, productOptionGroups, productSuccess, setProductSuccess,
    sectionName, setSectionName, sectionCategory, setSectionCategory,
    sectionDesc, setSectionDesc, sectionOrder, setSectionOrder,
    sectionSuccess, setSectionSuccess,
    loadMenuSections,
  } = data

  const [collapsedSections, setCollapsedSections] = useState({})
  const [addProductOpen, setAddProductOpen] = useState(false)
  const [addSectionOpen, setAddSectionOpen] = useState(false)
  const [dragOverSection, setDragOverSection] = useState(null)
  const [search, setSearch] = useState('')
  const dragSectionRef = useRef(null)

  // Open a drawer when navigated here from a quick action
  const location = useLocation()
  useEffect(() => {
    if (location.state?.openAddProduct) { setAddProductOpen(true); window.history.replaceState({}, '') }
    if (location.state?.openAddSection) { setAddSectionOpen(true); window.history.replaceState({}, '') }
  }, [location.state])

  const toggleSection = (name) => setCollapsedSections((prev) => ({ ...prev, [name]: !prev[name] }))

  const term = search.trim().toLowerCase()
  const matches = (p) => !term || (p.name || '').toLowerCase().includes(term)

  // Group products by section, preserving section order
  const grouped = menuSections.map((sec) => ({ section: sec, products: menuItems.filter((p) => p.section === sec.name && matches(p)) }))
  const orphanSections = [...new Set(menuItems.filter((p) => !menuSections.find((s) => s.name === p.section)).map((p) => p.section))]
  orphanSections.forEach((name) => grouped.push({ section: { name, docId: null }, products: menuItems.filter((p) => p.section === name && matches(p)) }))
  const shownGroups = term ? grouped.filter((g) => g.products.length) : grouped

  const newProductObj = {
    name: productName, section: productSection, desc: productDesc,
    long_desc: productLongDesc, price: productPrice, icon: productIcon,
    toppingIds: productToppingIds, optionGroups: productOptionGroups || [], isActive: true,
  }

  const handleNewProductChange = (field, value) => {
    const setters = {
      name: setProductName, section: setProductSection, desc: setProductDesc,
      long_desc: setProductLongDesc, price: setProductPrice, icon: setProductIcon,
      toppingIds: setProductToppingIds, optionGroups: data.setProductOptionGroups,
    }
    setters[field]?.(value)
    setProductSuccess('')
  }

  const openAddProduct = () => { setError(''); setProductSuccess(''); setAddProductOpen(true) }
  const openAddSection = () => { setError(''); setSectionSuccess(''); setAddSectionOpen(true) }

  const handleEditChange = (field, value) => setEditingItem((prev) => (prev ? { ...prev, [field]: value } : prev))

  const newSectionObj = { name: sectionName, category: sectionCategory, desc: sectionDesc, order: sectionOrder }
  const handleNewSectionChange = (field, value) => {
    const setters = { name: setSectionName, category: setSectionCategory, desc: setSectionDesc, order: setSectionOrder }
    setters[field]?.(value)
  }

  // Section drag-and-drop reorder
  const handleSectionDrop = async (dropIdx) => {
    setDragOverSection(null)
    const fromIdx = dragSectionRef.current
    dragSectionRef.current = null
    if (fromIdx === null || fromIdx === dropIdx) return
    const docSections = grouped.filter((g) => g.section.docId)
    if (fromIdx >= docSections.length || dropIdx >= docSections.length) return
    const reordered = [...docSections]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(dropIdx, 0, moved)
    try {
      const batch = writeBatch(db)
      reordered.forEach(({ section }, i) => batch.update(doc(db, 'sections', section.docId), { order: i }))
      await batch.commit()
      loadMenuSections()
    } catch (err) {
      console.error('Error reordering sections:', err)
    }
  }

  const handleEditSectionChange = (field, value) => setEditingSection((prev) => (prev ? { ...prev, [field]: value } : prev))

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <SearchField value={search} onChange={setSearch} onClear={() => setSearch('')} icon={Search} clearIcon={X} placeholder="Buscar producto" className="md:w-72" />
        <div className="flex gap-2 md:ml-auto">
          <Button variant="outline" onClick={openAddSection}><Layers size={16} /> Nueva sección</Button>
          <Button onClick={openAddProduct} className="flex-1 md:flex-none"><Plus size={16} /> Agregar producto</Button>
        </div>
      </div>

      {menuError && !editingItem && <Notice tone="error">{menuError}</Notice>}

      {menuLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : shownGroups.length === 0 ? (
        <Card><EmptyState icon={Layers} title={term ? 'Sin coincidencias' : 'Tu menú está vacío'} text={term ? 'Prueba con otro nombre.' : 'Crea una sección y luego agrega productos.'} /></Card>
      ) : (
        <div className="space-y-4">
          {shownGroups.map(({ section, products }, idx) => {
            const collapsed = collapsedSections[section.name]
            const hidden = section.visible === false
            return (
              <Card
                key={section.docId ?? section.name}
                className={cx('overflow-hidden transition-colors', dragOverSection === idx && 'border-primary')}
                draggable={Boolean(section.docId) && !term}
                onDragStart={() => { dragSectionRef.current = idx }}
                onDragOver={(e) => { e.preventDefault(); setDragOverSection(idx) }}
                onDrop={() => handleSectionDrop(idx)}
                onDragLeave={() => setDragOverSection(null)}
              >
                <div className="flex items-center gap-2 px-3 py-3 md:px-4">
                  <GripVertical size={18} className={cx('hidden shrink-0 md:block', section.docId ? 'cursor-grab text-subtle' : 'text-line-strong')} aria-hidden="true" />
                  <button type="button" onClick={() => toggleSection(section.name)} aria-expanded={!collapsed} className="flex min-h-11 min-w-0 flex-1 items-center gap-2 text-left">
                    <ChevronDown size={18} className={cx('shrink-0 text-muted transition-transform', collapsed && '-rotate-90')} />
                    <span className={cx('truncate font-display text-lg font-semibold', hidden ? 'text-subtle' : 'text-ink')}>{section.name}</span>
                    <span className="tabular rounded-full bg-secondary px-2 text-xs font-semibold text-muted">{products.length}</span>
                    {hidden && <Badge>Oculta</Badge>}
                  </button>
                  {section.docId && (
                    <div className="flex shrink-0 items-center">
                      <IconButton size="sm" label={hidden ? 'Mostrar sección en el menú' : 'Ocultar sección del menú'} onClick={() => handleToggleSectionVisible(section)} disabled={menuSavingId === section.docId}>
                        {hidden ? <EyeOff size={17} /> : <Eye size={17} />}
                      </IconButton>
                      <IconButton size="sm" label="Editar sección" onClick={() => setEditingSection({ ...section, _originalName: section.name })}><Pencil size={16} /></IconButton>
                      <IconButton size="sm" label="Eliminar sección" onClick={() => setDeleteSectionTarget(section)} className="hover:text-danger"><Trash2 size={16} /></IconButton>
                    </div>
                  )}
                </div>

                {!collapsed && (
                  products.length === 0 ? (
                    <p className="border-t border-line px-5 py-5 text-sm text-muted">Sin productos. Agrega el primero con el botón de arriba.</p>
                  ) : (
                    <ul className="divide-y divide-line border-t border-line">
                      {products.map((product) => {
                        const soldOut = product.isActive === false
                        const optionsCount = (product.optionGroups || []).length
                        return (
                          <li key={product.docId} className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-surface-2 md:px-4">
                            <ProductArt product={product} className={cx('h-12 w-12 shrink-0', soldOut && 'grayscale')} rounded="rounded-xl" iconSize={22} />
                            <button type="button" onClick={() => { setEditingItem(product); setEditingImageFile(null) }} className="min-w-0 flex-1 text-left">
                              <span className="flex items-center gap-2">
                                <span className={cx('truncate font-semibold', soldOut ? 'text-subtle' : 'text-ink')}>{product.name}</span>
                                {product.popular && <Star size={13} className="shrink-0 fill-accent text-accent" aria-label="Favorito" />}
                              </span>
                              <span className="tabular block truncate text-xs text-subtle">
                                {formatMoney(Number(product.price))}
                                {optionsCount > 0 && ` · ${optionsCount} ${optionsCount === 1 ? 'grupo de opciones' : 'grupos de opciones'}`}
                                {soldOut && ' · Agotado'}
                              </span>
                            </button>
                            <div className="flex shrink-0 items-center gap-1">
                              <Switch
                                label={soldOut ? `Marcar ${product.name} como disponible` : `Marcar ${product.name} como agotado`}
                                checked={!soldOut}
                                onChange={() => handleToggleProductActive(product)}
                                disabled={menuSavingId === product.docId}
                              />
                              <IconButton size="sm" label={`Editar ${product.name}`} onClick={() => { setEditingItem(product); setEditingImageFile(null) }}><Pencil size={16} /></IconButton>
                              <span className="hidden sm:block"><IconButton size="sm" label={`Eliminar ${product.name}`} onClick={() => setDeleteTarget(product)} className="hover:text-danger"><Trash2 size={16} /></IconButton></span>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  )
                )}
              </Card>
            )
          })}
        </div>
      )}

      <ProductDrawer
        isOpen={addProductOpen}
        onClose={() => setAddProductOpen(false)}
        title="Nuevo producto"
        item={newProductObj}
        onChange={handleNewProductChange}
        onSave={() => handleAddProduct({ preventDefault: () => {} })}
        onImageChange={setProductImageFile}
        imageFile={productImageFile}
        isSubmitting={isSubmitting}
        error={error}
        success={productSuccess}
        menuSections={menuSections}
        menuSectionsLoading={menuSectionsLoading}
        toppingsList={toppingsList}
      />

      <ProductDrawer
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        title="Editar producto"
        item={editingItem ?? {}}
        onChange={handleEditChange}
        onSave={() => editingItem && handleSaveMenuItem(editingItem)}
        onImageChange={setEditingImageFile}
        imageFile={editingImageFile}
        isSubmitting={menuSavingId === editingItem?.docId}
        error={menuError}
        success=""
        menuSections={menuSections}
        menuSectionsLoading={menuSectionsLoading}
        toppingsList={toppingsList}
      />

      <SectionDrawer
        isOpen={addSectionOpen}
        onClose={() => setAddSectionOpen(false)}
        title="Nueva sección"
        item={newSectionObj}
        onChange={handleNewSectionChange}
        onSave={() => handleAddSection({ preventDefault: () => {} })}
        isSubmitting={isSubmitting}
        error={error}
        success={sectionSuccess}
      />

      <SectionDrawer
        isOpen={Boolean(editingSection)}
        onClose={() => setEditingSection(null)}
        title="Editar sección"
        item={editingSection ?? {}}
        onChange={handleEditSectionChange}
        onSave={() => editingSection && handleSaveSection({ ...editingSection, originalName: editingSection._originalName ?? editingSection.name })}
        isSubmitting={menuSavingId === editingSection?.docId}
        error={menuSectionsError}
        success=""
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`¿Eliminar ${deleteTarget?.name ?? ''}?`}
        text="Desaparece del menú y del POS. Si solo se acabó, mejor márcalo como agotado."
        loading={menuSavingId === deleteTarget?.docId}
        onConfirm={async () => { await handleDeleteMenuItem(deleteTarget); setDeleteTarget(null) }}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={Boolean(deleteSectionTarget)}
        title={`¿Eliminar ${deleteSectionTarget?.name ?? ''}?`}
        text="Se borran la sección y todos sus productos. No se puede deshacer."
        loading={menuSavingId === deleteSectionTarget?.docId}
        onConfirm={async () => { await handleDeleteSection(deleteSectionTarget); setDeleteSectionTarget(null) }}
        onCancel={() => setDeleteSectionTarget(null)}
      />
    </div>
  )
}

// ── Extras (toppings) tab ─────────────────────────────────────────────────────
const ToppingsTab = ({ data }) => {
  const {
    toppingsList, toppingsLoading, toppingsError, toppingsSuccess,
    toppingName, setToppingName, toppingPrice, setToppingPrice,
    toppingDescription, setToppingDescription,
    handleAddTopping, handleSaveTopping, handleDeleteTopping,
    editingTopping, setEditingTopping,
    deleteToppingTarget, setDeleteToppingTarget,
    isSubmitting,
  } = data

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="h-fit p-5 lg:col-span-2">
        <h3 className="font-display text-lg font-semibold text-ink">Nuevo extra</h3>
        <p className="mt-1 text-sm text-muted">Después lo activas en cada producto que lo ofrezca.</p>
        <form onSubmit={handleAddTopping} className="mt-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Field label="Nombre" htmlFor="t-name" className="col-span-2">
              <input id="t-name" className={inputCls} value={toppingName} onChange={(e) => setToppingName(e.target.value)} placeholder="Crema batida" required />
            </Field>
            <Field label="Precio" htmlFor="t-price">
              <input id="t-price" className={inputCls} type="number" min="0" step="0.5" value={toppingPrice} onChange={(e) => setToppingPrice(e.target.value)} required />
            </Field>
          </div>
          <Field label="Descripción (opcional)" htmlFor="t-desc">
            <textarea id="t-desc" className={cx(inputCls, 'resize-none py-3')} rows={2} value={toppingDescription} onChange={(e) => setToppingDescription(e.target.value)} placeholder="Batida en casa, ligeramente dulce." />
          </Field>
          {toppingsError && <Notice tone="error">{toppingsError}</Notice>}
          {toppingsSuccess && <Notice>{toppingsSuccess}</Notice>}
          <Button type="submit" block disabled={isSubmitting}><Plus size={16} /> Agregar extra</Button>
        </form>
      </Card>

      <Card className="overflow-hidden lg:col-span-3">
        {toppingsLoading ? (
          <div className="space-y-3 p-5">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : toppingsList.length === 0 ? (
          <EmptyState icon={Sparkles} title="Sin extras" text="Crea el primero con el formulario." />
        ) : (
          <ul className="divide-y divide-line">
            {toppingsList.map((t) => (
              <li key={t.docId} className="px-5 py-3.5">
                {editingTopping?.docId === t.docId ? (
                  <form onSubmit={(e) => { e.preventDefault(); handleSaveTopping(editingTopping) }} className="space-y-2">
                    <div className="flex gap-2">
                      <input className={inputCls} aria-label="Nombre" value={editingTopping.name} onChange={(e) => setEditingTopping((prev) => ({ ...prev, name: e.target.value }))} autoFocus />
                      <input className={cx(inputCls, 'w-28')} aria-label="Precio" type="number" min="0" step="0.5" value={editingTopping.price} onChange={(e) => setEditingTopping((prev) => ({ ...prev, price: e.target.value }))} />
                    </div>
                    <textarea className={cx(inputCls, 'resize-none py-3')} aria-label="Descripción" rows={2} placeholder="Descripción (opcional)" value={editingTopping.description || ''} onChange={(e) => setEditingTopping((prev) => ({ ...prev, description: e.target.value }))} />
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setEditingTopping(null)}>Cancelar</Button>
                      <Button size="sm" type="submit"><Check size={15} /> Guardar</Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink">{t.name}</p>
                      {t.description && <p className="truncate text-xs text-muted">{t.description}</p>}
                    </div>
                    <span className="tabular text-sm font-semibold text-ink">+{formatMoney(t.price)}</span>
                    <IconButton size="sm" label={`Editar ${t.name}`} onClick={() => setEditingTopping(t)}><Pencil size={16} /></IconButton>
                    <IconButton size="sm" label={`Eliminar ${t.name}`} onClick={() => setDeleteToppingTarget(t)} className="hover:text-danger"><Trash2 size={16} /></IconButton>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ConfirmDialog
        open={Boolean(deleteToppingTarget)}
        title={`¿Eliminar ${deleteToppingTarget?.name ?? ''}?`}
        text="Deja de ofrecerse en todos los productos."
        onConfirm={() => handleDeleteTopping(deleteToppingTarget)}
        onCancel={() => setDeleteToppingTarget(null)}
      />
    </div>
  )
}

// ── Recommended (carousel) tab ────────────────────────────────────────────────
const CarouselTab = ({ data }) => {
  const {
    carouselSlides, carouselLoading, carouselError, carouselSuccess,
    carouselAltText, setCarouselAltText,
    carouselLinkedId, setCarouselLinkedId,
    setCarouselImageFile,
    carouselProducts, carouselItemsLoading, menuItems,
    handleAddCarouselSlide, handleDeleteCarouselSlide, handleToggleSlideActive, handleSlideReorder,
    deleteSlideTarget, setDeleteSlideTarget,
    isSubmitting,
  } = data

  const productById = Object.fromEntries((menuItems || []).map((p) => [p.docId, p]))
  const dragIdx = useRef(null)

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="h-fit p-5 lg:col-span-2">
        <h3 className="font-display text-lg font-semibold text-ink">Nuevo recomendado</h3>
        <p className="mt-1 text-sm text-muted">Aparece en “Recomendados de la casa”, al inicio del menú.</p>
        <form onSubmit={handleAddCarouselSlide} className="mt-4 space-y-4">
          <Field label="Producto" htmlFor="c-product">
            {carouselItemsLoading ? <Skeleton className="h-11" /> : (
              <select id="c-product" className={inputCls} value={carouselLinkedId} onChange={(e) => setCarouselLinkedId(e.target.value)}>
                <option value="">Elige un producto</option>
                {carouselProducts.map((p) => <option key={p.docId} value={p.docId}>{p.name}</option>)}
              </select>
            )}
          </Field>
          <Field label="Frase gancho" htmlFor="c-alt" hint="Corta y con antojo. Por ejemplo: Recién salido del horno.">
            <input id="c-alt" className={inputCls} value={carouselAltText} onChange={(e) => setCarouselAltText(e.target.value)} maxLength={40} />
          </Field>
          <Field label="Foto (opcional)" htmlFor="c-img" hint="Sin foto se usa la ilustración del producto.">
            <input id="c-img" type="file" accept="image/*" onChange={(e) => setCarouselImageFile(e.target.files?.[0] ?? null)} className="block w-full text-sm text-muted file:mr-3 file:h-9 file:rounded-full file:border-0 file:bg-secondary file:px-4 file:text-sm file:font-semibold file:text-ink" />
          </Field>
          {carouselError && <Notice tone="error">{carouselError}</Notice>}
          {carouselSuccess && <Notice>{carouselSuccess}</Notice>}
          <Button type="submit" block disabled={isSubmitting}>{isSubmitting ? 'Guardando…' : 'Agregar a recomendados'}</Button>
        </form>
      </Card>

      <Card className="overflow-hidden lg:col-span-3">
        {carouselLoading ? (
          <div className="space-y-3 p-5">{[1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : carouselSlides.length === 0 ? (
          <EmptyState icon={Star} title="Sin recomendados" text="Elige tus productos estrella para destacarlos." />
        ) : (
          <ul className="divide-y divide-line">
            {carouselSlides.map((slide, idx) => {
              const product = productById[slide.linkedId]
              return (
                <li
                  key={slide.id}
                  draggable
                  onDragStart={() => { dragIdx.current = idx }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => { if (dragIdx.current !== null) handleSlideReorder(dragIdx.current, idx); dragIdx.current = null }}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <GripVertical size={18} className="hidden shrink-0 cursor-grab text-subtle md:block" aria-hidden="true" />
                  <ProductArt product={slide.imageUrl ? { ...product, imageUrl: slide.imageUrl } : product} className="h-12 w-12 shrink-0" rounded="rounded-xl" iconSize={22} />
                  <div className="min-w-0 flex-1">
                    <p className={cx('truncate font-semibold', slide.active ? 'text-ink' : 'text-subtle')}>{product?.name ?? 'Producto eliminado'}</p>
                    <p className="truncate text-xs text-muted">{slide.altText || 'Sin frase'}</p>
                  </div>
                  <Switch label={slide.active ? 'Ocultar del menú' : 'Mostrar en el menú'} checked={!!slide.active} onChange={() => handleToggleSlideActive(slide)} />
                  <IconButton size="sm" label="Quitar de recomendados" onClick={() => setDeleteSlideTarget(slide)} className="hover:text-danger"><Trash2 size={16} /></IconButton>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <ConfirmDialog
        open={Boolean(deleteSlideTarget)}
        title="¿Quitar de recomendados?"
        text="El producto sigue en el menú; solo deja de destacarse."
        confirmLabel="Quitar"
        loading={carouselLoading}
        onConfirm={() => handleDeleteCarouselSlide(deleteSlideTarget)}
        onCancel={() => setDeleteSlideTarget(null)}
      />
    </div>
  )
}

// ── Main MenuEditor view ──────────────────────────────────────────────────────
const TABS = [
  { value: 'products', label: 'Productos' },
  { value: 'toppings', label: 'Extras' },
  { value: 'carousel', label: 'Recomendados' },
]

export const MenuEditor = () => {
  const data = useAdminData()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState(location.state?.tab ?? 'products')

  useEffect(() => {
    data.loadMenuItems()
    data.loadMenuSections()
    data.loadToppings()
    data.loadCarouselSlides()
    data.loadCarouselLinkedItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented options={TABS} value={activeTab} onChange={setActiveTab} />
        <a href="/menu" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-muted underline-offset-4 hover:text-ink hover:underline">
          Los cambios se ven al instante en el menú público
        </a>
      </div>
      {activeTab === 'products' && <ProductsTab data={data} />}
      {activeTab === 'toppings' && <ToppingsTab data={data} />}
      {activeTab === 'carousel' && <CarouselTab data={data} />}
    </div>
  )
}
