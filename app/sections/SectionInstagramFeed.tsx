import {type ParsedMetafields} from '@shopify/hydrogen';
import {parseSection} from '~/utils/parseSection';
import {useFetcher} from '@remix-run/react';
import type {SectionInstagramFeedFragment} from 'storefrontapi.generated';
import BackgroundSection from '~/components/BackgroundSection';
import Heading from '~/components/Heading/Heading';
import {useEffect, useMemo} from 'react';
import {usePrefixPathWithLocale} from '~/lib/utils';
import {Empty} from '~/components/Empty';
import ButtonSecondary from '~/components/Button/ButtonSecondary';
import type {InstagramPost} from '~/lib/instafeed.server';

export function SectionInstagramFeed(props: SectionInstagramFeedFragment) {
  const section = parseSection<
    SectionInstagramFeedFragment,
    {
      heading?: ParsedMetafields['single_line_text_field'];
    }
  >(props);

  const {heading, sub_heading, background_color, limit, cta_text, cta_link} =
    section;

  const {load, data} = useFetcher<{posts: InstagramPost[]}>();

  const postsApiPath = usePrefixPathWithLocale(
    `/api/instagram-feed?limit=${Math.min(Number(limit?.value) || 8, 8)}`,
  );

  useEffect(() => {
    load(postsApiPath);
  }, [load, postsApiPath]);

  // No renderiza nada mientras carga NI si el feed vuelve vacío (Instafeed
  // sin configurar todavía, o su API caída) — a diferencia del blog
  // carousel, acá no tiene sentido mostrar un estado "vacío" con mensaje,
  // ya que este bloque es puramente de refuerzo social.
  if (!data?.posts?.length) return null;

  const {posts} = data;

  const hasBgColor =
    background_color?.value &&
    background_color?.value !== 'transparent' &&
    background_color?.value !== '#ffffff' &&
    background_color?.value !== '#fff';

  return (
    <section className="section-SectionInstagramFeed container">
      <div className={hasBgColor ? 'relative py-12 lg:py-16' : ''}>
        {hasBgColor && (
          <BackgroundSection
            style={{backgroundColor: background_color?.value ?? undefined}}
          />
        )}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            {(heading?.value || sub_heading?.value) && (
              <Heading desc={sub_heading?.value} isCenter={false}>
                {heading?.value}
              </Heading>
            )}
            {cta_link?.value && (
              <ButtonSecondary
                href={cta_link.value}
                targetBlank
                sizeClass="py-2.5 px-5"
                fontSize="text-sm font-medium"
              >
                {cta_text?.value || 'Ver en Instagram'}
              </ButtonSecondary>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6 mt-8 lg:mt-10">
            {posts.map((post) => (
              <InstagramPostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function InstagramPostCard({post}: {post: InstagramPost}) {
  if (!post.imageUrl) return null;

  const caption = post.caption?.split('\n')[0]?.slice(0, 90) ?? '';

  return (
    <a
      href={post.permalink}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      <div className="aspect-[1/1] rounded-2xl overflow-hidden bg-slate-100 relative">
        <img
          src={post.imageUrl}
          alt={caption || 'Publicación de Instagram'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {post.type === 'video' && (
          <span className="absolute top-2 right-2 rounded-full bg-black/60 text-white p-1.5">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        )}
      </div>
      {caption && (
        <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
          {caption}
        </p>
      )}
    </a>
  );
}

export const SECTION_INSTAGRAM_FEED_FRAGMENT = `#graphql
  fragment SectionInstagramFeed on Metaobject {
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
    limit: field(key: "limit") {
      key
      value
    }
    cta_text: field(key: "cta_text") {
      key
      value
    }
    cta_link: field(key: "cta_link") {
      key
      value
    }
  }
`;
