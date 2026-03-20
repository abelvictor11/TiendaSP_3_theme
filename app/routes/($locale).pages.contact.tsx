import {
  json,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  type MetaArgs,
} from '@shopify/remix-oxygen';
import {useFetcher, useLoaderData} from '@remix-run/react';
import {getSeoMeta} from '@shopify/hydrogen';
import {seoPayload} from '~/lib/seo.server';
import {routeHeaders} from '~/data/cache';
import PageHeader from '~/components/PageHeader';
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

export const headers = routeHeaders;

const CONTACT_EMAILS = ['ventasonline@fitshop.com.co'];

export async function loader({request}: LoaderFunctionArgs) {
  const seo = seoPayload.page({
    page: {title: 'Contacto', seo: {title: 'Contacto', description: 'Contáctanos para cualquier consulta sobre equipos de gimnasio y fitness.'}},
    url: request.url,
  });
  return json({seo});
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMeta(...matches.map((match) => (match.data as any).seo));
};

export async function action({request, context}: ActionFunctionArgs) {
  const formData = await request.formData();
  const name = formData.get('name')?.toString().trim() || '';
  const email = formData.get('email')?.toString().trim() || '';
  const phone = formData.get('phone')?.toString().trim() || '';
  const subject = formData.get('subject')?.toString().trim() || '';
  const message = formData.get('message')?.toString().trim() || '';

  // Validation
  const errors: Record<string, string> = {};
  if (!name) errors.name = 'El nombre es obligatorio';
  if (!email) errors.email = 'El correo es obligatorio';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Correo inválido';
  if (!subject) errors.subject = 'El asunto es obligatorio';
  if (!message) errors.message = 'El mensaje es obligatorio';

  if (Object.keys(errors).length > 0) {
    return json({success: false, errors, message: 'Por favor completa todos los campos requeridos.'}, {status: 400});
  }

  try {
    const {env} = context;
    const storeDomain = env.PUBLIC_SHOPIFY_STORE_DOMAIN || env.PUBLIC_STORE_DOMAIN;
    const adminToken = env.ADMIN_API_ACCESS_TOKEN;

    if (!adminToken || !storeDomain) {
      console.error('Missing ADMIN_API_ACCESS_TOKEN or store domain env var');
      return json({success: false, errors: {}, message: 'Error de configuración del servidor. Intenta de nuevo más tarde.'}, {status: 500});
    }

    const handle = `contact-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Store in Shopify as metaobject
    const adminRes = await fetch(`https://${storeDomain}/admin/api/2025-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': adminToken,
      },
      body: JSON.stringify({
        query: `mutation CreateContactSubmission($metaobject: MetaobjectCreateInput!) {
          metaobjectCreate(metaobject: $metaobject) {
            metaobject { id handle }
            userErrors { field message }
          }
        }`,
        variables: {
          metaobject: {
            type: 'contact_submission',
            handle,
            fields: [
              {key: 'name', value: name},
              {key: 'email', value: email},
              {key: 'phone', value: phone || ''},
              {key: 'subject', value: subject},
              {key: 'message', value: message},
              {key: 'status', value: 'pending'},
            ],
          },
        },
      }),
    });

    const adminData = await adminRes.json();
    const userErrors = adminData?.data?.metaobjectCreate?.userErrors;

    if (userErrors?.length) {
      console.error('Metaobject creation errors:', userErrors);
    }

    // Send email notification via Admin API (create customer event or use webhook)
    // For now, log the submission - set up Shopify Flow for email forwarding
    console.log(`📧 New contact submission from ${name} <${email}> - Subject: ${subject}`);

    return json({
      success: true,
      errors: {},
      message: '¡Gracias por contactarnos! Te responderemos lo antes posible.',
    });
  } catch (error) {
    console.error('Contact form error:', error);
    return json({
      success: false,
      errors: {},
      message: 'Ocurrió un error al enviar tu mensaje. Por favor intenta de nuevo.',
    }, {status: 500});
  }
}

