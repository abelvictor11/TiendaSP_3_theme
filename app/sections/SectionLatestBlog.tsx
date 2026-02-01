import {type ParsedMetafields, Image} from '@shopify/hydrogen';
import {parseSection} from '~/utils/parseSection';
import {useFetcher} from '@remix-run/react';
import type {SectionLatestBlogFragment} from 'storefrontapi.generated';
import BackgroundSection from '~/components/BackgroundSection';
import Heading from '~/components/Heading/Heading';
import ButtonSecondary from '~/components/Button/ButtonSecondary';
import {useEffect, useMemo, useRef, useState} from 'react';
import BlogCard12 from '~/components/BlogCard12';
import BlogCard13 from '~/components/BlogCard13';
import {usePrefixPathWithLocale} from '~/lib/utils';
import {type Article} from '@shopify/hydrogen/storefront-api-types';
import {Empty} from '~/components/Empty';
import {Link} from '~/components/Link';
import {ArrowRightIcon} from '@heroicons/react/24/outline';
import useSnapSlider from '~/hooks/useSnapSlider';

export function SectionLatestBlog(props: SectionLatestBlogFragment) {
  const section = parseSection<
    SectionLatestBlogFragment,
    {
      heading_bold?: ParsedMetafields['single_line_text_field'];
    }
  >(props);

  const {
    heading_bold,
    heading_light,
    button_view_all,
    background_color,
    number_of_items,
    blog_slug,
  } = section;

  const propsAny = props as any;
  const layoutStyle = propsAny.layout_style?.value || 'default';

  const {load, data} = useFetcher<{articles: Article[]}>();

  const sliderRef = useRef<HTMLDivElement>(null);
  const {scrollToNextSlide, scrollToPrevSlide} = useSnapSlider({sliderRef});
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;
    
    const handleScroll = () => {
      const maxScroll = slider.scrollWidth - slider.clientWidth;
      const progress = maxScroll > 0 ? slider.scrollLeft / maxScroll : 0;
      setScrollProgress(progress);
    };
    
    slider.addEventListener('scroll', handleScroll);
    return () => slider.removeEventListener('scroll', handleScroll);
  }, []);

  const queryString = useMemo(
    () =>
      Object.entries({
        pageBy: Number(number_of_items?.value) || 6,
        blogHandle: blog_slug?.value || 'news',
      })
        .map(([key, val]) => (val ? `${key}=${val}` : null))
        .filter(Boolean)
        .join('&'),
    [blog_slug?.value, number_of_items?.value],
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

  // Carousel Style Layout
  if (layoutStyle === 'carousel') {
    return (
      <section 
        className="section-SectionLatestBlog"
        style={hasBgColor ? {backgroundColor: background_color?.value} : undefined}
      >
        <div className="container">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-headline text-xl md:text-2xl font-normal">
              {heading_bold?.value || 'Latest Blog'}
              {heading_light?.value && (
                <span className="font-light ml-2">{heading_light.value}</span>
              )}
            </h2>
            {button_view_all?.href?.value && (
              <Link
                to={button_view_all.href.value}
                className="flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-black transition-colors"
              >
                {button_view_all?.text?.value || 'Show all'}
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            )}
          </div>

          {articles.length ? (
            <div className="relative">
              {/* Articles Slider */}
              <div
                ref={sliderRef}
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory hiddenScrollbar pb-4"
              >
                {articles.map((article) => (
                  <Link
                    key={article.id}
                    to={`/news/${article.handle}`}
                    className="snap-start shrink-0 group w-[280px] sm:w-[320px] lg:w-[380px] bg-transparent border border-[#e5e7eb] hover:border-[#1a1a1a] rounded-2xl"
                  >
                    {/* Image */}
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-4 bg-neutral-100">
                      {article.image ? (
                        <Image
                          data={article.image}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 280px, (max-width: 1024px) 320px, 380px"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-slate-200 flex items-center justify-center">
                          <span className="text-slate-400">No image</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="space-y-2 p-8">
                      <h3 className="font-headline text-xl md:text-2xl font-normal line-clamp-2">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="text-sm text-neutral-600 line-clamp-1">
                          {article.excerpt}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              {/* Progress Bar & Navigation */}
              <div className="mt-6 flex items-center gap-4">
                <div className="flex-1 h-0.5 bg-neutral-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-neutral-900 transition-all duration-300"
                    style={{width: `${Math.max(scrollProgress * 100, 10)}%`}}
                  />
                </div>
                <button
                  onClick={scrollToPrevSlide}
                  className="p-2 rounded-full border border-neutral-300 hover:border-neutral-900 transition-colors"
                  aria-label="Previous"
                >
                  <ArrowRightIcon className="w-4 h-4 rotate-180" />
                </button>
                <button
                  onClick={scrollToNextSlide}
                  className="p-2 rounded-full border border-neutral-300 hover:border-neutral-900 transition-colors"
                  aria-label="Next"
                >
                  <ArrowRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-10 border-t border-neutral-200">
              <Empty description="No blog posts found in the latest blog section." />
            </div>
          )}
        </div>
      </section>
    );
  }

  // Default Layout
  return (
    <section className="section-SectionLatestBlog container">
      <div className={hasBgColor ? 'relative py-12 lg:py-16' : ''}>
        {hasBgColor && (
          <BackgroundSection
            style={{backgroundColor: background_color?.value}}
          />
        )}
        <div>
          <Heading rightDescText={heading_light?.value}>
            {heading_bold && heading_bold.value}
          </Heading>

          {articles.length ? (
            <div className="grid lg:grid-cols-2 gap-6 md:gap-8">
              <BlogCard12 post={articles[0]} />
              {articles[1] && (
                <div className="grid gap-6 md:gap-8 lg:grid-rows-3">
                  {[articles[1], articles[2], articles[3]]
                    .filter(Boolean)
                    .map((p) => (
                      <BlogCard13 key={p.id} post={p} />
                    ))}
                </div>
              )}
            </div>
          ) : (
            <div className="pt-10 border-t border-white">
              <Empty description="No blog posts found in the latest blog section." />
            </div>
          )}

          {!!button_view_all?.href && !!articles.length && (
            <div className="flex mt-16 justify-center">
              <ButtonSecondary
                href={button_view_all?.href?.value}
                targetBlank={button_view_all.target?.value === 'true'}
              >
                {button_view_all?.text?.value || 'Ver todo'}
              </ButtonSecondary>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export const SECTION_LATEST_BLOG_FRAGMENT = `#graphql
  fragment SectionLatestBlog on Metaobject {
    type
    heading: field(key: "heading") {
      key
      value
    }
    heading_bold: field(key: "heading_bold") {
      key
      value
    }
    heading_light: field(key: "heading_light") {
      key
      value
    }
    background_color: field(key: "background_color") {
      key
      value
    }
    layout_style: field(key: "layout_style") {
      key
      value
    }
    button_view_all: field(key: "button_view_all") {
      ...Link
    }

    number_of_items: field(key: "number_of_items") {
      key
      value
    }
    blog_slug: field(key: "blog_slug") {
      key
      value
    }
  }
`;
