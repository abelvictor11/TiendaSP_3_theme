import {Disclosure} from '@headlessui/react';
import {MinusIcon, PlusIcon} from '@heroicons/react/24/outline';
import {type FC} from 'react';

const DEMO_DATA = [
  {
    name: 'Descripción',
    content:
      'La moda es una forma de autoexpresión y autonomía en un período y lugar determinados, en un contexto específico de ropa, calzado, estilo de vida, accesorios, maquillaje, peinado y postura corporal.',
  },
  {
    name: 'Tejido + Cuidados',
    content: `<ul class="list-disc list-inside leading-7">
    <li>Fabricado con micromalla de potencia belga transparente.</li>
    <li>
    74% Poliamida (Nylon) 26% Elastano (Spandex)
    </li>
    <li>
    Cierre y tirantes ajustables
    </li>
    <li>
    Lavar a mano con agua fría, secar en plano
    </li>
  </ul>`,
  },

  {
    name: 'Cómo queda',
    content:
      'Usa esto como guía. La preferencia es un factor importante: si estás cerca del límite superior de una talla y/o prefieres más cobertura, puede que quieras elegir una talla más.',
  },
  {
    name: 'Preguntas frecuentes',
    content: `
    <ul class="list-disc list-inside leading-7">
    <li>Todos los artículos a precio completo, sin usar, con etiquetas y en su embalaje original son elegibles para devolución o cambio dentro de los 30 días posteriores a la compra.</li>
    <li>
    Ten en cuenta que los packs deben devolverse completos. No aceptamos devoluciones parciales de packs.
    </li>
    <li>
    ¿Quieres conocer nuestra política de devoluciones completa? Aquí la tienes.
    </li>
    <li>
    ¿Necesitas más información sobre envíos, materiales o instrucciones de cuidado? ¡Aquí!
    </li>
  </ul>
    `,
  },
];

interface Props {
  panelClassName?: string;
  data?: typeof DEMO_DATA;
}

const AccordionInfo: FC<Props> = ({
  panelClassName = 'p-4 pt-3 last:pb-0 text-slate-600 text-sm dark:text-slate-300 leading-6',
  data = DEMO_DATA,
}) => {
  return (
    <div className="w-full rounded-2xl space-y-2.5">
      {/* ============ */}
      {data.map((item, index) => {
        return (
          <Disclosure key={index} defaultOpen={index < 2}>
            {({open}) => (
              <>
                <Disclosure.Button className="flex items-center justify-between w-full px-4 py-2 font-medium text-left bg-[#F9F7F7]/80 hover:bg-slate-200/60 dark:bg-secondary-700 dark:hover:bg-slate-700 rounded-lg focus:outline-none focus-visible:ring focus-visible:ring-slate-500 focus-visible:ring-opacity-75 ">
                  <span>{item.name}</span>
                  {!open ? (
                    <PlusIcon className="w-4 h-4 text-slate-600 dark:text-black" />
                  ) : (
                    <MinusIcon className="w-4 h-4 text-slate-600 dark:text-black" />
                  )}
                </Disclosure.Button>
                <Disclosure.Panel
                  className={panelClassName}
                  as="div"
                  dangerouslySetInnerHTML={{__html: item.content}}
                ></Disclosure.Panel>
              </>
            )}
          </Disclosure>
        );
      })}

      {/* ============ */}
    </div>
  );
};

export default AccordionInfo;
