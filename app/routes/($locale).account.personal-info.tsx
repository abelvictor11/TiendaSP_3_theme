import ButtonPrimary from '~/components/Button/ButtonPrimary';
import {PencilIcon} from '@heroicons/react/24/outline';
import {type CustomerDetailsFragment} from 'customer-accountapi.generated';
import {useAccoutRootLoaderData} from '~/lib/account-data';
import {PageAccoutLayout} from '~/components/PageAccountLayout';

const Page = () => {
  const data = useAccoutRootLoaderData();
  const {firstName, lastName, emailAddress, phoneNumber} =
    data.customer as CustomerDetailsFragment;

  return (
    <PageAccoutLayout breadcrumbText="Información personal">
      <div>
        <div className="mt-6 border-t border-gray-100">
          <dl className="divide-y divide-gray-100">
            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm font-medium leading-6 text-gray-900">
                Nombre
              </dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {firstName || 'Agregar nombre'}
              </dd>
            </div>
            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm font-medium leading-6 text-gray-900">
                Apellido
              </dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {lastName || 'Agregar apellido'}
              </dd>
            </div>
            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm font-medium leading-6 text-gray-900">
                Teléfono
              </dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {phoneNumber?.phoneNumber ?? 'N/A'}
              </dd>
            </div>
            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm font-medium leading-6 text-gray-900">
                Correo electrónico
              </dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {emailAddress?.emailAddress ?? 'N/A'}
              </dd>
            </div>
            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm font-medium leading-6 text-gray-900"></dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0"></dd>
            </div>
          </dl>
        </div>

        <div className="flex">
          <ButtonPrimary href="/account/edit">
            <PencilIcon className="w-4 h-4 me-2" />
            Editar información personal
          </ButtonPrimary>
        </div>
      </div>
    </PageAccoutLayout>
  );
};

export default Page;
