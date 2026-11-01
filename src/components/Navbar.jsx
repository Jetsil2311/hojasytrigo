import { NavLink, Link } from 'react-router'
import { LayoutDashboard } from 'lucide-react'
import { BUSINESS_NAME } from '../config/demo'
import { cx } from './ui'

const LINKS = [
  { to: '/menu', label: 'Todo', end: true },
  { to: '/menu/bebidas', label: 'Bebidas' },
  { to: '/menu/alimentos', label: 'Alimentos' },
]

// Sticky top bar: brand, category switch and a shortcut to the admin demo.
export const Navbar = () => (
  <header className="sticky top-0 z-30 border-b-2 border-accent bg-primary text-on-primary">
    <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
      <Link to="/menu" className="flex min-w-0 items-center gap-2.5" aria-label={`${BUSINESS_NAME}, inicio del menú`}>
        <img src="/logo.svg" alt="" width="36" height="36" className="h-9 w-9 shrink-0" />
        <span translate="no" className="font-wide truncate font-display text-base font-extrabold uppercase tracking-tight text-on-primary">{BUSINESS_NAME}</span>
      </Link>

      <nav aria-label="Categorías" className="ml-auto hidden items-center gap-1 rounded-full bg-on-primary/10 p-1 sm:flex">
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              cx(
                'inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold transition-colors duration-200',
                isActive ? 'bg-accent text-on-accent' : 'text-on-primary/75 hover:text-on-primary',
              )
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>

      <Link
        to="/admin"
        className="ml-auto inline-flex h-10 items-center gap-2 rounded-full border border-on-primary/25 px-3.5 text-sm font-semibold text-on-primary transition-colors hover:bg-on-primary/10 sm:ml-2"
      >
        <LayoutDashboard size={16} strokeWidth={2} />
        <span>Panel</span>
      </Link>
    </div>

  </header>
)

// Category switch for phones. Lives in the page header (not the sticky bar) so
// the sticky chrome stays short on small screens.
export const CategorySwitch = () => (
  <nav aria-label="Categorías" className="sm:hidden">
    <div className="grid grid-cols-3 gap-1 rounded-full bg-on-primary/10 p-1">
      {LINKS.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.end}
          className={({ isActive }) =>
            cx(
              'flex h-10 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-200',
              isActive ? 'bg-accent text-on-accent' : 'text-on-primary/75',
            )
          }
        >
          {l.label}
        </NavLink>
      ))}
    </div>
  </nav>
)
