import { useState, useContext, useMemo } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Tags, 
  History, 
  BarChart3, 
  PieChart,
  ArrowRightLeft, 
  Users, 
  LogOut,
  Menu,
  X,
  TrendingUp,
  FolderKanban,
  FileText,
  Info,
  CheckCircle,
  Sparkles,
  BarChart,
  Receipt,
  Building2,
  ShoppingBag,
  PackageX,
  Globe,
  Wand2,
  Calendar,
  Award,
  Search,
  PawPrint,
  Clock,
  Bot
} from 'lucide-react';

const UPDATES = [
  {
    version: '2.5.0',
    title: 'Programa de Afiliados',
    icon: Award,
    items: [
      'Nueva sección "Afiliados" para gestionar puntos, recompensas y clientes',
      'En el POS podés asignar la venta a un cliente (o crear uno al vuelo) y gana puntos automáticamente',
      'Regla de puntos configurable: cada $X gastados = 1 punto (default: cada $200)',
      'Recompensas configurables: descuento en efectivo, descuento %, producto del catálogo o regalo/obsequio',
      'Los clientes afiliados acumulan sus compras y puntos para siempre',
      'Si olvidaste asignar el cliente en el POS, podés hacerlo desde la sección Ventas',
      'Los canjes descuentan puntos y registran el historial del cliente'
    ]
  },
  {
    version: '2.4.0',
    title: 'Calendario',
    icon: Calendar,
    items: [
      'Nueva sección "Calendario" para ver TODO lo pendiente en un solo lugar',
      'Vista mensual con todas tus tareas, pagos, compras y servicios por día',
      'Eventos recurrentes: programá compras o pagos fijos (semanal, mensual, etc.) y se generan solos las próximas ocurrencias',
      'Edición completa: cambiá fecha, frecuencia o cualquier dato de un evento, o de toda la serie recurrente (las próximas ocurrencias se regeneran solas)',
      'Eventos de pago vinculados a proveedores y clientes',
      'Se integran automáticamente las órdenes de compra pendientes, los presupuestos pendientes y los gastos registrados',
      'Panel de pendientes: vencidos, hoy, próximos 7 días y más adelante'
    ]
  },
  {
    version: '2.3.0',
    title: 'Ayuda al Vendedor (IA)',
    icon: Wand2,
    items: [
      'Nueva sección "Ayuda al Vendedor" para recomendar productos según lo que pide el cliente',
      'Escribís la consulta del cliente y el asistente busca en el catálogo los productos en stock que mejor la resuelven',
      'Usa las descripciones de cada producto para encontrar el match correcto',
      'Modo "Internet": buscá precios y comparaciones reales de cualquier producto con solo nombre + referencia',
      'Nuevo modo "Comparar": elegí de 2 a 4 productos de la tienda y la IA arma una comparación detallada (propiedades, ingredientes, precio por kilo, puntos fuertes/débiles y veredicto), sin dejar elegir el mismo producto dos veces',
      'Podés agregar las recomendaciones directamente al carrito y finalizar en el Punto de Venta'
    ]
  },
  {
    version: '2.2.0',
    title: 'Promociones con IA',
    icon: Sparkles,
    items: [
      'Nueva sección "Promociones" para crear combos con ayuda de IA (ChatGPT)',
      'Seleccionás un producto principal y la IA arma promociones combinándolo con el catálogo',
      'Cada promoción muestra costo, precio, ganancia y margen',
      'Las promociones activas se pueden vender desde el Punto de Venta (descuentan stock automáticamente)'
    ]
  },
  {
    version: '2.1.0',
    title: 'Catálogo Público',
    icon: Globe,
    items: [
      'Nueva página /catalogo accesible sin iniciar sesión',
      'Landing moderna con todos los productos, precios y stock',
      'Buscador y filtro por categoría',
      'Compartí el enlace con tus clientes para que vean el catálogo online'
    ]
  },
  {
    version: '2.0.0',
    title: 'Nuevo Módulo: Gestión',
    icon: Building2,
    items: [
      'Proveedores: registro con contacto, teléfono, email y CBU',
      'Órdenes de Compra: creación con productos, cantidades y precios. Al recibirlas se actualiza el stock automáticamente',
      'Gastos Operativos: registro de gastos diarios categorizados (alquiler, servicios, insumos, etc.)',
      'Clientes: base de datos de clientes con teléfono y dirección'
    ]
  },
  {
    version: '2.0.0',
    title: 'Presupuestos',
    icon: FileText,
    items: [
      'Botón "Presupuestar" en el Punto de Venta para crear cotizaciones sin efectuar la venta',
      'Sección "Presupuestos" en el menú con listado completo',
      'Envía el presupuesto al cliente por WhatsApp con el detalle de productos y total',
      'Posibilidad de convertir un presupuesto en venta directamente'
    ]
  },
  {
    version: '1.4.0',
    title: 'R - Ventas (Estadísticas de Ventas)',
    icon: BarChart,
    items: [
      'Ranking completo de productos más vendidos a menos vendidos',
      'Desglose por unidad/bolsa vs venta suelta por kilo',
      'Ganancia y margen por cada producto',
      'Filtro por categoría con botones interactivos',
      'Top 10 en gráfico de barras',
      'Exportación a CSV'
    ]
  },
  {
    version: '1.3.0',
    title: 'Productos sin Movimiento',
    icon: PackageX,
    items: [
      'Detecta productos que no se vendieron en los últimos 3 meses',
      'Badge en la cabecera de Productos con la cantidad',
      'Modal con listado completo para revisar inventario estancado'
    ]
  },
  {
    version: '1.2.0',
    title: 'Mejoras en Ventas',
    icon: ShoppingBag,
    items: [
      'Desglose de ventas por unidad y por kilo en todo el sistema',
      'Filtro de categorías como botones en R - Ventas',
      'Números formateados sin decimales innecesarios'
    ]
  }
];

