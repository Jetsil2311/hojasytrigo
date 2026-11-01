import {
  LayoutDashboard, ClipboardList, BarChart3, Tag, UtensilsCrossed,
  ShoppingCart, Users, Landmark,
} from 'lucide-react'

// Single source of truth for admin navigation (sidebar, bottom bar, titles).
export const ADMIN_NAV = [
  {
    label: 'Operación',
    items: [
      { name: 'Resumen', path: '/admin', icon: LayoutDashboard, end: true, key: 'overview', title: 'Resumen del día' },
      { name: 'Punto de venta', short: 'POS', path: '/admin/pos', icon: ShoppingCart, key: 'pos', title: 'Punto de venta' },
      { name: 'Pedidos', path: '/admin/pedidos', icon: ClipboardList, key: 'pedidos', title: 'Pedidos' },
      { name: 'Caja', path: '/admin/caja', icon: Landmark, key: 'caja', title: 'Caja' },
    ],
  },
  {
    label: 'Negocio',
    items: [
      { name: 'Menú', path: '/admin/menu', icon: UtensilsCrossed, key: 'menu', title: 'Editor de menú' },
      { name: 'Clientes', path: '/admin/clientes', icon: Users, key: 'clientes', title: 'Clientes' },
      { name: 'Promociones', path: '/admin/promociones', icon: Tag, key: 'promociones', title: 'Promociones' },
      { name: 'Métricas', path: '/admin/metricas', icon: BarChart3, key: 'metricas', title: 'Métricas' },
    ],
  },
]

export const ALL_ADMIN_ITEMS = ADMIN_NAV.flatMap((g) => g.items)

export const findAdminItem = (pathname) =>
  ALL_ADMIN_ITEMS.find((i) => i.path === pathname) ?? ALL_ADMIN_ITEMS[0]
