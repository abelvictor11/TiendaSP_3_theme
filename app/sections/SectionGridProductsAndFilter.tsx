import type {SectionGridProductsAndFilterFragment} from 'storefrontapi.generated';
import Heading from '~/components/Heading/Heading';
import {SortFilter} from '~/components/SortFilter';
import ButtonPrimary from '~/components/Button/ButtonPrimary';
import {Pagination} from '@shopify/hydrogen';
import {ProductsGrid} from '~/components/ProductsGrid';
import {useRouteLoaderData} from '@remix-run/react';
import type {RootLoader} from '~/root';

export function SectionGridProductsAndFilter(
  props: SectionGridProductsAndFilterFragment,
) {
  const {heading, sub_heading, collection} = props;
  const background_color = (props as any).background_color?.value;
  const heading_color = (props as any).heading_color?.value;
  const columns = Number((props as any).columns?.value) || 4;
  const products = collection?.reference?.sectionGridProductsAndFilterProducts;
  const rootData = useRouteLoaderData<RootLoader>('root');
  const locale = rootData?.selectedLocale;
  const isSkeleton = !collection;

  //
  return (
    <section style={background_color ? {backgroundColor: background_color} : undefined}>
      <div className="nc-SectionGridProductsAndFilter container py-8 lg:py-12">
        <Heading
          className={
            'mb-12 lg:mb-14 text-neutral-900 dark:text-neutral-50 flex flex-1'
          }
          rightDescText={''}
          desc={sub_heading?.value ?? ''}
          style={heading_color ? {color: heading_color} : undefined}
        >
          {heading?.value}
        </Heading>

        {!isSkeleton && locale && (
          <SortFilter
            filters={
              collection?.reference?.sectionGridProductsAndFilterProducts
                .filters ?? []
            }
            defaultPriceFilter={{
              locale,
              value:
                collection?.reference?.sectionGridProductsAndFilterProductsDefaultFilter?.filters.find(
                  (filter) => filter.id === 'filter.v.price',
                )?.values[0] ?? null,
            }}
          />
        )}

        <hr className="my-8" />

        <div className="">
          {isSkeleton && <ProductsGrid isSkeleton className={`grid sm:grid-cols-2 lg:grid-cols-${columns} xl:grid-cols-${columns} gap-x-4 gap-y-10 auto-rows-fr`} />}

          {!isSkeleton && !!products?.nodes.length && (
            <Pagination connection={products}>
              {({
                nodes,
                isLoading,
                PreviousLink,
                NextLink,
                hasNextPage,
                hasPreviousPage,
              }) => (
                <>
                  {!!hasPreviousPage && (
                    <div className="flex items-center justify-center mb-12">
                      <ButtonPrimary as={PreviousLink} loading={isLoading}>
                        {'Load previous'}
                      </ButtonPrimary>
                    </div>
                  )}
                  <ProductsGrid nodes={nodes} className={`sm:!grid-cols-2 lg:!grid-cols-${columns} xl:!grid-cols-${columns}`} />
                  {!!hasNextPage && (
                    <div className="flex items-center justify-center mt-16">
                      <ButtonPrimary as={NextLink} loading={isLoading}>
                        {'Cargar más productos'}
                      </ButtonPrimary>
                    </div>
                  )}
                </>
              )}
            </Pagination>
          )}
        </div>
      </div>
    </section>
  );
}

export const SECTION_GRID_PRODUCTS_AND_FILTER_FRAGMENT = `#graphql
  fragment SectionGridProductsAndFilter on Metaobject {
    type
    heading: field(key: "heading") {
      key
      value
    }
    sub_heading: field(key: "sub_heading") {
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
    columns: field(key: "columns") {
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
          sectionGridProductsAndFilterProductsDefaultFilter :products(first: 0, filters : {}) {
            filters {
              id
              label
              type
              values {
                id
                label
                count
                input
              }
            }
          }
          sectionGridProductsAndFilterProducts :products(
            first: $first,
            last: $last,
            before: $startCursor,
            after: $endCursor,
            filters: $filters,
            sortKey: $sortKey,
            reverse: $reverse
          ) {
            filters {
              id
              label
              type
              values {
                id
                label
                count
                input
              }
            }
            nodes {
              ...CommonProductCard
            }
            pageInfo {
              hasPreviousPage
              hasNextPage
              endCursor
              startCursor
            }
          }
        }
      }
    }
  }
`;
