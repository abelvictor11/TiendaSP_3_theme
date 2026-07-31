import type {SectionProductsSliderFragment} from 'storefrontapi.generated';
import {isVisibleBackground} from '~/utils/isVisibleBackground';
import {SnapSliderProducts} from '~/components/SnapSliderProducts';
import BackgroundSection from '~/components/BackgroundSection';

export function SectionProductsSlider(props: SectionProductsSliderFragment) {
  const {
    heading_bold,
    heading_light,
    sub_heading,
    body,
    collection,
    style,
    columns,
    show_view_button,
    background_color,
  } = props;
  // Fallback para compatibilidad con secciones antiguas
  const products = collection?.reference?.productsSliderSection || (collection?.reference as any)?.products;

  // Parse columns value (default to 4 if not set)
  const columnsDesktop = columns?.value === '3' ? 3 : 4;

  // Mismo criterio que SectionBlogCarousel: blanco/transparente no cuenta
  // como "tiene color de fondo" (evita el wrapper/BackgroundSection extra
  // cuando no aporta nada visualmente).
  // Un fondo blanco o gris muy claro no aporta nada visual y deja un panel
  // gris "suelto"; en esos casos no se renderiza el BackgroundSection.
  const hasBgColor = isVisibleBackground(background_color?.value);

  return (
    <section>
      <div className={hasBgColor ? 'relative py-12 lg:py-16' : ''}>
        {hasBgColor && (
          <BackgroundSection
            style={{backgroundColor: background_color?.value ?? undefined}}
          />
        )}
        <SnapSliderProducts
          heading_bold={heading_bold?.value}
          heading_light={heading_light?.value}
          sub_heading={sub_heading?.value}
          products={products?.nodes}
          cardStyle={style?.value as '1' | '2'}
          isSkeleton={!collection}
          columnsDesktop={columnsDesktop}
        />
      </div>
    </section>
  );
}

export const SECTION_PRODUCTS_SLIDER_FRAGMENT = `#graphql
  fragment SectionProductsSlider on Metaobject {
    type
    heading_bold: field(key: "heading_bold") {
      key
      value
    }
    heading_light: field(key: "heading_light") {
      key
      value
    }
    sub_heading: field(key: "sub_heading") {
      key
      value
    }
    body: field(key: "body") {
      key
      value
    }
    style: field(key: "style") {
      key
      value
    }
    columns: field(key: "columns") {
      key
      value
    }
    show_view_button: field(key: "show_view_button") {
      key
      value
    }
    background_color: field(key: "background_color") {
      key
      value
    }

    collection: field(key: "collection") {
      type
      key
      reference {
        ... on Collection {
          id
          handle
          title
          description
          productsSliderSection: products(
            first: 10, 
          ) {
            nodes {
              ...CommonProductCard
            }
          }
        }
      }
    }
  }
`;
