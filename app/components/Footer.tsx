import React from 'react';
import type {ChildEnhancedMenuItem, ParentEnhancedMenuItem} from '~/lib/utils';
import {Link} from './Link';
import {
  CheckCircleIcon,
  EnvelopeIcon,
  InformationCircleIcon,
  MapPinIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';
import {useFetcher, useRouteLoaderData} from '@remix-run/react';
import Input from './MyInput';
import ButtonCircle from './Button/ButtonCircle';
import {ArrowRightIcon} from '@heroicons/react/24/solid';
import SocialsList from './SocialsList';
import {type AddSubscriberMutation} from 'storefrontapi.generated';
import {FooterMenuDataWrap, HeaderMenuDataWrap} from './Layout';
import type {RootLoader} from '~/root';

interface FooterProps {}

const Footer: React.FC<FooterProps> = () => {
  const rootData = useRouteLoaderData<RootLoader>('root');
  const shop = rootData?.layout?.shop;

  const renderWidgetMenu = (menu: ParentEnhancedMenuItem, index: number) => {
    return (
      <div key={index + menu.id} className="text-sm">
        <h2 className="font-semibold text-white">
          {menu.title}
        </h2>
        <ul className="mt-5 space-y-4">
          {menu.items?.map((item: ChildEnhancedMenuItem, i) => (
            <li
              key={`${i + item.id}`}
              className="text-neutral-400 hover:text-white transition-colors"
            >
              {item.to.startsWith('http') ? (
                <a
                  href={item.to}
                  target={item.target}
                  rel="noopener noreferrer"
                >
                  {item.title}
                </a>
              ) : (
                <Link to={item.to} target={item.target} prefetch="intent">
                  {item.title}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <footer
      className="bg-black text-neutral-300"
      aria-labelledby="footer-heading"
    >
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>

      <div className="mx-auto max-w-7xl px-6 pb-8 pt-20 sm:pt-24 lg:px-8 lg:pt-28">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          {/* Menu columns */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 xl:col-span-2">
            <FooterMenuDataWrap>
              {({footerMenu}) => footerMenu?.items?.map(renderWidgetMenu)}
            </FooterMenuDataWrap>
          </div>

          {/* Newsletter + Contact Info */}
          <div className="mt-10 xl:mt-0 space-y-8">
            <WidgetAddSubscriberForm />

            {/* Contact Info */}
            <div className="text-sm space-y-3">
              <h2 className="font-semibold text-white">Contáctanos</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <MapPinIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-neutral-400" />
                  <span>Cra 43c 68 Sur 12<br />Sabaneta, Antioquia</span>
                </li>
                <li className="flex items-center gap-2">
                  <PhoneIcon className="w-5 h-5 flex-shrink-0 text-neutral-400" />
                  <a href="tel:+573146512753" className="hover:text-white transition-colors">+57 314 651 2753</a>
                </li>
                <li className="flex items-center gap-2">
                  <EnvelopeIcon className="w-5 h-5 flex-shrink-0 text-neutral-400" />
                  <a href="mailto:info@cyclewear.com.co" className="hover:text-white transition-colors">info@cyclewear.com.co</a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-neutral-800 pt-8 sm:mt-20 md:flex md:items-center md:justify-between lg:mt-20">
          <div className="flex flex-wrap gap-x-6 gap-y-3 md:order-2">
            <HeaderMenuDataWrap>
              {({headerData}) => (
                <SocialsList
                  data={(headerData?.socials?.edges || []).map((edge) => {
                    const node = edge.node;
                    return {
                      name: node.title?.value || '',
                      icon: node.icon?.reference?.image?.url || '',
                      href: node.link?.value || '',
                    };
                  })}
                  itemClass="block w-6 h-6 opacity-90 hover:opacity-100"
                  className="!gap-5"
                />
              )}
            </HeaderMenuDataWrap>
          </div>
          <p className="mt-8 text-[13px] leading-5 text-neutral-500 md:order-1 md:mt-0">
            © {new Date().getFullYear()}
            {shop?.name}, Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export function WidgetAddSubscriberForm() {
  const fetcher = useFetcher();
  const {customerCreate} = (fetcher.data || {}) as AddSubscriberMutation;

  return (
    <div
      className={`nc-WidgetAddSubscriberForm overflow-hidden rounded-3xl border border-neutral-700`}
    >
      <div
        className={`nc-WidgetHeading1 flex items-center justify-between p-4 border-b border-neutral-700`}
      >
        <h2 className="flex flex-wrap gap-3 text-base font-semibold text-white">
          <EnvelopeIcon className="w-6 h-6" />
          <span>Manténgase actualizado</span>
        </h2>
      </div>

      <div className="p-4 xl:p-5">
        <span className="mt-2 text-sm leading-6 text-neutral-400">
          Suscríbete a nuestro boletín para recibir las últimas actualizaciones y ofertas especiales.
        </span>
        <div className="mt-4">
          <fetcher.Form
            className="relative"
            method="post"
            action="/?index"
            preventScrollReset
          >
            <Input
              required
              aria-required
              placeholder="Introduzca su dirección de correo electrónico"
              type="email"
              className="rounded-2xl"
              name="new_subscribe_email"
            />
            <ButtonCircle
              type="submit"
              name="_action"
              value="add_new_subscribe"
              className="absolute transform top-1/2 -translate-y-1/2 right-1"
              disabled={fetcher.state === 'submitting'}
            >
              <ArrowRightIcon className="w-5 h-5" />
            </ButtonCircle>
          </fetcher.Form>

          {customerCreate?.customerUserErrors[0]?.message && (
            <div className="text-red-400 flex gap-2 mt-1 ml-1">
              <InformationCircleIcon className="w-4 h-4" />
              <i className="text-xs">
                {customerCreate?.customerUserErrors[0]?.message}
              </i>
            </div>
          )}
          {!customerCreate?.customerUserErrors.length &&
            customerCreate?.customer?.id && (
              <div className="text-green-500 flex gap-2 mt-1 ml-1">
                <CheckCircleIcon className="w-4 h-4" />
                <i className="text-xs">Thank you for subscribing!</i>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default Footer;
