/**
 * AppLayout.jsx
 * Layout principal de la app — sidebar fijo + topbar + contenido.
 *
 * Usa las clases CSS de layout.css y tokens.css sin añadir estilos inline.
 * Clases principales: .app-shell, .sidebar, .main-content, .topbar, .page-content
 *
 * Uso en App.jsx:
 *   <AppLayout session={session} currentPage="resumen">
 *     <Dashboard session={session} />
 *   </AppLayout>
 */

import { useState } from 'react';
import { supabase } from '../config/supabase';

// Iconos SVG inline — sin dependencia de lucide-react
// Si ya tienes lucide-react instalado, puedes reemplazarlos
const Icon = ({ name, size = 20 }) => {
  const icons = {
    resumen: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
    ingresos: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
      </svg>
    ),
    gastos: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>
      </svg>
    ),
    clientes: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    proveedores: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/>
        <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
    impuestos: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="9"/>
        <line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="15" x2="15.01" y2="15"/>
      </svg>
    ),
    menu: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    ),
    close: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    ),
    bell: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
    logout: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
    ),
  };
  return icons[name] ?? null;
};

// ─── Isotipo CUADRA (SVG simple) ──────────────────────────────────────────
const CuadraIsotipo = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="28" height="28" rx="7" fill="#1A56FF"/>
    {/* Cuadro superior izquierda */}
    <rect x="5" y="5" width="8" height="8" rx="1.5" fill="white" opacity="0.4"/>
    {/* Cuadro superior derecha */}
    <rect x="15" y="5" width="8" height="8" rx="1.5" fill="white" opacity="0.4"/>
    {/* Cuadro inferior izquierda */}
    <rect x="5" y="15" width="8" height="8" rx="1.5" fill="white" opacity="0.4"/>
    {/* Cuadro inferior derecha con checkmark */}
    <rect x="15" y="15" width="8" height="8" rx="1.5" fill="white"/>
    <polyline points="17,19 18.5,21 22,17" stroke="#1A56FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─── Definición de la navegación ──────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'resumen',      label: 'Resumen',      icon: 'resumen',     href: '/dashboard' },
  { id: 'ingresos',     label: 'Ingresos',     icon: 'ingresos',    href: '/income' },
  { id: 'gastos',       label: 'Gastos',       icon: 'gastos',      href: '/expenses' },
  { id: 'clientes',     label: 'Clientes',     icon: 'clientes',    href: '/clients' },
  { id: 'proveedores',  label: 'Proveedores',  icon: 'proveedores', href: '/suppliers' },
  { id: 'impuestos',    label: 'Impuestos',    icon: 'impuestos',   href: '/taxes',    badge: '12d' },
];

// Títulos de página por sección
const PAGE_TITLES = {
  resumen:     'Resumen',
  ingresos:    'Ingresos',
  gastos:      'Gastos',
  clientes:    'Clientes',
  proveedores: 'Proveedores',
  impuestos:   'Impuestos',
};

// ─── Componente principal ──────────────────────────────────────────────────
export default function AppLayout({ session, currentPage = 'resumen', children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const closeSidebar = () => setSidebarOpen(false);

  // Email del usuario (para el footer del sidebar)
  const userEmail = session?.user?.email ?? '';
  // Nombre: parte antes del @ o el email completo si es corto
  const userName = userEmail.split('@')[0] ?? 'Usuario';

  return (
    <div className="app-shell">

      {/* ── Overlay móvil (cierra el drawer al tocar fuera) ─────────── */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>

        {/* Logo */}
        <a href="/dashboard" className="sidebar-brand" onClick={closeSidebar}>
          <CuadraIsotipo />
          <span className="sidebar-brand-name">CUADRA</span>
        </a>

        {/* Navegación */}
        <nav className="sidebar-nav" aria-label="Navegación principal">

          <span className="sidebar-section-label">Principal</span>

          {NAV_ITEMS.map(item => (
            <a
              key={item.id}
              href={item.href}
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={closeSidebar}
              aria-current={currentPage === item.id ? 'page' : undefined}
            >
              <span className="nav-item-icon">
                <Icon name={item.icon} size={20} />
              </span>
              <span>{item.label}</span>
              {/* Badge de alerta (ej: días para presentar impuestos) */}
              {item.badge && (
                <span className="nav-badge">{item.badge}</span>
              )}
            </a>
          ))}

        </nav>

        {/* Footer — usuario + logout */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--color-brand-50)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 'var(--font-bold)',
              color: 'var(--color-brand-600)',
              flexShrink: 0,
            }}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="sidebar-user-name truncate">{userName}</p>
              <p className="sidebar-user-email truncate">{userEmail}</p>
            </div>
            <button
              onClick={handleLogout}
              style={{ color: 'var(--text-secondary)', flexShrink: 0 }}
              title="Cerrar sesión"
            >
              <Icon name="logout" size={16} />
            </button>
          </div>
        </div>

      </aside>

      {/* ── Área principal ────────────────────────────────────────────── */}
      <div className="main-content">

        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            {/* Botón hamburguesa — solo en mobile */}
            <button
              className="btn-menu"
              onClick={() => setSidebarOpen(prev => !prev)}
              aria-label="Abrir menú"
            >
              <Icon name={sidebarOpen ? 'close' : 'menu'} size={20} />
            </button>
            <h1 className="topbar-title">
              {PAGE_TITLES[currentPage] ?? 'CUADRA'}
            </h1>
          </div>

          <div className="topbar-right">
            {/* Botón de notificaciones */}
            <button className="btn-icon btn-icon-dot" title="Notificaciones" aria-label="Notificaciones">
              <Icon name="bell" size={18} />
            </button>
          </div>
        </header>

        {/* Contenido de la página */}
        <main className="page-content">
          {children}
        </main>

      </div>
    </div>
  );
}