const LS_KEY = 'poroto_changelog_dismissed';

const buildMenuGroups = (isAdmin) => {
  const groups = [
    {
      title: 'Principal',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Punto de Venta', path: '/pos', icon: ShoppingCart },
      ],
    },
    {
      title: 'Ventas',
      items: [
        { name: 'Ventas', path: '/sales', icon: History },
        { name: 'R - Ventas', path: '/rventas', icon: TrendingUp },
        { name: 'Pedidos', path: '/orders', icon: ShoppingBag },
        { name: 'Presupuestos', path: '/presupuestos', icon: FileText },
        { name: 'Ayuda Vendedor', path: '/asistente', icon: Wand2 },
        { name: 'Historial IA', path: '/ai-history', icon: Clock },
      ],
    },
    {
      title: 'Inventario',
      items: [
        { name: 'Productos', path: '/products', icon: Package },
        { name: 'Categorías', path: '/categories', icon: Tags },
        { name: 'Stock', path: '/stock', icon: ArrowRightLeft },
        { name: 'Promociones', path: '/promociones', icon: Sparkles },
      ],
    },
{
        title: 'Gestión',
        items: [
          { name: 'Gestión', path: '/gestion', icon: FolderKanban },
          { name: 'Clientes', path: '/clientes', icon: Users },
          { name: 'Proveedores', path: '/proveedores', icon: Building2 },
          { name: 'Órdenes de Compra', path: '/ordenes-compra', icon: ShoppingCart },
          { name: 'Gastos', path: '/gastos', icon: Receipt },
          { name: 'Calendario', path: '/calendario', icon: Calendar },
          { name: 'Afiliados', path: '/afiliados', icon: Award },
        ],
      },
    {
      title: 'Informes',
      items: [
        { name: 'Reportes', path: '/reports', icon: BarChart3 },
        { name: 'Estadísticas', path: '/statistics', icon: PieChart },
      ],
    },
    {
      title: 'IA',
      items: [
        { name: 'Centro de IA', path: '/ai-hub', icon: Bot },
      ],
    },
  ];

  if (isAdmin) {
    groups[3].items.push({ name: 'Usuarios', path: '/users', icon: Users });
  }

  return groups;
};

