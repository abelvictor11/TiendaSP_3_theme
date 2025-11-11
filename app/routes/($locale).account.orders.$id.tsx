import clsx from 'clsx';
import {json, redirect, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {useLoaderData, type MetaFunction} from '@remix-run/react';
import {Money, Image, flattenConnection, CartForm} from '@shopify/hydrogen';
import type {FulfillmentStatus} from '@shopify/hydrogen/customer-account-api-types';
import type {OrderFragment} from 'customer-accountapi.generated';
import {statusMessage} from '~/lib/utils';
import {CUSTOMER_ORDER_QUERY} from '~/graphql/customer-account/CustomerOrderQuery';
import Prices from '~/components/Prices';
import {PageAccoutLayout} from '~/components/PageAccountLayout';
import ButtonPrimary from '~/components/Button/ButtonPrimary';
import {
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  XCircleIcon,
  ArrowUpRightIcon,
} from '@heroicons/react/24/outline';
import {useAside} from '~/components/Aside';
import ButtonSecondary from '~/components/Button/ButtonSecondary';
import ButtonThird from '~/components/Button/ButtonThird';

export const meta: MetaFunction<typeof loader> = ({data}) => {
  return [{title: `Order ${data?.order?.name}`}];
};

export async function loader({request, context, params}: LoaderFunctionArgs) {
  if (!params.id) {
    return redirect(params?.locale ? `${params.locale}/account` : '/account');
  }

  const queryParams = new URL(request.url).searchParams;
  const orderToken = queryParams.get('key');

  try {
    const orderId = orderToken
      ? `gid://shopify/Order/${params.id}?key=${orderToken}`
      : `gid://shopify/Order/${params.id}`;

    const {data, errors} = await context.customerAccount.query(
      CUSTOMER_ORDER_QUERY,
      {variables: {orderId}},
    );

    if (errors?.length || !data?.order || !data?.order?.lineItems) {
      throw new Error('order information');
    }

    const order: OrderFragment = data.order;

    const lineItems = flattenConnection(order.lineItems);

    const discountApplications = flattenConnection(order.discountApplications);

    const firstDiscount = discountApplications[0]?.value;

    const discountValue =
      firstDiscount?.__typename === 'MoneyV2' && firstDiscount;

    const discountPercentage =
      firstDiscount?.__typename === 'PricingPercentageValue' &&
      firstDiscount?.percentage;

    const fulfillments = flattenConnection(order.fulfillments);

    let fulfillmentStatus =
      fulfillments.length > 0
        ? fulfillments[0].status
        : ('OPEN' as FulfillmentStatus);

    if (order.cancelledAt) {
      fulfillmentStatus = 'CANCELLED';
    }

    const financialStatus = order.financialStatus;
    const paymentUrl = order.paymentInformation?.paymentCollectionUrl;

    return json({
      order,
      lineItems,
      discountValue,
      discountPercentage,
      fulfillmentStatus,
      financialStatus,
      paymentUrl,
      manageUrl:
        context.env.PUBLIC_CUSTOMER_ACCOUNT_API_URL +
        '/account/orders/' +
        params.id,
    });
  } catch (error) {
    throw new Response(error instanceof Error ? error.message : undefined, {
      status: 404,
    });
  }
}

export default function OrderRoute() {
  const {
    order,
    lineItems,
    discountValue,
    discountPercentage,
    fulfillmentStatus,
    financialStatus,
    paymentUrl,
    manageUrl,
  } = useLoaderData<typeof loader>();
  const {open: openAside} = useAside();

  const renderStatusIcon = () => {
    if (fulfillmentStatus === 'SUCCESS') {
      return <CheckIcon className="h-5 w-5" />;
    }
    if (fulfillmentStatus === 'CANCELLED') {
      return <XCircleIcon className="h-5 w-5" />;
    }
    if (fulfillmentStatus === 'OPEN') {
      return <CheckIcon className="h-5 w-5" />;
    }
    if (fulfillmentStatus === 'PENDING') {
      return <CheckIcon className="h-5 w-5" />;
    }
    if (fulfillmentStatus === 'ERROR') {
      return <ExclamationCircleIcon className="h-5 w-5" />;
    }
    if (fulfillmentStatus === 'FAILURE') {
      return <ExclamationTriangleIcon className="h-5 w-5" />;
    }
    return null;
  };

  const renderOrder = () => {
    return (
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden z-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 sm:p-8 bg-slate-50 dark:bg-slate-500/5">
          <div>
            <p className="text-lg font-semibold">Order No. {order.name}</p>
            <div className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 sm:mt-2">
              <div className="flex items-center flex-wrap gap-y-2">
                {fulfillmentStatus && (
                  <div
                    className={clsx(
                      fulfillmentStatus === 'SUCCESS' && 'text-green-500',
                      fulfillmentStatus === 'CANCELLED' && 'text-red-500',
                      fulfillmentStatus === 'OPEN' && 'text-blue-500',
                      fulfillmentStatus === 'PENDING' && 'text-blue-500',
                      fulfillmentStatus === 'ERROR' && 'text-red-500',
                      fulfillmentStatus === 'FAILURE' && 'text-red-500',
                      'font-medium flex items-center gap-1.5',
                    )}
                  >
                    {renderStatusIcon()}
                    <span className={clsx('font-medium')}>
                      {statusMessage(fulfillmentStatus!)}
                    </span>
                  </div>
                )}
                {financialStatus && (
                  <>
                    <div className="sr-only">
                      The financial status of the order.
                    </div>
                    <div
                      className=""
                      title="The financial status of the order."
                    >
                      <span className="mx-2">/</span>
                      <span
                        className={clsx(
                          'text-xs font-medium',
                          financialStatus === 'PAID' && 'text-green-800',
                          financialStatus === 'REFUNDED' && 'text-neutral-800',
                          financialStatus === 'PENDING' && 'text-blue-800',
                          financialStatus === 'EXPIRED' && 'text-red-700',
                          financialStatus === 'VOIDED' && 'text-red-800',
                        )}
                      >
                        <span>($){financialStatus}</span>
                      </span>
                    </div>
                  </>
                )}
              </div>

              <p className="mt-1.5 sm:mt-2">
                {new Date(order.processedAt!).toDateString()}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
            <CartForm
              route="/cart"
              inputs={{
                lines: lineItems.map(({variantId, quantity}) => ({
                  merchandiseId: variantId as string,
                  quantity,
                })),
              }}
              action={CartForm.ACTIONS.LinesAdd}
            >
              {(fetcher) => (
                <>
                  <ButtonPrimary
                    type="submit"
                    fontSize="text-sm font-medium"
                    sizeClass="py-2 px-3 lg:py-2.5 lg:px-5"
                    disabled={fetcher.state !== 'idle'}
                    onClick={() => openAside('cart')}
                  >
                    Buy again
                  </ButtonPrimary>
                </>
              )}
            </CartForm>

            {financialStatus === 'PENDING' && (
              <ButtonPrimary
                fontSize="text-sm font-medium"
                sizeClass="py-2 px-3 lg:py-2.5 lg:px-5"
                href={paymentUrl || undefined}
                targetBlank={false}
                as={'a'}
              >
                Pay now
              </ButtonPrimary>
            )}

            <span className="self-center text-slate-400">/</span>

            <ButtonSecondary
              fontSize="text-sm font-medium"
              sizeClass="py-2 px-3 lg:py-2.5 lg:pl-5 lg:pr:4"
              href={manageUrl}
              targetBlank={false}
              as={'a'}
            >
              Manage
              <ArrowUpRightIcon className="h-4 w-4 ml-1" />
            </ButtonSecondary>
          </div>
        </div>
        <div className="border-t border-slate-200 dark:border-slate-700 p-4 sm:p-8 divide-y divide-y-slate-200 dark:divide-slate-700">
          {lineItems.map(
            ({
              id,
              image,
              discountAllocations,
              quantity,
              title,
              totalDiscount,
              price,
              variantTitle,
            }) => {
              return (
                <div
                  key={id}
                  className="flex flex-col sm:flex-row flex-wrap gap-4 py-4 sm:py-7 last:pb-0 first:pt-0"
                >
                  <div className="relative h-24 w-16 sm:w-20 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    <Image
                      sizes="100px"
                      data={image || undefined}
                      width={100}
                      className="h-full w-full object-cover object-center"
                    />
                  </div>

                  <div className="flex gap-2 flex-1 flex-col">
                    <div>
                      <div className="flex flex-wrap gap-2 justify-between ">
                        <div>
                          <h3 className="text-base font-medium">{title}</h3>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {variantTitle}
                          </p>
                        </div>
                        <Prices price={price!} className="mt-0.5" />
                      </div>
                    </div>
                    <div className="flex flex-1 items-end justify-between text-sm">
                      <p className="text-gray-500 dark:text-slate-400 flex items-center">
                        <span className="hidden sm:inline-block">Qty</span>
                        <span className="inline-block sm:hidden">x</span>
                        <span className="ml-2">{quantity}</span>
                      </p>

                      <div className="flex">
                        <div className="font-medium text-slate-900 flex">
                          <span className="me-2"> Total:</span>
                          <Money data={totalDiscount!} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            },
          )}
        </div>

        <div className="rounded-lg bg-gray-50 px-4 sm:px-8 py-6">
          <dl className="flex-1 space-y-6 divide-y divide-gray-200 text-sm text-gray-600 sm:grid sm:grid-cols-5 sm:gap-x-6 sm:space-y-0 sm:divide-y-0 lg:flex-none lg:gap-x-8">
            {((discountValue && discountValue.amount) ||
              discountPercentage) && (
              <div className="flex justify-between sm:block">
                <dt className="font-medium text-gray-900">Discounts</dt>
                <dd className="sm:mt-1">
                  {discountPercentage ? (
                    <span className="text-sm">-{discountPercentage}% OFF</span>
                  ) : (
                    discountValue && <Money data={discountValue!} />
                  )}
                </dd>
              </div>
            )}

            <div className="flex justify-between sm:block">
              <dt className="font-medium text-gray-900">Subtotal</dt>
              <dd className="sm:mt-1">
                <Money data={order.subtotal!} />
              </dd>
            </div>

            <div className="flex justify-between pt-6 sm:block sm:pt-0">
              <dt className="font-medium text-gray-900">Tax</dt>
              <dd className="sm:mt-1">
                <Money data={order.totalTax!} />
              </dd>
            </div>

            <div className="flex justify-between pt-6 font-medium text-gray-900 sm:block sm:pt-0">
              <dt>Total amount</dt>
              <dd className="sm:mt-1">
                <Money data={order.totalPrice!} />
              </dd>
            </div>
          </dl>
        </div>
      </div>
    );
  };

  return (
    <div>
      <PageAccoutLayout breadcrumbText="Order detail">
        {renderOrder()}
      </PageAccoutLayout>
    </div>
  );
}
