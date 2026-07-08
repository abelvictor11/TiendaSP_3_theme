import {useEffect, useState} from 'react';
import {TruckIcon} from '@heroicons/react/24/outline';

/**
 * Countdown de preventa para la PDP.
 *
 * Se muestra debajo del botón "Agregar al carrito" cuando el producto tiene
 * el metafield `custom.fecha_envio_preventa` (tipo date o date_time) con una
 * fecha futura. Cuenta regresiva hasta la fecha estimada de envío; cuando la
 * fecha pasa, el componente deja de renderizarse.
 *
 * Configuración en el admin de Shopify:
 *   Configuración → Datos personalizados → Productos → Agregar definición
 *   Namespace y clave: custom.fecha_envio_preventa — Tipo: Fecha
 *   Luego asignar la fecha en cada producto en preventa.
 */

type Remaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function parseShipDate(raw: string): Date | null {
  if (!raw) return null;
  // Metafield tipo "date" llega como YYYY-MM-DD: fijarlo al mediodía local
  // para evitar corrimientos de día por zona horaria.
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw);
  const date = new Date(dateOnly ? `${raw}T12:00:00` : raw);
  return isNaN(date.getTime()) ? null : date;
}

function getRemaining(target: Date): Remaining | null {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1_000),
  };
}

function TimeBox({value, label}: {value: number; label: string}) {
  return (
    <div className="flex flex-col items-center bg-white dark:bg-neutral-800 rounded-xl px-2.5 py-2 min-w-[56px] shadow-sm">
      <span className="text-xl font-bold tabular-nums text-slate-900 dark:text-white">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-neutral-400">
        {label}
      </span>
    </div>
  );
}

export function PreorderCountdown({shipDate}: {shipDate?: string | null}) {
  const target = shipDate ? parseShipDate(shipDate) : null;

  // null hasta montar: evita mismatch de hidratación (el server no debe
  // calcular un countdown que cambia cada segundo).
  const [remaining, setRemaining] = useState<Remaining | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!target) return;
    setMounted(true);
    setRemaining(getRemaining(target));
    const id = setInterval(() => {
      setRemaining(getRemaining(target));
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipDate]);

  if (!target) return null;
  // Fecha ya pasada (tras montar): no mostrar nada.
  if (mounted && !remaining) return null;

  const formattedDate = target.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <TruckIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
          Preventa — envío estimado: {formattedDate}
        </span>
      </div>
      {remaining ? (
        <div className="flex items-center gap-2">
          <TimeBox value={remaining.days} label="Días" />
          <TimeBox value={remaining.hours} label="Horas" />
          <TimeBox value={remaining.minutes} label="Min" />
          <TimeBox value={remaining.seconds} label="Seg" />
        </div>
      ) : (
        // Placeholder SSR/pre-montaje con la misma altura para evitar salto.
        <div className="flex items-center gap-2 opacity-50">
          <TimeBox value={0} label="Días" />
          <TimeBox value={0} label="Horas" />
          <TimeBox value={0} label="Min" />
          <TimeBox value={0} label="Seg" />
        </div>
      )}
    </div>
  );
}
