import { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router'
import { MoreHorizontal, ExternalLink, RotateCcw } from 'lucide-react'
import { ALL_ADMIN_ITEMS } from './navItems'
import { resetDemoData } from '../../demo/store'
import { ConfirmDialog, Dialog, cx } from '../ui'

const PRIMARY_KEYS = ['overview', 'pos', 'pedidos', 'caja']
const PRIMARY_TABS = ALL_ADMIN_ITEMS.filter((i) => PRIMARY_KEYS.includes(i.key))
const MORE_ITEMS = ALL_ADMIN_ITEMS.filter((i) => !PRIMARY_KEYS.includes(i.key))

export const BottomTabBar = () => {
  const [moreOpen, setMoreOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => { setMoreOpen(false) }, [location.pathname])

  const isMoreActive = MORE_ITEMS.some((item) => location.pathname === item.path)

  const tabCls = (active) =>
    cx(
      'flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors select-none',
      active ? 'text-ink' : 'text-subtle',
    )

  const iconWrap = (active) =>
    cx('flex h-8 w-14 items-center justify-center rounded-full transition-colors', active && 'bg-accent text-on-accent')

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur-md md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        aria-label="Panel"
      >
        <div className="flex h-16 items-stretch">
          {PRIMARY_TABS.map((tab) => (
            <NavLink key={tab.path} to={tab.path} end={tab.end} className={({ isActive }) => tabCls(isActive)}>
              {({ isActive }) => (
                <>
                  <span className={iconWrap(isActive)}><tab.icon size={20} /></span>
                  {tab.short ?? tab.name}
                </>
              )}
            </NavLink>
          ))}
          <button type="button" onClick={() => setMoreOpen(true)} className={tabCls(isMoreActive)}>
            <span className={iconWrap(isMoreActive)}><MoreHorizontal size={20} /></span>
            Más
          </button>
        </div>
      </nav>

      <Dialog open={moreOpen} onClose={() => setMoreOpen(false)} title="Más opciones" size="sm">
        <div className="grid grid-cols-2 gap-2 pt-1">
          {MORE_ITEMS.map((item) => {
            const active = location.pathname === item.path
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className={cx(
                  'flex min-h-20 flex-col items-start justify-between gap-3 rounded-2xl border p-4 text-left text-sm font-semibold transition-colors',
                  active ? 'border-primary bg-primary text-on-primary' : 'border-line bg-surface text-ink hover:bg-surface-2',
                )}
              >
                <item.icon size={20} />
                {item.name}
              </button>
            )
          })}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <a href="/menu" target="_blank" rel="noopener noreferrer" className="flex h-11 items-center justify-center gap-2 rounded-full bg-secondary text-sm font-semibold text-ink">
            <ExternalLink size={16} /> Ver menú
          </a>
          <button type="button" onClick={() => setConfirmReset(true)} className="flex h-11 items-center justify-center gap-2 rounded-full bg-secondary text-sm font-semibold text-ink">
            <RotateCcw size={16} /> Reiniciar demo
          </button>
        </div>
      </Dialog>

      <ConfirmDialog
        open={confirmReset}
        title="¿Reiniciar la demo?"
        text="Se borran los pedidos, clientes y cambios que hiciste en este navegador y vuelven los datos de ejemplo."
        confirmLabel="Reiniciar"
        onConfirm={() => { resetDemoData(); setConfirmReset(false); setMoreOpen(false) }}
        onCancel={() => setConfirmReset(false)}
      />
    </>
  )
}
