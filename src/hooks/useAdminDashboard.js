import { useEffect, useState } from 'react'
import { db, collection, onSnapshot } from '../demo/store'

const EMPTY_STATS = {
  ordersToday: 0,
  revenueToday: 0,
  avgTicket: 0,
  activeOrders: 0,
  prevOrdersToday: 0,
  prevRevenueToday: 0,
}

// Live dashboard numbers computed from the orders collection.
export const useAdminDashboard = () => {
  const [stats, setStats] = useState(EMPTY_STATS)
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    return onSnapshot(
      collection(db, 'orders'),
      (snapshot) => {
        const orders = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.() ?? new Date() }))
          .sort((a, b) => b.createdAt - a.createdAt)

        const now = new Date()
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
        const startOfYesterday = startOfToday - 86400000
        // Compare against yesterday up to the same time of day, so the trend is fair.
        const sameTimeYesterday = now.getTime() - 86400000

        const next = { ...EMPTY_STATS }
        let totalRev = 0
        orders.forEach((order) => {
          const time = order.createdAt.getTime()
          const total = Number(order.total || 0)
          totalRev += total
          if (time >= startOfToday) {
            next.ordersToday++
            next.revenueToday += total
            if (['nuevo', 'preparando', 'listo'].includes(String(order.status || 'nuevo').toLowerCase())) next.activeOrders++
          } else if (time >= startOfYesterday && time <= sameTimeYesterday) {
            next.prevOrdersToday++
            next.prevRevenueToday += total
          }
        })
        next.avgTicket = orders.length ? totalRev / orders.length : 0

        setStats(next)
        setRecentOrders(orders.slice(0, 10))
        setError(null)
        setLoading(false)
      },
      () => {
        setError('No se pudieron cargar los pedidos.')
        setLoading(false)
      }
    )
  }, [])

  return { stats, recentOrders, loading, error }
}
