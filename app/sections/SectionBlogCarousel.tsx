import {type ParsedMetafields} from '@shopify/hydrogen';
import {parseSection} from '~/utils/parseSection';
import {useFetcher} from '@remix-run/react';
import type {SectionBlogCarouselFragment} from 'storefrontapi.generated';
import BackgroundSection from '~/components/BackgroundSection';
import Heading from '~/components/Heading/Heading';
import {useEffect, useMemo} from 'react';
import {usePrefixPathWithLocale} from '~/lib/utils';
import {type Article} from '@shopify/hydrogen/storefront-api-types';
import {Empty} from '~/components/Empty';
import {Link} from '~/components/Link';
import {Image} from '@shopify/hydrogen';

export function SectionBlogCarousel(props: SectionBlogCarouselFragment) {
  const section = parseSection<
    SectionBlogCarouselFragment,
    {
      heading?: ParsedMetafields['single_line_text_field'];
    }
  >(props);

  const {
    heading,
    sub_heading,
    background_color,
    number_of_posts,
    blog_handle,
  } = section;

  const {load, data} = useFetcher<{articles: Article[]}>();

  const queryString = useMemo(
    () =>
      Object.entries({
        pageBy: Math.min(Number(number_of_posts?.value) || 6, 6),
        blogHandle: blog_handle?.value || 'news',
      })
        .map(([key, val]) => (val ? `${key}=${val}` : null))
        .filter(Boolean)
        .join('&'),
    [blog_handle?.value, number_of_posts?.value],
  );
  
  const blogPostsApiPath = usePrefixPathWithLocale(
    `/api/latest-blog-posts?${queryString}`,
  );

  useEffect(() => {
    load(blogPostsApiPath);
  }, [load, blogPostsApiPath]);

  if (!data) return null;

  const {articles} = data;
  const hasBgColor =
    background_color?.value &&
    background_color?.value !== 'transparent' &&
    background_color?.value !== '#ffffff' &&
    background_color?.value !== '#fff';

  return (
    <section className="section-SectionBlogCarousel container">
      <div className={hasBgColor ? 'relative py-12 lg:py-16' : ''}>
        {hasBgColor && (
          <BackgroundSection
            style={{backgroundColor: background_color?.value}}
          />
        )}
        <div>
          {(heading?.value || sub_heading?.value) && (
            <Heading desc={sub_heading?.value}>
              {heading?.value}
            </Heading>
          )}

          {articles.length ? (
            <div className="relative">
              <div className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 -mx-4 px-4">
                {articles.slice(0, 6).map((article) => (
                  <BlogCarouselCard key={article.id} article={article} />
                ))}
              </div>
            </div>
          ) : (
            <div className="pt-10 border-t border-slate-200 dark:border-slate-700">
              <Empty description="No se encontraron artículos del blog." />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function BlogCarouselCard({article}: {article: Article}) {
  const {title, handle, image, publishedAt, blog, excerpt} = article;
  const blogHandle = blog?.handle || 'news';
  const articleUrl = `/blogs/${blogHandle}/${handle}`;
  
  const formattedDate = new Date(publishedAt).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Link
      to={articleUrl}
      className="flex-none w-[280px] md:w-[320px] lg:w-[360px] snap-start group"
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-transparent hover:border-black dark:hover:border-white transition-colors duration-300">
        {image && (
          <div className="aspect-[16/10] overflow-hidden">
            <Image
              data={image}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 280px, (max-width: 1024px) 320px, 360px"
            />
          </div>
        )}
        <div className="p-4 md:p-5">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {formattedDate}
          </span>
          <h3 className="mt-2 text-base md:text-lg font-semibold text-slate-900 dark:text-white line-clamp-2 group-hover:text-primary-600 transition-colors">
            {title}
          </h3>
          {excerpt && (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
              {excerpt}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

export const SECTION_BLOG_CAROUSEL_FRAGMENT = `#graphql
  fragment SectionBlogCarousel on Metaobject {
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
    number_of_posts: field(key: "number_of_posts") {
      key
      value
    }
    blog_handle: field(key: "blog_handle") {
      key
      value
    }
  }
`;
