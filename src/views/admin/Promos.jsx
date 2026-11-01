import { useState, useEffect } from 'react'
import { db, collection, query, addDoc, serverTimestamp, updateDoc, doc, writeBatch, onSnapshot } from '../../demo/store'
import { CheckCircle2, ExternalLink, Megaphone, Tag } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Field, Skeleton, Switch, cx, inputCls } from '../../components/ui'

export const Promos = () => {
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    return onSnapshot(query(collection(db, 'promotions')), (snapshot) => {
      setPromos(
        snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0))
      )
      setLoading(false)
    })
  }, [])

  // Only one promotion is active at a time.
  const deactivateOthers = async (exceptId = null) => {
    const active = promos.filter((p) => p.isActive && p.id !== exceptId)
    if (!active.length) return
    const batch = writeBatch(db)
    active.forEach((p) => batch.update(doc(db, 'promotions', p.id), { isActive: false }))
    await batch.commit()
  }

  const handleCreatePromotion = async (e) => {
    e.preventDefault()
    if (!title.trim()) { setError('Dale un título a la promoción.'); return }
    setIsSubmitting(true)
    setError('')
    setSuccess('')
    try {
      await deactivateOthers()
      await addDoc(collection(db, 'promotions'), {
        title: title.trim(),
        message: message.trim(),
        isActive: true,
        createdAt: serverTimestamp(),
      })
      setTitle('')
      setMessage('')
      setSuccess('Listo. Ya se ve en el menú.')
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError('No se pudo activar la promoción.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const togglePromo = async (promo) => {
    if (!promo.isActive) await deactivateOthers(promo.id)
    await updateDoc(doc(db, 'promotions', promo.id), { isActive: !promo.isActive })
  }

  return (
    <div className="grid gap-6 animate-fade-in lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-2">
        <Card className="p-5 md:p-6">
          <h2 className="font-display text-xl font-semibold text-ink">Nueva promoción</h2>
          <p className="mt-1 text-sm text-muted">Aparece como aviso arriba del menú. Al activarla, la anterior se apaga.</p>

          <form onSubmit={handleCreatePromotion} className="mt-5 space-y-4">
            <Field label="Título" htmlFor="promo-title" error={error}>
              <input id="promo-title" className={inputCls} value={title} onChange={(e) => { setTitle(e.target.value); setError('') }} placeholder="2x1 en frappés" maxLength={60} />
            </Field>
            <Field label="Detalle (opcional)" htmlFor="promo-msg" hint="Horario, días o condiciones.">
              <textarea id="promo-msg" className={cx(inputCls, 'resize-none py-3')} rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Todos los jueves de 5 a 7 de la tarde." maxLength={120} />
            </Field>
            {success && (
              <p className="flex items-center gap-2 rounded-xl bg-success-soft px-3 py-2.5 text-sm font-semibold text-success"><CheckCircle2 size={16} /> {success}</p>
            )}
            <Button type="submit" block disabled={isSubmitting}>{isSubmitting ? 'Activando…' : 'Activar promoción'}</Button>
          </form>
        </Card>

        {/* Live preview of how the banner looks on the menu */}
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">Vista previa</p>
            <a href="/menu" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
              Ver menú <ExternalLink size={14} />
            </a>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-accent-soft p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent"><Megaphone size={18} /></span>
            <div className="min-w-0">
              <p className="truncate font-display font-semibold text-ink">{title || 'Título de tu promoción'}</p>
              <p className="truncate text-sm text-accent-ink">{message || 'Aquí va el detalle.'}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="lg:col-span-3">
        <h2 className="mb-3 font-display text-xl font-semibold text-ink">Tus promociones</h2>
        {loading ? (
          <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
        ) : promos.length === 0 ? (
          <Card><EmptyState icon={Tag} title="Sin promociones" text="Crea la primera y aparecerá en el menú al instante." /></Card>
        ) : (
          <ul className="space-y-3">
            {promos.map((promo) => (
              <li key={promo.id}>
                <Card className={cx('flex items-center gap-4 p-4 transition-colors', promo.isActive && 'border-primary')}>
                  <span className={cx('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', promo.isActive ? 'bg-accent text-on-accent' : 'bg-secondary text-muted')}>
                    <Tag size={19} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold text-ink">{promo.title}</p>
                      {promo.isActive && <Badge tone="success">En el menú</Badge>}
                    </div>
                    {promo.message && <p className="truncate text-sm text-muted">{promo.message}</p>}
                    <p className="text-xs text-subtle">Creada el {promo.createdAt?.toDate?.().toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}</p>
                  </div>
                  <Switch label={promo.isActive ? `Desactivar ${promo.title}` : `Activar ${promo.title}`} checked={!!promo.isActive} onChange={() => togglePromo(promo)} />
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
