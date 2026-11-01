import { useEffect, useState } from 'react'
import { NavLink } from 'react-router'
import { PanelLeftClose, PanelLeftOpen, ExternalLink, RotateCcw } from 'lucide-react'
import PropTypes from 'prop-types'
import { ADMIN_NAV } from './navItems'
import { BUSINESS_NAME } from '../../config/demo'
import { resetDemoData } from '../../demo/store'
import { ConfirmDialog, cx } from '../ui'

// Label shown next to icons when the sidebar is collapsed.
const NavTooltip = ({ show, children }) =>
  show ? (
    <span className="pointer-events-none absolute left-full z-50 ml-3 rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-on-primary opacity-0 shadow-pop transition-opacity group-hover:opacity-100">
      {children}
    </span>
  ) : null

NavTooltip.propTypes = { show: PropTypes.bool, children: PropTypes.node }

export const Sidebar = ({ isCollapsed, onToggle }) => {
  const [confirmReset, setConfirmReset] = useState(false)

  // Persist collapse preference
  useEffect(() => {
    try { localStorage.setItem('admin_sidebar_collapsed', isCollapsed) } catch { /* private mode */ }
  }, [isCollapsed])

  const itemCls = ({ isActive }) =>
    cx(
      'group relative flex h-11 items-center gap-3 rounded-full px-3.5 text-sm font-semibold transition-colors duration-200',
      isActive ? 'bg-primary text-on-primary' : 'text-muted hover:bg-secondary hover:text-ink',
      isCollapsed && 'justify-center px-0',
    )

  return (
    <aside
      className={cx(
        'fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-line bg-surface transition-[width] duration-300 md:flex',
        isCollapsed ? 'w-20' : 'w-64',
      )}
    >
      <div className={cx('flex h-16 shrink-0 items-center gap-2.5 px-4', isCollapsed && 'justify-center px-0')}>
        <img src="/logo.svg" alt="" className="h-9 w-9 shrink-0" />
        {!isCollapsed && (
          <div className="min-w-0 leading-tight">
            <p translate="no" className="truncate font-display text-base font-bold text-ink">{BUSINESS_NAME}</p>
            <p className="text-xs font-medium text-subtle">Panel de administración</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Panel">
        {ADMIN_NAV.map((group) => (
          <div key={group.label}>
            {!isCollapsed && <p className="px-3.5 pb-2 text-xs font-semibold text-subtle">{group.label}</p>}
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink key={item.path} to={item.path} end={item.end} className={itemCls} aria-label={item.name}>
                  <item.icon size={19} strokeWidth={2} className="shrink-0" />
                  {!isCollapsed && <span>{item.name}</span>}
                  <NavTooltip show={isCollapsed}>{item.name}</NavTooltip>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 space-y-1 border-t border-line p-3">
        <a href="/menu" target="_blank" rel="noopener noreferrer" className={itemCls({ isActive: false })} aria-label="Ver menú público">
          <ExternalLink size={19} className="shrink-0" />
          {!isCollapsed && <span>Ver menú público</span>}
          <NavTooltip show={isCollapsed}>Ver menú público</NavTooltip>
        </a>
        <button type="button" onClick={() => setConfirmReset(true)} className={cx(itemCls({ isActive: false }), 'w-full')} aria-label="Reiniciar datos de la demo">
          <RotateCcw size={19} className="shrink-0" />
          {!isCollapsed && <span>Reiniciar demo</span>}
          <NavTooltip show={isCollapsed}>Reiniciar demo</NavTooltip>
        </button>
        <button type="button" onClick={onToggle} className={cx(itemCls({ isActive: false }), 'w-full')} aria-label={isCollapsed ? 'Expandir menú' : 'Contraer menú'}>
          {isCollapsed ? <PanelLeftOpen size={19} className="shrink-0" /> : <PanelLeftClose size={19} className="shrink-0" />}
          {!isCollapsed && <span>Contraer</span>}
        </button>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="¿Reiniciar la demo?"
        text="Se borran los pedidos, clientes y cambios que hiciste en este navegador y vuelven los datos de ejemplo."
        confirmLabel="Reiniciar"
        onConfirm={() => { resetDemoData(); setConfirmReset(false) }}
        onCancel={() => setConfirmReset(false)}
      />
    </aside>
  )
}

Sidebar.propTypes = {
  isCollapsed: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
}
