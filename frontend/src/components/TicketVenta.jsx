import html2canvas from 'html2canvas';
import PropTypes from 'prop-types';
import { useState } from 'react';

const METODOS_LABEL = { EFECTIVO: 'Efectivo', TRANSFERENCIA: 'Transferencia', TARJETA: 'Tarjeta' };

const formatPesos = (n) =>
  Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Ticket/comprobante de venta imprimible.
 * Se puede mostrar en un modal y el usuario imprime con window.print().
 * Los estilos @media print ocultan todo excepto #ticket-print.
 */
const TicketVenta = ({ venta, onCerrar }) => {
  const [compartiendo, setCompartiendo] = useState(false);
  const fecha = new Date(venta.fecha || Date.now());
  const fechaStr = fecha.toLocaleDateString('es-AR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const horaStr = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  const handleImprimir = () => window.print();

  const handleCompartirWsp = async () => {
    setCompartiendo(true);
    try {
      const elemento = document.getElementById('ticket-print');
      // Escalar x2 para alta resolución
      const canvas = await html2canvas(elemento, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      const archivo = new File([blob], 'comprobante-tincho.png', { type: 'image/png' });

      // En mobile: Web Share API con archivo (abre WhatsApp nativo)
      if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
        await navigator.share({
          files: [archivo],
          title: 'Comprobante de venta — TINCHO Barbería',
        });
      } else {
        // Desktop / navegadores sin soporte: descargar la imagen
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'comprobante-tincho.png';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      // El usuario canceló la hoja de compartir — no hacer nada
      if (err?.name !== 'AbortError') console.error(err);
    } finally {
      setCompartiendo(false);
    }
  };

  return (
    <>
      {/* Estilos de impresión — inyectados via <style> */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #ticket-print, #ticket-print * { visibility: visible !important; }
          #ticket-print {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            padding: 20mm 15mm !important;
            background: white !important;
            color: black !important;
          }
          .print\\:hidden { display: none !important; }
        }
      `}</style>

      {/* Overlay modal */}
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

          {/* Ticket imprimible */}
          <div id="ticket-print" className="p-6 bg-white text-gray-900">

            {/* Encabezado */}
            <div className="text-center mb-5 border-b border-dashed border-gray-300 pb-4">
              <img
                src="/logotincho.png"
                alt="TINCHO Barberia"
                className="w-20 h-20 mx-auto mb-2 object-contain"
                style={{ mixBlendMode: 'multiply' }}
              />
              <h1 className="text-xl font-black tracking-widest uppercase text-gray-900">
                TINCHO Barbería
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">Barbería &amp; Indumentaria</p>
              <p className="text-xs text-gray-600 mt-1">
                Calle 8 esquina 21 — General Pinedo, Chaco
              </p>
            </div>

            {/* Título comprobante */}
            <div className="text-center mb-4">
              <span className="text-xs font-bold tracking-widest uppercase text-gray-500">
                Comprobante de Venta
              </span>
              <p className="text-xs text-gray-400 mt-0.5 capitalize">{fechaStr}</p>
              <p className="text-xs text-gray-400">{horaStr} hs</p>
              {venta.id && (
                <p className="text-xs text-gray-300 mt-0.5">N° {String(venta.id).padStart(6, '0')}</p>
              )}
            </div>

            {/* Detalle de la venta */}
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left px-3 py-2 text-gray-600 font-semibold text-xs">Producto</th>
                    <th className="text-center px-2 py-2 text-gray-600 font-semibold text-xs">Cant.</th>
                    <th className="text-right px-3 py-2 text-gray-600 font-semibold text-xs">Precio</th>
                    <th className="text-right px-3 py-2 text-gray-600 font-semibold text-xs">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-100">
                    <td className="px-3 py-2.5">
                      <p className="font-semibold text-gray-900 text-sm leading-tight">
                        {venta.producto_nombre}
                      </p>
                      {venta.producto_variante && (
                        <p className="text-xs text-gray-500">{venta.producto_variante}</p>
                      )}
                    </td>
                    <td className="px-2 py-2.5 text-center text-gray-700">{venta.cantidad}</td>
                    <td className="px-3 py-2.5 text-right text-gray-600 text-xs">
                      ${formatPesos(venta.precio_unitario)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-gray-900">
                      ${formatPesos(venta.total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Totales */}
            <div className="space-y-1 mb-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Método de pago</span>
                <span className="font-semibold">{METODOS_LABEL[venta.metodo_pago]}</span>
              </div>
              {venta.vendedor && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Vendedor</span>
                  <span className="font-semibold">{venta.vendedor}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-gray-900 border-t border-gray-300 pt-2 mt-2">
                <span className="uppercase tracking-wide">TOTAL</span>
                <span className="text-lg">${formatPesos(venta.total)}</span>
              </div>
            </div>

            {/* Pie */}
            <div className="text-center border-t border-dashed border-gray-200 pt-3">
              <p className="text-xs text-gray-400">¡Gracias por tu compra!</p>
              <p className="text-xs text-gray-400 mt-0.5">Conserva este comprobante</p>
              <div className="flex items-center justify-center gap-1 mt-2">
                <img src="/logo-esaystech.png" alt="EasyTech" className="w-4 h-4 object-contain opacity-40" />
                <p className="text-[10px] text-gray-400">Desarrollado por EasyTech · easytech.ar</p>
              </div>
            </div>
          </div>

          {/* Botones — ocultos en impresión */}
          <div className="grid grid-cols-3 gap-2 p-4 bg-gray-50 border-t border-gray-100 print:hidden">
            <button
              onClick={handleImprimir}
              className="py-2.5 bg-gray-900 hover:bg-gray-700 text-white font-bold rounded-lg
                         transition-all duration-200 flex items-center justify-center gap-1.5 text-sm"
            >
              <span>🖨️</span>
              <span>Imprimir</span>
            </button>
            <button
              onClick={handleCompartirWsp}
              disabled={compartiendo}
              className="py-2.5 bg-[#25D366] hover:bg-[#1da851] text-white font-bold rounded-lg
                         transition-all duration-200 flex items-center justify-center gap-1.5 text-sm
                         disabled:opacity-60 disabled:cursor-wait"
            >
              {compartiendo ? (
                <span className="text-xs">Generando...</span>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span>WhatsApp</span>
                </>
              )}
            </button>
            <button
              onClick={onCerrar}
              className="py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-lg
                         transition-all duration-200 text-sm"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

TicketVenta.propTypes = {
  venta: PropTypes.shape({
    id:               PropTypes.number,
    fecha:            PropTypes.string,
    producto_nombre:  PropTypes.string.isRequired,
    producto_variante: PropTypes.string,
    cantidad:         PropTypes.number.isRequired,
    precio_unitario:  PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    total:            PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    metodo_pago:      PropTypes.string.isRequired,
    vendedor:         PropTypes.string,
  }).isRequired,
  onCerrar: PropTypes.func.isRequired,
};

export default TicketVenta;
