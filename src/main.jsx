import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { Home } from './views/Home'
import { RegisterProvider } from './context/RegisterContext'

// The admin panel is loaded on demand so the public menu stays light.
const named = (loader, name) => lazy(() => loader().then((m) => ({ default: m[name] })))
const AdminLayout = named(() => import('./views/admin/AdminLayout'), 'AdminLayout')
const Overview = named(() => import('./views/admin/Overview'), 'Overview')
const Orders = named(() => import('./views/admin/Orders'), 'Orders')
const Metrics = named(() => import('./views/admin/Metrics'), 'Metrics')
const Promos = named(() => import('./views/admin/Promos'), 'Promos')
const MenuEditor = named(() => import('./views/admin/MenuEditor'), 'MenuEditor')
const POS = named(() => import('./views/admin/POS'), 'POS')
const Customers = named(() => import('./views/admin/Customers'), 'Customers')
const Register = named(() => import('./views/admin/Register'), 'Register')
const SmartPinGate = named(() => import('./components/admin/PinGate'), 'SmartPinGate')

const Loading = () => (
  <div className="flex h-dvh items-center justify-center bg-bg">
    <img src="/logo.svg" alt="Cargando" className="h-12 w-12 animate-pulse" />
  </div>
)

// Routes
//   /                      redirects to /menu
//   /menu                  full customer menu (demo café)
//   /menu/:category        menu filtered by section category (bebidas, alimentos)
//   /admin/*               admin panel (no login in the demo; optional PIN locks)

const gated = (routeKey, element) => <SmartPinGate routeKey={routeKey}>{element}</SmartPinGate>

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <RegisterProvider>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Navigate to="/menu" replace />} />
            <Route path="/menu/:category?" element={<Home />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={gated('overview', <Overview />)} />
              <Route path="pedidos" element={gated('pedidos', <Orders />)} />
              <Route path="metricas" element={gated('metricas', <Metrics />)} />
              <Route path="promociones" element={gated('promociones', <Promos />)} />
              <Route path="menu" element={gated('menu', <MenuEditor />)} />
              <Route path="pos" element={gated('pos', <POS />)} />
              <Route path="clientes" element={gated('clientes', <Customers />)} />
              <Route path="caja" element={gated('caja', <Register />)} />
            </Route>
            <Route path="*" element={<Navigate to="/menu" replace />} />
          </Routes>
        </Suspense>
      </RegisterProvider>
    </BrowserRouter>
  </StrictMode>,
)
