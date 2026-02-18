import { useCallback, useEffect, useRef, useState } from 'react';
import Pagination from '../components/Pagination';
import TicketVenta from '../components/TicketVenta';
import api from '../services/api';

const ITEMS_POR_PAGINA = 10;

/* ─────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────── */
const formatPesos = (n) =>
  Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const METODOS_PAGO = ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA'];
const METODOS_LABEL = { EFECTIVO: 'Efectivo', TRANSFERENCIA: 'Transferencia', TARJETA: 'Tarjeta' };

// Input para formularios de modal (con borde y focus dorado)
const inputCls =
  'px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 ' +
  'focus:border-tincho-gold focus:ring-2 focus:ring-tincho-gold/50 focus:outline-none w-full';
// Input estilo Caja (admin-input-gold, sin borde propio — igual que en CajaDiaria)
const inputGoldCls = 'px-4 py-2 admin-input-gold rounded-lg text-gray-300 focus:outline-none';
const labelCls = 'block text-gray-300 text-sm font-semibold mb-1';

const btnGold =
  'px-5 py-2 bg-oro-base text-tincho-dark font-bold rounded-lg hover:bg-oro-brillo ' +
  'transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
const btnGray =
  'px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm';
const btnRed =
  'px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold transition-colors';
const btnBlue =
  'px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-colors';
const btnGreen =
  'px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold transition-colors';