const Layout = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showChangelog, setShowChangelog] = useState(() => {
    if (!user) return false;
    return !localStorage.getItem(LS_KEY);
  });
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const menuGroups = useMemo(() => buildMenuGroups(user?.rol === 'admin'), [user?.rol]);

  const filteredGroups = useMemo(() => {
    const q = menuSearch.trim().toLowerCase();
    if (!q) return menuGroups;
    return menuGroups
      .map((group) => ({ ...group, items: group.items.filter((item) => item.name.toLowerCase().includes(q)) }))
      .filter((group) => group.items.length > 0);
  }, [menuSearch, menuGroups]);

  const handleCloseChangelog = () => {
    if (dontShowAgain) {
      localStorage.setItem(LS_KEY, 'true');
    }
    setShowChangelog(false);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      {/* Mobile sidebar toggle */}
      <button 
        className="md:hidden fixed z-50 top-4 right-4 bg-surface p-2 rounded-md border border-stone-700"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside 
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:relative z-40 ${sidebarExpanded ? 'md:w-64' : 'md:w-[76px]'} w-64 h-full bg-surface border-r border-stone-800 transition-[width,transform] duration-300 flex flex-col overflow-hidden`}
      >
        <div className="h-[72px] flex items-center justify-center border-b border-stone-800 shrink-0">
          {sidebarExpanded ? (
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-beige bg-clip-text text-transparent whitespace-nowrap">POROTO PETSHOP</h1>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primaryDark flex items-center justify-center">
              <PawPrint size={20} className="text-white" />
            </div>
          )}
        </div>
        
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          <div className={`relative mb-1 ${sidebarExpanded ? 'md:block' : 'md:hidden'} block`}>
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none" />
            <input
              type="text"
              value={menuSearch}
              onChange={(e) => setMenuSearch(e.target.value)}
              placeholder="Buscar sección..."
              className="w-full bg-background border border-stone-700 rounded-lg pl-9 pr-8 py-2 text-sm text-textLight placeholder:text-stone-500 focus:outline-none focus:border-primary transition-colors"
            />
            {menuSearch && (
              <button onClick={() => setMenuSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-textLight" title="Limpiar búsqueda">
                <X size={14} />
              </button>
            )}
          </div>

          {filteredGroups.length === 0 ? (
            <p className="text-xs text-stone-500 text-center mt-6 px-3">Sin resultados para "{menuSearch}"</p>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.title} className="mb-1">
                <p className={`px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-stone-500 whitespace-nowrap overflow-hidden ${sidebarExpanded ? 'md:block' : 'md:hidden'} block`}>
                  {group.title}
                </p>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center justify-start ${sidebarExpanded ? 'md:justify-start' : 'md:justify-center'} px-3 py-2 rounded-lg transition-colors group ${
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-textMuted hover:bg-stone-800 hover:text-textLight'
                      }`}
                    >
                      <Icon size={18} className={`shrink-0 mr-2.5 ${sidebarExpanded ? 'md:mr-2.5' : 'md:mr-0'} ${isActive ? 'text-primary' : 'text-stone-500 group-hover:text-textLight'}`} />
                      <span className={`font-medium text-sm truncate whitespace-nowrap ml-2.5 max-w-44 opacity-100 overflow-hidden transition-all duration-300 ${sidebarExpanded ? 'md:ml-2.5 md:max-w-44 md:opacity-100' : 'md:ml-0 md:max-w-0 md:opacity-0'}`}>
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ))
          )}
        </nav>

        <div className="border-t border-stone-800">
          <div className={`px-3 py-2 flex items-center gap-2.5 justify-start ${sidebarExpanded ? 'md:justify-start' : 'md:justify-center'} border-b border-stone-800/50 shrink-0`}>
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primaryDark flex items-center justify-center text-[11px] font-bold text-white shrink-0">
              {user?.nombre?.charAt(0).toUpperCase()}
            </div>
            <div className={`flex-1 min-w-0 transition-all duration-300 overflow-hidden ${sidebarExpanded ? 'md:max-w-full md:opacity-100' : 'md:max-w-0 md:opacity-0'} max-w-full opacity-100`}>
              <p className="text-xs font-semibold text-textLight truncate leading-tight">{user?.nombre}</p>
              <p className="text-[10px] text-textMuted capitalize flex items-center gap-1">
                <span className={`w-1 h-1 rounded-full ${user?.rol === 'admin' ? 'bg-amber-400' : 'bg-beige'}`} />
                {user?.rol === 'admin' ? 'Admin' : 'Empleado'}
              </p>
            </div>
            <button onClick={() => setShowChangelog(true)} className={`p-1.5 rounded-lg hover:bg-stone-800 transition-colors relative ${sidebarExpanded ? 'md:inline-flex' : 'md:hidden'} inline-flex`} title="Novedades">
              <Info size={14} className="text-stone-400 hover:text-primary transition-colors" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary animate-pulse" />
            </button>
            <button onClick={logout} className="p-1.5 rounded-lg hover:bg-danger/10 transition-colors shrink-0" title="Cerrar Sesión">
              <LogOut size={14} className="text-danger/60 hover:text-danger transition-colors" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full h-full p-4 md:p-8">
         <Outlet />
      </main>

      {/* Changelog Modal */}
      {showChangelog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => handleCloseChangelog()}>
          <div className="bg-surface w-full max-w-lg max-h-[85vh] rounded-2xl border border-stone-700 shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-stone-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Sparkles className="text-primary" size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-textLight">Novedades</h2>
                  <p className="text-xs text-textMuted">Últimas actualizaciones del sistema</p>
                </div>
              </div>
              <button onClick={handleCloseChangelog} className="text-textMuted hover:text-textLight p-1">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {UPDATES.map((update, idx) => {
                const Icon = update.icon;
                const isFirst = idx === 0;
                return (
                  <div key={idx} className={`${!isFirst ? 'pt-6 border-t border-stone-800' : ''}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isFirst ? 'bg-primary/20 text-primary' : 'bg-stone-800 text-textMuted'
                      }`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <p className={`text-xs font-bold uppercase tracking-wider ${
                          isFirst ? 'text-primary' : 'text-textMuted'
                        }`}>{update.version}</p>
                        <h3 className="font-bold text-textLight">{update.title}</h3>
                      </div>
                      {isFirst && (
                        <span className="ml-auto bg-primary/20 text-primary text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">Nuevo</span>
                      )}
                    </div>
                    <ul className="space-y-2 ml-1">
                      {update.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-textMuted">
                          <CheckCircle size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            <div className="p-6 border-t border-stone-800 shrink-0">
              <label className="flex items-center gap-3 cursor-pointer mb-4">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="w-4 h-4 rounded border-stone-600 bg-background text-primary focus:ring-primary/30"
                />
                <span className="text-sm text-textMuted">No volver a mostrar al iniciar sesión</span>
              </label>
              <button
                onClick={handleCloseChangelog}
                className="w-full py-3 rounded-xl bg-primary hover:bg-primaryDark text-white font-bold transition-colors shadow-lg shadow-primary/20"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
