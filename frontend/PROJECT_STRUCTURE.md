# Estructura del Proyecto Frontend - Contable Autónoma

## Descripción General
Aplicación React para gestión contable autónoma con integración Supabase, OCR y generación de facturas PDF.

## Tecnologías Principales
- **React 19.2.5** - Framework principal
- **React Router DOM** - Navegación
- **Axios** - Cliente HTTP para API
- **Lucide React** - Iconos
- **Supabase** - Backend y autenticación
- **Tesseract.js** - OCR para documentos
- **jsPDF** - Generación de PDFs

## Estructura de Directorios

```
frontend/
├── public/                          # Archivos estáticos públicos
│   ├── index.html                   # Template HTML principal
│   ├── manifest.json                # Configuración PWA
│   ├── robots.txt                   # Configuración SEO
│   ├── favicon.ico                  # Icono de la aplicación
│   ├── logo192.png                  # Logo PWA pequeño
│   └── logo512.png                  # Logo PWA grande
│
├── src/                             # Código fuente de la aplicación
│   ├── components/                  # Componentes reutilizables
│   │   ├── AppLayout.jsx            # Layout principal con navegación
│   │   ├── DashboardComponents.jsx  # Componentes del dashboard
│   │   ├── Navbar.jsx               # Barra de navegación
│   │   ├── OcrUploader.jsx          # Componente para subir y procesar OCR
│   │   └── ProfileAlert.jsx         # Alerta de perfil incompleto
│   │
│   ├── config/                      # Configuraciones de la aplicación
│   │   ├── api.js                   # Cliente HTTP con configuración dinámica
│   │   └── supabase.js              # Configuración de Supabase
│   │
│   ├── hooks/                       # Hooks personalizados
│   │   ├── useDashboard.js          # Lógica del dashboard
│   │   ├── useExpenses.js           # Gestión de gastos
│   │   ├── useIncome.js             # Gestión de ingresos
│   │   └── useInvoice.js            # Gestión de facturas
│   │
│   ├── pages/                       # Páginas/componentes de rutas
│   │   ├── Dashboard.jsx            # Página principal del dashboard
│   │   ├── ExpenseForm.jsx          # Formulario de gastos
│   │   ├── IncomeForm.jsx           # Formulario de ingresos
│   │   ├── InvoiceView.jsx          # Vista de factura individual
│   │   ├── Login.jsx                # Página de autenticación
│   │   ├── Movements.jsx            # Lista de movimientos
│   │   └── Profile.jsx              # Perfil del usuario
│   │
│   ├── styles/                      # Estilos CSS
│   │   ├── base.css                 # Estilos base y resets
│   │   ├── components.css           # Estilos de componentes
│   │   ├── layout.css               # Estilos de layout
│   │   └── tokens.css               # Variables CSS (colores, espaciado)
│   │
│   ├── utils/                       # Utilidades
│   │   └── generateInvoicePDF.js    # Generación de PDFs de facturas
│   │
│   ├── App.jsx                      # Componente raíz de la aplicación
│   ├── App.css                      # Estilos específicos de App
│   ├── App.test.js                  # Tests de App
│   ├── index.js                     # Punto de entrada de React
│   ├── index.css                    # Estilos globales
│   ├── logo.svg                     # Logo SVG
│   ├── reportWebVitals.js           # Reporte de métricas web
│   └── setupTests.js                # Configuración de tests
│
├── .env                             # Variables de entorno
├── .gitignore                       # Archivos ignorados por Git
├── package.json                     # Dependencias y scripts
├── package-lock.json                # Lockfile de dependencias
└── README.md                        # Documentación del proyecto
```

## Arquitectura de Componentes

### Páginas (Pages)
- **Dashboard**: Vista principal con métricas, alertas fiscales y movimientos recientes
- **IncomeForm**: Formulario para añadir ingresos con OCR automático
- **ExpenseForm**: Formulario para añadir gastos
- **InvoiceView**: Vista detallada de una factura específica
- **Profile**: Gestión del perfil fiscal del autónomo
- **Movements**: Lista completa de todos los movimientos
- **Login**: Autenticación de usuarios

### Componentes Reutilizables
- **AppLayout**: Layout principal con sidebar y navegación
- **DashboardComponents**: Conjunto de componentes específicos del dashboard
- **OcrUploader**: Componente para subir archivos y procesar OCR
- **ProfileAlert**: Notificación cuando el perfil está incompleto

### Hooks Personalizados
- **useDashboard**: Maneja toda la lógica del dashboard
- **useIncome**: Gestión del formulario de ingresos
- **useExpenses**: Gestión del formulario de gastos
- **useInvoice**: Carga y gestión de facturas individuales

## Sistema de Estilos

### Diseño System (CUADRA)
- **tokens.css**: Variables CSS para colores, tipografía y espaciado
- **base.css**: Estilos base y normalización
- **layout.css**: Estilos de layout y navegación
- **components.css**: Estilos de componentes específicos

### Variables CSS Principales
```css
/* Colores */
--color-brand-500: #3b82f6
--color-accent-500: #10b981
--color-error-500: #ef4444

/* Espaciado */
--space-1: 0.25rem
--space-2: 0.5rem
--space-3: 0.75rem
...

/* Tipografía */
--font-semibold: 600
--text-sm: 0.875rem
--text-base: 1rem
...
```

## API y Backend

### Endpoints Principales
- `GET /income` - Lista de ingresos
- `GET /expenses` - Lista de gastos
- `GET /profile` - Perfil del usuario
- `PUT /profile` - Actualizar perfil
- `POST /income` - Crear ingreso
- `POST /expenses` - Crear gasto
- `GET /ocr` - Procesar OCR

### Configuración API
- **api.js**: Cliente Axios con configuración dinámica de URL
- Soporte para variables de entorno: `REACT_APP_API_URL`, `REACT_APP_API_HOST`, `REACT_APP_API_PORT`
- Fallback automático al hostname del navegador

## Funcionalidades Clave

### Gestión Financiera
- ✅ Ingresos y gastos con categorías
- ✅ Cálculos fiscales automáticos (IVA, IRPF)
- ✅ Alertas fiscales por trimestre
- ✅ Generación de facturas PDF

### OCR y Automatización
- ✅ Procesamiento automático de documentos
- ✅ Extracción de fechas e importes
- ✅ Integración con Tesseract.js

### Perfil Fiscal
- ✅ Gestión completa del perfil autónomo
- ✅ Validación de datos fiscales
- ✅ Integración con facturación

### UI/UX
- ✅ Diseño responsive
- ✅ Tema CUADRA consistente
- ✅ Componentes reutilizables
- ✅ Navegación intuitiva

## Scripts Disponibles

```bash
npm start          # Inicia servidor de desarrollo
npm run build      # Construye para producción
npm test           # Ejecuta tests
npm run eject      # Expone configuración de Create React App
```

## Variables de Entorno

```env
REACT_APP_SUPABASE_URL=https://xxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
REACT_APP_API_URL=http://localhost:3000  # Opcional
REACT_APP_API_HOST=192.168.1.19         # Opcional
REACT_APP_API_PORT=3000                 # Opcional
```

## Notas de Desarrollo

- El proyecto usa Create React App como base
- Los estilos siguen el sistema de diseño CUADRA
- La API del backend está separada y se comunica vía HTTP
- Todas las llamadas a Supabase pasan por el backend (no llamadas directas desde frontend)
- El OCR se procesa en el backend para mayor seguridad y rendimiento</content>
<parameter name="filePath">/Users/yuri/Documents/Proyecto/contable-autonoma/contable-autonoma/frontend/PROJECT_STRUCTURE.md