/* ─────────────────────────────────────────────────────────────────
   PAGE ROOT
───────────────────────────────────────────────────────────────── */
const AdminStock = () => {
  const [tab, setTab] = useState('catalogo');

  const tabs = [
    { id: 'catalogo', label: 'Catálogo' },
    { id: 'venta', label: 'Registrar Venta' },
    { id: 'historial', label: 'Historial de Ventas' },
  ];

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">Gestión de Stock</h2>
        <p className="text-gray-400 text-sm sm:text-base">
          Administrá tus productos y registrá ventas para seguirlas desde Caja.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 sm:gap-4 mb-6 border-b border-gray-700 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 sm:px-6 py-3 font-semibold transition-all duration-200 border-b-2 whitespace-nowrap text-sm sm:text-base ${
              tab === t.id
                ? 'text-white border-white'
                : 'text-gray-400 border-transparent hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'catalogo' && <CatalogoTab />}
      {tab === 'venta' && <RegistrarVentaTab onVentaOk={() => setTab('historial')} />}
      {tab === 'historial' && <HistorialTab />}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   TAB 1 — CATÁLOGO
───────────────────────────────────────────────────────────────── */
const FORM_VACIO = {
  nombre: '',
  variante: '',
  categoria: '',
  precio_costo: '',
  precio_venta: '',
  stock_actual: '',
  descripcion: '',
  is_active: true,
};

const CatalogoTab = () => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [paginaCatalogo, setPaginaCatalogo] = useState(1);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [formError, setFormError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const [stockModal, setStockModal] = useState(null);
  const [stockCantidad, setStockCantidad] = useState('');
  const [stockOp, setStockOp] = useState('agregar');
  const [stockError, setStockError] = useState('');
  const [stockGuardando, setStockGuardando] = useState(false);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [prods, cats] = await Promise.all([api.getProductos(), api.getCategorias()]);
      setProductos(prods);
      setCategorias(cats);
    } catch {
      setError('Error al cargar productos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const productosFiltrados = productos.filter((p) => {
    if (filtroCategoria && p.categoria !== filtroCategoria) return false;
    if (filtroActivo === 'activo' && !p.is_active) return false;
    if (filtroActivo === 'inactivo' && p.is_active) return false;
    if (filtroBusqueda) {
      const q = filtroBusqueda.toLowerCase();
      if (
        !p.nombre.toLowerCase().includes(q) &&
        !(p.variante || '').toLowerCase().includes(q) &&
        !(p.categoria || '').toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  // Al cambiar filtros, volver a página 1
  const handleFiltroCategoria = (v) => { setFiltroCategoria(v); setPaginaCatalogo(1); };
  const handleFiltroActivo    = (v) => { setFiltroActivo(v);    setPaginaCatalogo(1); };
  const handleFiltroBusqueda  = (v) => { setFiltroBusqueda(v);  setPaginaCatalogo(1); };

  const productosPaginados = productosFiltrados.slice(
    (paginaCatalogo - 1) * ITEMS_POR_PAGINA,
    paginaCatalogo * ITEMS_POR_PAGINA,
  );

  const abrirModalCrear = () => {
    setProductoEditando(null);
    setForm(FORM_VACIO);
    setFormError('');
    setModalAbierto(true);
  };

  const abrirModalEditar = (p) => {
    setProductoEditando(p);
    setForm({
      nombre: p.nombre,
      variante: p.variante || '',
      categoria: p.categoria || '',
      precio_costo: p.precio_costo,
      precio_venta: p.precio_venta,
      stock_actual: p.stock_actual,
      descripcion: p.descripcion || '',
      is_active: p.is_active,
    });
    setFormError('');
    setModalAbierto(true);
  };

  const guardarProducto = async () => {
    setFormError('');
    if (!form.nombre.trim()) return setFormError('El nombre es obligatorio.');
    if (!form.precio_costo || isNaN(form.precio_costo)) return setFormError('Precio de costo inválido.');
    if (!form.precio_venta || isNaN(form.precio_venta)) return setFormError('Precio de venta inválido.');
    if (Number(form.precio_venta) < Number(form.precio_costo))
      return setFormError('El precio de venta no puede ser menor al costo.');

    setGuardando(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        variante: form.variante.trim() || null,
        categoria: form.categoria.trim() || null,
        precio_costo: Number(form.precio_costo),
        precio_venta: Number(form.precio_venta),
        stock_actual: Number(form.stock_actual) || 0,
        descripcion: form.descripcion.trim() || null,
        is_active: form.is_active,
      };
      if (productoEditando) {
        await api.updateProducto(productoEditando.id, payload);
      } else {
        await api.createProducto(payload);
      }
      setModalAbierto(false);
      cargarDatos();
    } catch (err) {
      const msg = err?.nombre?.[0] || err?.precio_venta?.[0] || err?.error || JSON.stringify(err);
      setFormError(msg || 'Error al guardar.');
    } finally {
      setGuardando(false);
    }
  };

  const toggleActivo = async (p) => {
    try {
      await api.updateProducto(p.id, { ...p, is_active: !p.is_active });
      cargarDatos();
    } catch { /* silent */ }
  };

  const eliminarProducto = async (p) => {
    if (!window.confirm(`¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api.deleteProducto(p.id);
      cargarDatos();
    } catch (err) {
      alert(err?.error || 'No se pudo eliminar. El producto puede tener ventas registradas.');
    }
  };

  const abrirStockModal = (p) => {
    setStockModal(p);
    setStockCantidad('');
    setStockOp('agregar');
    setStockError('');
  };

  const aplicarAjusteStock = async () => {
    if (!stockCantidad || isNaN(stockCantidad) || Number(stockCantidad) <= 0)
      return setStockError('Ingresá una cantidad válida mayor a 0.');
    setStockGuardando(true);
    setStockError('');
    try {
      await api.ajustarStock(stockModal.id, Number(stockCantidad), stockOp);
      setStockModal(null);
      cargarDatos();
    } catch (err) {
      setStockError(err?.error || 'Error al ajustar stock.');
    } finally {
      setStockGuardando(false);
    }
  };

  const stockBadge = (stock) => {
    if (stock === 0)
      return <span className="px-2 py-0.5 bg-red-600/20 border border-red-600 text-red-400 rounded text-xs font-bold">Sin stock</span>;
    return <span className="px-2 py-0.5 bg-green-600/20 border border-green-600 text-green-400 rounded text-xs font-bold">{stock} u.</span>;
  };

  return (
    <div className="space-y-5">
      {/* Toolbar — mismo estilo que Caja */}
      <div className="bg-gray-800 p-4 rounded-lg flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-[180px]">
          <label className="text-gray-300 font-semibold whitespace-nowrap">Buscar:</label>
          <input
            type="text"
            placeholder="Nombre, variante, categoría..."
            value={filtroBusqueda}
            onChange={(e) => handleFiltroBusqueda(e.target.value)}
            className={`${inputGoldCls} w-full`}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-gray-300 font-semibold whitespace-nowrap">Categoría:</label>
          <select
            value={filtroCategoria}
            onChange={(e) => handleFiltroCategoria(e.target.value)}
            className={inputGoldCls}
          >
            <option value="">Todas</option>
            {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-gray-300 font-semibold whitespace-nowrap">Estado:</label>
          <select value={filtroActivo} onChange={(e) => handleFiltroActivo(e.target.value)} className={inputGoldCls}>
            <option value="">Todos</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
        </div>
        <button
          onClick={abrirModalCrear}
          className="px-4 sm:px-6 py-2 bg-oro-base text-tincho-dark font-bold rounded-lg
                     hover:bg-oro-brillo transition-all duration-200 flex items-center gap-2 ml-auto"
        >
          <span>➕</span>
          <span>Nuevo Producto</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando productos...</div>
      ) : (
        <>
          {/* Métricas rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <MetricCard label="Total productos" value={productosFiltrados.length} color="blue" />
            <MetricCard label="Sin stock" value={productosFiltrados.filter((p) => p.stock_actual === 0).length} color="red" />
            <MetricCard label="Activos" value={productosFiltrados.filter((p) => p.is_active).length} color="green" />
          </div>

          {/* Tabla */}
          <div className="bg-gray-900 rounded-lg overflow-x-auto border border-gray-800">
            {productosFiltrados.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No hay productos que coincidan con los filtros.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-gray-400 font-semibold">Producto</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-gray-400 font-semibold">Categoría</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-gray-400 font-semibold">Costo</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-gray-400 font-semibold">Venta</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-gray-400 font-semibold">Margen</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-gray-400 font-semibold">Stock</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-gray-400 font-semibold">Estado</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-gray-400 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {productosPaginados.map((p) => (
                    <tr
                      key={p.id}
                      className={`transition-colors hover:bg-gray-800/50 ${!p.is_active ? 'opacity-50' : ''}`}
                    >
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        <p className="text-white font-semibold">{p.nombre}</p>
                        {p.variante && <p className="text-gray-500 text-xs">{p.variante}</p>}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-400">{p.categoria || '—'}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-gray-400">${formatPesos(p.precio_costo)}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-white font-semibold">${formatPesos(p.precio_venta)}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                        <span className="text-green-400 font-semibold">+${formatPesos(p.margen_ganancia)}</span>
                        <span className="text-gray-600 text-xs ml-1">({p.porcentaje_ganancia}%)</span>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">{stockBadge(p.stock_actual)}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                        {p.is_active
                          ? <span className="text-green-400 text-xs font-semibold">Activo</span>
                          : <span className="text-gray-600 text-xs font-semibold">Inactivo</span>}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        <div className="flex gap-1.5 justify-center flex-wrap">
                          <button onClick={() => abrirModalEditar(p)} className={btnBlue}>Editar</button>
                          <button onClick={() => abrirStockModal(p)} className={btnGreen}>Stock</button>
                          <button onClick={() => toggleActivo(p)} className={btnGray}>
                            {p.is_active ? 'Desactivar' : 'Activar'}
                          </button>
                          <button onClick={() => eliminarProducto(p)} className={btnRed}>Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <Pagination
            paginaActual={paginaCatalogo}
            totalItems={productosFiltrados.length}
            itemsPorPagina={ITEMS_POR_PAGINA}
            onCambiarPagina={setPaginaCatalogo}
          />
        </>
      )}

      {/* Modal crear/editar producto */}
      {modalAbierto && (
        <AdminModal
          titulo={productoEditando ? 'Editar Producto' : 'Nuevo Producto'}
          onClose={() => setModalAbierto(false)}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelCls}>Nombre *</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Shampoo Keratina, Pomada Mate, Remera Oversize"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Variante <span className="text-gray-500 font-normal">(opcional)</span></label>
                <input
                  type="text"
                  value={form.variante}
                  onChange={(e) => setForm({ ...form, variante: e.target.value })}
                  placeholder="Ej: 250ml, S, Azul, 1kg"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Categoría <span className="text-gray-500 font-normal">(opcional)</span></label>
                <input
                  type="text"
                  list="categorias-datalist"
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  placeholder="Ej: Capilar, Ropa, Accesorios"
                  className={inputCls}
                />
                <datalist id="categorias-datalist">
                  {categorias.map((c) => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div>
                <label className={labelCls}>Precio de Costo *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.precio_costo}
                  onChange={(e) => setForm({ ...form, precio_costo: e.target.value })}
                  placeholder="0.00"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Precio de Venta *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.precio_venta}
                  onChange={(e) => setForm({ ...form, precio_venta: e.target.value })}
                  placeholder="0.00"
                  className={inputCls}
                />
                {form.precio_costo && form.precio_venta && Number(form.precio_venta) > Number(form.precio_costo) && (
                  <p className="text-green-400 text-xs mt-1">
                    Margen: ${formatPesos(Number(form.precio_venta) - Number(form.precio_costo))}
                  </p>
                )}
              </div>
              <div>
                <label className={labelCls}>Stock inicial</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock_actual}
                  onChange={(e) => setForm({ ...form, stock_actual: e.target.value })}
                  placeholder="0"
                  className={inputCls}
                />
              </div>
              <div className="flex items-center gap-3 pt-5">
                <input
                  type="checkbox"
                  id="is_active_modal"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="is_active_modal" className="text-gray-300 text-sm">
                  Activo (disponible para venta)
                </label>
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Descripción <span className="text-gray-500 font-normal">(opcional)</span></label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  rows={2}
                  placeholder="Descripción adicional..."
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>

            {formError && (
              <div className="bg-red-500/10 border border-red-500 text-red-400 px-3 py-2 rounded text-sm">
                {formError}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-5 border-t border-gray-700 mt-2">
            <button onClick={() => setModalAbierto(false)} className={btnGray}>Cancelar</button>
            <button onClick={guardarProducto} disabled={guardando} className={btnGold}>
              {guardando ? 'Guardando...' : productoEditando ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </AdminModal>
      )}

      {/* Modal ajuste de stock */}
      {stockModal && (
        <AdminModal titulo={`Ajustar Stock — ${stockModal.nombre}`} onClose={() => setStockModal(null)}>
          <div className="space-y-5">
            <div className="bg-gray-800 rounded-lg px-4 py-3 flex items-center justify-between">
              <span className="text-gray-400 text-sm">Stock actual</span>
              <span className="text-white font-bold text-lg">{stockModal.stock_actual} unidades</span>
            </div>

            <div>
              <label className={labelCls}>Operación</label>
              <div className="flex gap-3">
                {['agregar', 'restar', 'establecer'].map((op) => (
                  <button
                    key={op}
                    onClick={() => setStockOp(op)}
                    className={`flex-1 py-2 rounded-lg font-semibold text-sm capitalize transition-all border-2 ${
                      stockOp === op
                        ? 'border-tincho-gold bg-tincho-gold/10 text-white'
                        : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    {op}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelCls}>
                {stockOp === 'establecer' ? 'Nuevo stock total' : 'Cantidad'}
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={stockCantidad}
                onChange={(e) => setStockCantidad(e.target.value)}
                placeholder="0"
                className={inputCls}
              />
              {stockCantidad && !isNaN(stockCantidad) && Number(stockCantidad) > 0 && (
                <p className="text-tincho-gold text-xs mt-1">
                  {stockOp === 'agregar' && `Stock resultante: ${stockModal.stock_actual + Number(stockCantidad)} u.`}
                  {stockOp === 'restar' && `Stock resultante: ${Math.max(0, stockModal.stock_actual - Number(stockCantidad))} u.`}
                  {stockOp === 'establecer' && `Stock resultante: ${Number(stockCantidad)} u.`}
                </p>
              )}
            </div>

            {stockError && (
              <div className="bg-red-500/10 border border-red-500 text-red-400 px-3 py-2 rounded text-sm">
                {stockError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-700">
              <button onClick={() => setStockModal(null)} className={btnGray}>Cancelar</button>
              <button onClick={aplicarAjusteStock} disabled={stockGuardando} className={btnGold}>
                {stockGuardando ? 'Aplicando...' : 'Aplicar'}
              </button>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   TAB 2 — REGISTRAR VENTA
   Layout horizontal en desktop, vertical en mobile
───────────────────────────────────────────────────────────────── */
const VENTA_VACIA = {
  producto: '',
  cantidad: 1,
  precio_unitario: '',
  metodo_pago: 'EFECTIVO',
  vendedor: '',
  notas: '',
};

const RegistrarVentaTab = ({ onVentaOk }) => {
  const [productos, setProductos] = useState([]);
  const [loadingProds, setLoadingProds] = useState(true);
  const [form, setForm] = useState(VENTA_VACIA);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(null);
  const [ticketAbierto, setTicketAbierto] = useState(false);

  useEffect(() => {
    api.getProductos({ activo: 'true' })
      .then((data) => setProductos(data))
      .catch(() => {})
      .finally(() => setLoadingProds(false));
  }, []);

  const productoSeleccionado = productos.find((p) => String(p.id) === String(form.producto));

  const onProductoChange = (id) => {
    const p = productos.find((x) => String(x.id) === String(id));
    setForm((f) => ({ ...f, producto: id, precio_unitario: p ? p.precio_venta : '' }));
  };

  const stockOk =
    productoSeleccionado && Number(form.cantidad) > 0
      ? productoSeleccionado.stock_actual >= Number(form.cantidad)
      : true;

  const totalVenta =
    form.cantidad && form.precio_unitario && !isNaN(form.precio_unitario)
      ? Number(form.cantidad) * Number(form.precio_unitario)
      : null;

  const registrar = async () => {
    setError('');
    if (!form.producto) return setError('Seleccioná un producto.');
    if (!form.cantidad || Number(form.cantidad) < 1) return setError('La cantidad debe ser al menos 1.');
    if (!form.precio_unitario || isNaN(form.precio_unitario)) return setError('El precio unitario es inválido.');
    if (!stockOk)
      return setError(`Stock insuficiente. Disponible: ${productoSeleccionado.stock_actual} unidades.`);

    setEnviando(true);
    try {
      const venta = await api.registrarVenta({
        producto: Number(form.producto),
        cantidad: Number(form.cantidad),
        precio_unitario: Number(form.precio_unitario),
        metodo_pago: form.metodo_pago,
        vendedor: form.vendedor.trim() || null,
        notas: form.notas.trim() || null,
      });
      setExito(venta);
      setForm(VENTA_VACIA);
      const prods = await api.getProductos({ activo: 'true' });
      setProductos(prods);
    } catch (err) {
      const msg = err?.cantidad?.[0] || err?.producto?.[0] || err?.error || 'Error al registrar la venta.';
      setError(msg);
    } finally {
      setEnviando(false);
    }
  };

  if (exito) {
    return (
      <>
        {ticketAbierto && (
          <TicketVenta venta={exito} onCerrar={() => setTicketAbierto(false)} />
        )}
        <div className="bg-gray-800 rounded-lg p-4 sm:p-8 max-w-lg">
          <div className="text-center space-y-4">
            <div className="text-5xl">✅</div>
            <h3 className="text-2xl font-bold text-white">¡Venta registrada!</h3>
            <div className="bg-gray-900 rounded-lg p-4 text-left space-y-2 text-sm border border-gray-700">
              <div className="flex justify-between">
                <span className="text-gray-400">Producto</span>
                <span className="text-white font-semibold">
                  {exito.producto_nombre}{exito.producto_variante ? ` (${exito.producto_variante})` : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Cantidad</span>
                <span className="text-white font-semibold">{exito.cantidad} u.</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Método de pago</span>
                <span className="text-white font-semibold">{METODOS_LABEL[exito.metodo_pago]}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-700">
                <span className="text-gray-400 font-semibold">Total cobrado</span>
                <span className="text-2xl font-bold admin-text-gold">${formatPesos(exito.total)}</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => setTicketAbierto(true)}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg
                           transition-all duration-200 flex items-center justify-center gap-2"
              >
                <span>🖨️</span>
                <span>Ver comprobante</span>
              </button>
              <button onClick={() => setExito(null)} className={`${btnGold} flex-1 py-3`}>
                Nueva venta
              </button>
              <button onClick={onVentaOk} className={`${btnGray} flex-1 py-3`}>
                Ver historial
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 sm:p-6 space-y-4">
      <h3 className="text-xl font-bold text-white">Registrar Venta de Producto</h3>

      {/* FILA 1 — Producto + Cantidad/Precio */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Combobox buscable de producto */}
        <div className="flex-1">
          <label className="text-gray-300 font-semibold block mb-1">Producto *</label>
          {loadingProds ? (
            <p className="text-gray-400 text-sm py-2">Cargando productos...</p>
          ) : (
            <ProductoCombobox
              productos={productos}
              value={form.producto}
              onChange={onProductoChange}
            />
          )}
          {productoSeleccionado && (
            <div className="mt-1.5 flex gap-4 text-xs">
              <span className="text-gray-400">
                Stock:{' '}
                <strong className={
                  productoSeleccionado.stock_actual === 0 ? 'text-red-400'
                  : productoSeleccionado.stock_actual <= 5 ? 'text-yellow-400'
                  : 'text-green-400'
                }>
                  {productoSeleccionado.stock_actual} u.
                </strong>
              </span>
              <span className="text-gray-400">
                Precio sugerido:{' '}
                <strong className="admin-text-gold">${formatPesos(productoSeleccionado.precio_venta)}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Cantidad + Precio en columna fija */}
        <div className="sm:w-72 flex gap-3">
          <div className="flex-1">
            <label className="text-gray-300 font-semibold block mb-1">Cantidad *</label>
            <input
              type="number"
              min="1"
              step="1"
              value={form.cantidad}
              onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
              className={`${inputGoldCls} w-full ${!stockOk ? 'border border-red-500' : ''}`}
            />
            {!stockOk && <p className="text-red-400 text-xs mt-1">Stock insuficiente.</p>}
          </div>
          <div className="flex-1">
            <label className="text-gray-300 font-semibold block mb-1">Precio unit. *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.precio_unitario}
              onChange={(e) => setForm({ ...form, precio_unitario: e.target.value })}
              placeholder="0.00"
              className={`${inputGoldCls} w-full`}
            />
          </div>
        </div>
      </div>

      {/* FILA 2 — Total + Método de pago
          Desktop: en fila (sm:flex-row) con items alineados al fondo.
          Mobile: apilados, Total ocupa todo el ancho (sin items-end que lo empujaría a la derecha). */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        {/* Total */}
        <div className={`sm:w-44 sm:shrink-0 rounded-lg px-4 py-3 text-center ${
          totalVenta !== null ? 'admin-metric-gold' : 'bg-gray-900 border border-gray-700'
        }`}>
          <p className={`text-xs font-semibold uppercase tracking-wide ${totalVenta !== null ? 'text-black/70' : 'text-gray-500'}`}>
            Total
          </p>
          <p className={`text-2xl font-bold leading-tight ${totalVenta !== null ? 'text-black' : 'text-gray-600'}`}>
            {totalVenta !== null ? `$${formatPesos(totalVenta)}` : '—'}
          </p>
        </div>

        {/* Método de pago */}
        <div className="flex-1">
          <label className="text-gray-300 font-semibold block mb-1">Método de pago</label>
          <div className="flex gap-2">
            {METODOS_PAGO.map((m) => (
              <button
                key={m}
                onClick={() => setForm({ ...form, metodo_pago: m })}
                className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all border-2 ${
                  form.metodo_pago === m
                    ? 'border-tincho-gold bg-tincho-gold/10 text-white'
                    : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                }`}
              >
                {METODOS_LABEL[m]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* FILA 3 — Vendedor + Notas */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="text-gray-300 font-semibold block mb-1">
            Vendedor <span className="text-gray-500 font-normal text-xs">(opcional)</span>
          </label>
          <input
            type="text"
            value={form.vendedor}
            onChange={(e) => setForm({ ...form, vendedor: e.target.value })}
            placeholder="Nombre del vendedor"
            className={`${inputGoldCls} w-full`}
          />
        </div>
        <div className="flex-1">
          <label className="text-gray-300 font-semibold block mb-1">
            Notas <span className="text-gray-500 font-normal text-xs">(opcional)</span>
          </label>
          <input
            type="text"
            value={form.notas}
            onChange={(e) => setForm({ ...form, notas: e.target.value })}
            placeholder="Observaciones..."
            className={`${inputGoldCls} w-full`}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}

      {/* BOTÓN — siempre al final, en desktop y mobile */}
      <button
        onClick={registrar}
        disabled={enviando || !stockOk}
        className="w-full py-3 bg-oro-base text-tincho-dark font-bold rounded-lg text-base
                   hover:bg-oro-brillo transition-all duration-200
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {enviando ? 'Registrando...' : 'Confirmar Venta'}
      </button>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   TAB 3 — HISTORIAL DE VENTAS
───────────────────────────────────────────────────────────────── */
const HistorialTab = () => {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paginaHistorial, setPaginaHistorial] = useState(1);
  const [ventaTicket, setVentaTicket] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getVentas({ fecha });
      setDatos(data);
    } catch {
      setError('Error al cargar el historial de ventas.');
    } finally {
      setLoading(false);
    }
  }, [fecha]);

  useEffect(() => { cargar(); }, [cargar]);

  const desglose = datos?.ventas
    ? METODOS_PAGO.reduce((acc, m) => {
        acc[m] = datos.ventas.filter((v) => v.metodo_pago === m).reduce((s, v) => s + Number(v.total), 0);
        return acc;
      }, {})
    : {};

  return (
    <div className="space-y-5">
      {ventaTicket && (
        <TicketVenta venta={ventaTicket} onCerrar={() => setVentaTicket(null)} />
      )}
      {/* Filtro — mismo estilo que Caja */}
      <div className="bg-gray-800 p-4 rounded-lg flex items-center gap-4 flex-wrap">
        <label className="text-gray-300 font-semibold">Fecha:</label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => { setFecha(e.target.value); setPaginaHistorial(1); }}
          className={inputGoldCls}
        />
        <button onClick={cargar} className={btnGold}>Actualizar</button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando...</div>
      ) : datos ? (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Ventas del día" value={datos.resumen.cantidad_ventas} color="blue" />
            <MetricCard label="Total vendido" value={`$${formatPesos(datos.resumen.total_vendido)}`} color="gold" big />
            <MetricCard label="Efectivo" value={`$${formatPesos(desglose.EFECTIVO || 0)}`} color="gray" />
            <MetricCard label="Transf. + Tarjeta" value={`$${formatPesos((desglose.TRANSFERENCIA || 0) + (desglose.TARJETA || 0))}`} color="gray" />
          </div>

          {/* Tabla */}
          <div className="bg-gray-900 rounded-lg overflow-x-auto border border-gray-800">
            {datos.ventas.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No hay ventas registradas para esta fecha.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-gray-400 font-semibold">Hora</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-gray-400 font-semibold">Producto</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-gray-400 font-semibold">Categoría</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-gray-400 font-semibold">Cant.</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-gray-400 font-semibold">Precio Unit.</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-gray-400 font-semibold">Total</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-gray-400 font-semibold">Pago</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-gray-400 font-semibold">Vendedor</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-gray-400 font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {datos.ventas
                    .slice((paginaHistorial - 1) * ITEMS_POR_PAGINA, paginaHistorial * ITEMS_POR_PAGINA)
                    .map((v) => (
                    <tr key={v.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-400 whitespace-nowrap">
                        {new Date(v.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        <p className="text-white font-semibold">{v.producto_nombre}</p>
                        {v.producto_variante && <p className="text-gray-500 text-xs">{v.producto_variante}</p>}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-400">{v.producto_categoria || '—'}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-gray-300">{v.cantidad}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-gray-400">${formatPesos(v.precio_unitario)}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-green-400 font-bold">${formatPesos(v.total)}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                        <span className="px-2 py-0.5 bg-gray-800 border border-gray-700 rounded text-xs text-gray-300">
                          {METODOS_LABEL[v.metodo_pago]}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-400 text-xs">{v.vendedor || '—'}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                        <button
                          onClick={() => setVentaTicket(v)}
                          className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white
                                     rounded text-xs transition-colors whitespace-nowrap"
                          title="Ver comprobante"
                        >
                          🖨️ Ticket
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-800 bg-gray-800/50">
                    <td colSpan={5} className="px-2 sm:px-4 py-2 sm:py-3 text-right text-gray-400 font-semibold">
                      Total del día:
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xl sm:text-2xl font-bold admin-text-gold">
                      ${formatPesos(datos.resumen.total_vendido)}
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
          <Pagination
            paginaActual={paginaHistorial}
            totalItems={datos.ventas.length}
            itemsPorPagina={ITEMS_POR_PAGINA}
            onCambiarPagina={setPaginaHistorial}
          />
        </>
      ) : null}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   COMBOBOX DE PRODUCTO (buscable, dropdown oscuro)
───────────────────────────────────────────────────────────────── */
const ProductoCombobox = ({ productos, value, onChange }) => {
  const [busqueda, setBusqueda] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [enfocado, setEnfocado] = useState(false);
  const containerRef = useRef(null);

  const seleccionado = productos.find((p) => String(p.id) === String(value));

  const filtrados = busqueda.trim()
    ? productos.filter((p) => {
        const q = busqueda.toLowerCase();
        return (
          p.nombre.toLowerCase().includes(q) ||
          (p.variante || '').toLowerCase().includes(q) ||
          (p.categoria || '').toLowerCase().includes(q)
        );
      })
    : productos;

  const displayValue = enfocado
    ? busqueda
    : seleccionado
    ? `${seleccionado.nombre}${seleccionado.variante ? ` (${seleccionado.variante})` : ''}`
    : '';

  const handleFocus = () => {
    setEnfocado(true);
    setBusqueda('');
    setAbierto(true);
  };

  const handleBlur = () => {
    // Pequeño delay para que onMouseDown en la opción pueda dispararse primero
    setTimeout(() => {
      setEnfocado(false);
      setBusqueda('');
      setAbierto(false);
    }, 150);
  };

  const handleSelect = (p) => {
    if (p.stock_actual === 0) return;
    onChange(String(p.id));
    setBusqueda('');
    setAbierto(false);
    setEnfocado(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setBusqueda('');
    setAbierto(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onChange={(e) => { setBusqueda(e.target.value); setAbierto(true); }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Buscá por nombre, variante o categoría..."
          className={`${inputGoldCls} w-full pr-16`}
          autoComplete="off"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {seleccionado && !enfocado && (
            <button
              onMouseDown={handleClear}
              className="text-gray-500 hover:text-gray-300 px-1 text-lg leading-none"
              tabIndex={-1}
            >
              ×
            </button>
          )}
          <span className="text-gray-500 text-xs pointer-events-none">▾</span>
        </div>
      </div>

      {abierto && (
        <div className="absolute z-50 w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg
                        shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
          {filtrados.length === 0 ? (
            <div className="px-4 py-3 text-gray-500 text-sm">Sin resultados para &quot;{busqueda}&quot;</div>
          ) : (
            filtrados.map((p) => (
              <div
                key={p.id}
                onMouseDown={() => handleSelect(p)}
                className={`px-4 py-2.5 flex items-center justify-between gap-3 transition-colors
                  ${p.stock_actual === 0
                    ? 'opacity-40 cursor-not-allowed'
                    : 'cursor-pointer hover:bg-gray-800'
                  }
                  ${String(p.id) === String(value) ? 'bg-tincho-gold/10' : ''}`}
              >
                <div className="min-w-0">
                  <span className="text-gray-100 font-semibold">{p.nombre}</span>
                  {p.variante && (
                    <span className="text-gray-400 text-sm ml-1.5">({p.variante})</span>
                  )}
                  {p.categoria && (
                    <span className="text-gray-600 text-xs ml-2">— {p.categoria}</span>
                  )}
                </div>
                <div className="text-right text-xs shrink-0">
                  <span className={
                    p.stock_actual === 0 ? 'text-red-400'
                    : p.stock_actual <= 5 ? 'text-yellow-400'
                    : 'text-gray-400'
                  }>
                    {p.stock_actual === 0 ? 'Sin stock' : `Stock: ${p.stock_actual}`}
                  </span>
                  <div className="text-gray-500">${formatPesos(p.precio_venta)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   COMPONENTES COMPARTIDOS
───────────────────────────────────────────────────────────────── */
const MetricCard = ({ label, value, color = 'gray', big = false }) => {
  if (color === 'gold') {
    return (
      <div className="admin-metric-gold rounded-lg p-5 shadow-lg">
        <p className="text-sm font-semibold mb-1 text-black opacity-80">{label}</p>
        <p className={`font-bold text-black ${big ? 'text-3xl' : 'text-2xl'}`}>{value}</p>
      </div>
    );
  }

  const borderMap = {
    blue:   'border-blue-500',
    green:  'border-green-500',
    red:    'border-red-500',
    yellow: 'border-yellow-500',
    gray:   'border-gray-600',
  };

  return (
    <div className={`bg-gray-800 border-l-4 ${borderMap[color] || borderMap.gray} rounded-lg p-5 shadow-md`}>
      <p className="text-sm font-semibold mb-1 text-gray-400">{label}</p>
      <p className={`font-bold text-white ${big ? 'text-3xl' : 'text-2xl'}`}>{value}</p>
    </div>
  );
};

const AdminModal = ({ titulo, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center admin-modal-backdrop p-4">
    <div className="admin-modal-gold rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div className="sticky top-0 bg-gradient-to-b from-black/80 to-transparent border-b border-oro-fuerte/30 px-6 py-4 flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">{titulo}</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
        >
          ✕
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  </div>
);

export default AdminStock;
