import { useState, useEffect, Suspense } from 'react'
import { Outlet, useLocation } from 'react-router'
import { db, doc, onSnapshot } from '../../demo/store'
import { Sidebar } from '../../components/admin/Sidebar'
import { Topbar } from '../../components/admin/Topbar'
import { BottomTabBar } from '../../components/admin/BottomTabBar'
import { BUSINESS_NAME } from '../../config/demo'

// Every screen starts unlocked in the demo. Owners can lock any screen with
// the PIN from the lock button in the top bar.
const DEFAULT_PIN_GATE = {
  overview: false, metricas: false, promociones: false, menu: false,
  pedidos: false, pos: false, clientes: false, caja: false,
}

export const AdminLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try { return localStorage.getItem('admin_sidebar_collapsed') === 'true' } catch { return false }
  })

  // The POS is a full-bleed workspace; every other screen gets the page container.
  const isFullBleed = useLocation().pathname === '/admin/pos'

  // Per-screen PIN gate config — settings/general.pinGateConfig
  const [pinGateConfig, setPinGateConfig] = useState(null)

  useEffect(() => { document.title = `Panel · ${BUSINESS_NAME}` }, [])

  useEffect(() => {
    return onSnapshot(
      doc(db, 'settings', 'general'),
      (snap) => setPinGateConfig({ ...DEFAULT_PIN_GATE, ...(snap.exists() ? snap.data().pinGateConfig : {}) }),
      () => setPinGateConfig(DEFAULT_PIN_GATE)
    )
  }, [])

  return (
    <div className="flex h-dvh overflow-hidden bg-bg">
      <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed((v) => !v)} />

      <div className={`flex min-w-0 flex-1 flex-col overflow-hidden transition-[margin] duration-300 ${isCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <Topbar pinGateConfig={pinGateConfig} />

        {isFullBleed ? (
          <main className="flex-1 overflow-hidden pb-16 md:pb-0">
            <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-secondary" />}><Outlet context={{ pinGateConfig }} /></Suspense>
          </main>
        ) : (
          <main className="flex-1 overflow-y-auto px-4 pt-5 pb-28 md:px-8 md:pt-8 md:pb-10">
            <div className="mx-auto w-full max-w-7xl">
              <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-secondary" />}><Outlet context={{ pinGateConfig }} /></Suspense>
            </div>
          </main>
        )}
      </div>

      {/* Mobile bottom navigation — the sidebar handles navigation on md+ */}
      <BottomTabBar />
    </div>
  )
}
