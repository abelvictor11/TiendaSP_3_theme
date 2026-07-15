import {HomeIcon} from '@heroicons/react/24/outline';
import ButtonPrimary from './Button/ButtonPrimary';

export function GenericError({
  error,
  heading = 'Algo salió mal.',
  description = 'Ocurrió un error al cargar esta página. Intenta recargar o vuelve al inicio.',
}: {
  error?: {message: string; stack?: string};
  heading?: string;
  description?: string;
}) {
  const isDev = import.meta.env.DEV;
  if (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    if (isDev) description += `\n${error.message}`;
  }

  return (
    <>
      <div className="container py-12 sm:py-16">
        <div className="max-w-screen-md flex flex-col items-start gap-8">
          <h1 className="block text-2xl sm:text-3xl lg:text-4xl font-semibold capitalize">
            {heading}
          </h1>

          <p dangerouslySetInnerHTML={{__html: description}}></p>
          {isDev && error?.stack && (
            <pre
              style={{
                padding: '2rem',
                background: 'hsla(10, 50%, 50%, 0.1)',
                color: 'red',
                overflow: 'auto',
                maxWidth: '100%',
              }}
              dangerouslySetInnerHTML={{
                __html: addLinksToStackTrace(error.stack),
              }}
            />
          )}
          <ButtonPrimary href={'/'}>
            <HomeIcon className="h-5 w-5 mr-2" />
            Volver al inicio
          </ButtonPrimary>
        </div>
      </div>
    </>
  );
}

function addLinksToStackTrace(stackTrace: string) {
  return stackTrace?.replace(
    /^\s*at\s?.*?[(\s]((\/|\w\:).+)\)\n/gim,
    (all, m1) =>
      all.replace(
        m1,
        `<a href="vscode://file${m1}" class="hover:underline">${m1}</a>`,
      ),
  );
}
