import type {SectionProductsSliderFragment} from 'storefrontapi.generated';
import {SnapSliderProducts} from '~/components/SnapSliderProducts';
import {Link} from '@remix-run/react';
import ButtonSecondary from '~/components/Button/ButtonSecondary';

export function SectionProductsSlider(props: SectionProductsSliderFragment) {
  const {
    heading_bold,
    heading_light,
    sub_heading,
    body,
    collection,
    style,
    columns,
    products_limit,
    background_color,
    heading_color,
    show_view_all,
    view_all_text,
  } = props as any;

  // Fallback para compatibilidad con secciones antiguas
  const allProducts = collection?.reference?.productsSliderSection || (collection?.reference as any)?.products;
  
  // Apply products limit if set
  const limit = Number(products_limit?.value) || 10;
  const products = allProducts?.nodes?.slice(0, limit);

  // Parse columns value (default to 4, supports 2-6)
  const colValue = Number(columns?.value);
  const columnsDesktop = (colValue >= 2 && colValue <= 6) ? colValue as 2 | 3 | 4 | 5 | 6 : 4;

  // Colors
  const bgColor = background_color?.value;
  const headingTxtColor = heading_color?.value;
  
  // View all button
  const showViewAll = show_view_all?.value === 'true';
  const viewAllText = view_all_text?.value || 'Ver todo';
  const collectionHandle = collection?.reference?.handle;

  return (
    <section
      className="py-8 lg:py-12"
      style={bgColor ? {backgroundColor: bgColor} : undefined}
    >
      <SnapSliderProducts
        heading_bold={heading_bold?.value}
        heading_light={heading_light?.value}
        sub_heading={sub_heading?.value}
        products={products}
        cardStyle={style?.value as '1' | '2'}
        isSkeleton={!collection}
        columnsDesktop={columnsDesktop}
        headingColor={headingTxtColor}
      />
      {showViewAll && collectionHandle && (
        <div className="container flex justify-center mt-8 lg:mt-12">
          <Link to={`/collections/${collectionHandle}`}>
            <ButtonSecondary>{viewAllText}</ButtonSecondary>
          </Link>
        </div>
      )}
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
    products_limit: field(key: "products_limit") {
      key
      value
    }
    background_color: field(key: "background_color") {
      key
      value
    }
    heading_color: field(key: "heading_color") {
      key
      value
    }
    show_view_all: field(key: "show_view_all") {
      key
      value
    }
    view_all_text: field(key: "view_all_text") {
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
            first: 20, 
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