export default function ContactPage() {
  const fetcher = useFetcher<{success: boolean; errors: Record<string, string>; message: string}>();
  const isSubmitting = fetcher.state === 'submitting';
  const data = fetcher.data;

  return (
    <div className="page-contact pt-16 lg:pt-24 pb-20 lg:pb-28">
      <div className="container">
        <div className="max-w-screen-lg mx-auto">
          <PageHeader
            title="Contacto"
            hasBreadcrumb
            breadcrumbText="Contacto"
          />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 mt-12 lg:mt-16">
            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-secondary-800 mb-4">
                  Información de contacto
                </h3>
                <p className="text-neutral-600 text-sm leading-relaxed">
                  ¿Tienes alguna pregunta sobre nuestros equipos de gimnasio? 
                  Escríbenos y te responderemos lo antes posible.
                </p>
              </div>

              <div className="space-y-5">
                <a
                  href="mailto:ventasonline@fitshop.com.co"
                  className="flex items-start gap-4 group"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                    <EnvelopeIcon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-secondary-800">Correo electrónico</p>
                    <p className="text-sm text-neutral-600 group-hover:text-primary-600 transition-colors">
                      ventasonline@fitshop.com.co
                    </p>
                  </div>
                </a>

                <a
                  href="tel:+57"
                  className="flex items-start gap-4 group"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                    <PhoneIcon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-secondary-800">Teléfono</p>
                    <p className="text-sm text-neutral-600 group-hover:text-primary-600 transition-colors">
                      Contáctanos por WhatsApp
                    </p>
                  </div>
                </a>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
                    <MapPinIcon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-secondary-800">Ubicación</p>
                    <p className="text-sm text-neutral-600">Colombia</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <p className="text-xs text-neutral-400">
                  Horario de atención: Lunes a Viernes, 8:00am - 6:00pm
                </p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-3">
              {data?.success ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-6">
                    <CheckCircleIcon className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-secondary-800 mb-2">
                    ¡Mensaje enviado!
                  </h3>
                  <p className="text-neutral-600 max-w-md">
                    {data.message}
                  </p>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="mt-6 text-sm text-primary-600 hover:text-primary-700 underline"
                  >
                    Enviar otro mensaje
                  </button>
                </div>
              ) : (
                <fetcher.Form method="post" className="space-y-5">
                  {data?.message && !data.success && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                      <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0" />
                      {data.message}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-secondary-800 mb-1.5">
                        Nombre completo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm text-secondary-800 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
                        placeholder="Tu nombre"
                      />
                      {data?.errors?.name && <p className="mt-1 text-xs text-red-500">{data.errors.name}</p>}
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-secondary-800 mb-1.5">
                        Correo electrónico <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm text-secondary-800 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
                        placeholder="tu@correo.com"
                      />
                      {data?.errors?.email && <p className="mt-1 text-xs text-red-500">{data.errors.email}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-secondary-800 mb-1.5">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm text-secondary-800 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
                        placeholder="+57 300 000 0000"
                      />
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-secondary-800 mb-1.5">
                        Asunto <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        required
                        className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm text-secondary-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
                      >
                        <option value="">Selecciona un asunto</option>
                        <option value="Información de productos">Información de productos</option>
                        <option value="Estado de mi pedido">Estado de mi pedido</option>
                        <option value="Devoluciones y garantías">Devoluciones y garantías</option>
                        <option value="Asesoría personalizada">Asesoría personalizada</option>
                        <option value="Otro">Otro</option>
                      </select>
                      {data?.errors?.subject && <p className="mt-1 text-xs text-red-500">{data.errors.subject}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-secondary-800 mb-1.5">
                      Mensaje <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={5}
                      className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm text-secondary-800 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors resize-none"
                      placeholder="Escribe tu mensaje aquí..."
                    />
                    {data?.errors?.message && <p className="mt-1 text-xs text-red-500">{data.errors.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 py-3 rounded-full bg-primary-600 text-white font-medium text-sm hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isSubmitting ? 'Enviando...' : 'Enviar mensaje'}
                  </button>
                </fetcher.Form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
