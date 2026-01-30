import {Image, type ParsedMetafields} from '@shopify/hydrogen';
import {parseSection} from '~/utils/parseSection';
import type {SectionStepsFragment} from 'storefrontapi.generated';
import VectorImg from '@/assets/images/VectorHIW.svg?url';
import {Badge, badgeColors} from '~/components/badge';

export function SectionSteps(props: SectionStepsFragment) {
  const section = parseSection<
    SectionStepsFragment,
    {
      title: ParsedMetafields['single_line_text_field'];
      headings: ParsedMetafields['list.single_line_text_field'];
      labels: ParsedMetafields['list.single_line_text_field'];
      icons: ParsedMetafields['list.file_reference'];
      contents: ParsedMetafields['list.single_line_text_field'];
    }
  >(props);

  const {title, headings, labels, contents, icons, style} = section;
  const background_color = (props as any).background_color?.value;
  const heading_color = (props as any).heading_color?.value;
  const text_color = (props as any).text_color?.value;

  return (
    <section 
      className="section-steps container py-8 lg:py-12" 
      title={title?.value}
      style={background_color ? {backgroundColor: background_color} : undefined}
    >
      <div
        className={
          style?.value === '1'
            ? 'py-12 lg:py-16 border-t border-b border-slate-200'
            : ''
        }
      >
        <div className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-16 xl:gap-20">
          <img
            className="hidden md:block absolute inset-x-0 top-5"
            src={VectorImg}
            alt="vector"
            sizes="max-width: 640px 100vw, max-width: 1024px 80vw, 50vw"
          />
          {headings?.parsedValue?.map((item, index) => (
            <div
              key={`${index + item}`}
              className="relative flex flex-col items-center max-w-xs mx-auto"
            >
              <div className="mb-4 sm:mb-10 max-w-[140px] mx-auto">
                {!!icons?.nodes?.[index]?.image && (
                  <Image
                    className="rounded-3xl"
                    data={icons?.nodes[index].image || {}}
                    sizes="150px"
                  />
                )}
              </div>
              <div className="text-center mt-auto space-y-5">
                <Badge color={badgeColors[index]}>
                  {labels?.parsedValue?.[index]}
                </Badge>
                <h5 
                  className="text-base font-semibold"
                  style={heading_color ? {color: heading_color} : undefined}
                >
                  {item}
                </h5>
                <span 
                  className="block text-slate-600 dark:text-black text-sm leading-6"
                  style={text_color ? {color: text_color} : undefined}
                >
                  {contents?.parsedValue?.[index]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export const SECTION_STEPS_FRAGMENT = `#graphql
  fragment SectionSteps on Metaobject {
    type
    title: field(key: "title") {
      type
      key
      value
    }
    headings: field(key: "headings") {
      type
      key
      value
    }
    labels: field(key: "labels") {
      type
      key
      value
    }
    contents: field(key: "contents") {
      type
      key
      value
    }
    icons: field(key: "icons") {
      key
      type
      value
      references(first: 10) {
        nodes {
              ...MediaImage
            }
        }
    }
    style: field(key: "style") {
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
    text_color: field(key: "text_color") {
      key
      value
    }
  }
`;
