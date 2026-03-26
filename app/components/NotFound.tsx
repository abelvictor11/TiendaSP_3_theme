import {HomeIcon} from '@heroicons/react/24/outline';
import ButtonPrimary from './Button/ButtonPrimary';
import {FeaturedSection} from './FeaturedSection';
import Heading from './Heading/Heading';

export function NotFound({type = 'page'}: {type?: string}) {
  const heading = `No encontramos esta ${type === 'page' ? 'página' : type}`;
  const description = `No pudimos encontrar lo que buscas. Verifica la URL o regresa a la página principal.`;

  return (
    <div className="py-10 lg:py-20">
      <div className="container">
        <Heading as="h1" desc={description}>
          {heading}
        </Heading>
        <ButtonPrimary href={'/'}>
          <HomeIcon className="w-5 h-5 me-2" />
          <span>Ir a la página principal</span>
        </ButtonPrimary>
        <hr className="mt-20" />
      </div>
      <FeaturedSection className="space-y-20 mt-20" />
    </div>
  );
}
