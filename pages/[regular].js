import MobileSidebar from "@components/MobileSidebar";
import Sidebar from "@components/Sidebar";
import config from "@config/config.json";
import { setOthersCategory } from "@hooks/setOthersCategory";
import SortReducer from "@hooks/sortReducer";
import Base from "@layouts/Baseof";
import Examples from "@layouts/components/Examples";
import SidebarSort from "@layouts/components/SidebarSort";
import Default from "@layouts/Default";
import ResourceTaxonomy from "@layouts/ResourceTaxonomy";
import ThemeTaxonomy from "@layouts/ThemeTaxonomy";
import {
  getRegularPage,
  getRegularPageSlug,
  getSinglePage,
  getSinglePageSlug,
} from "@lib/contentParser";
import { markdownify, slugify } from "@lib/utils/textConverter";
import { useEffect, useState } from "react";

// for all regular pages
const RegularPages = ({
  slug,
  ssgSlug,
  cssSlug,
  toolSlug,
  currentPage,
  data,
  tools,
  category,
}) => {
  const { title, meta_title, description, image, noindex, canonical } =
    currentPage[0]?.frontmatter;

  const { sidebar } = config;
  const { content } = currentPage[0];
  const [arrayCategory, setArrayCategory] = useState([]);
  const [showIntro, SetShowIntro] = useState(true);

  const themesWithOthersCategory = setOthersCategory(data);
  const {
    sortedThemes,
    handleSortThemes,
    sortMenuShow,
    sortValue,
    defaultSortedThemes,
    handleSortMenu,
  } = SortReducer(themesWithOthersCategory, true, slug);

  useEffect(() => {
    setArrayCategory([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const filterCategory = sortedThemes.filter((theme) =>
    arrayCategory.length
      ? arrayCategory.find((type) =>
          theme.frontmatter.category
            ?.map((category) => slugify(category))
            .includes(slugify(type))
        )
      : defaultSortedThemes
  );

  // change others position
  const indexOfOthers = category.map((data) => data.slug).indexOf("others");
  const element = category.splice(indexOfOthers, 1)[0];
  category.splice(category.length, 0, element);

  return (
    <Base
      title={title}
      description={description ? description : content.slice(0, 120)}
      meta_title={meta_title}
      image={image}
      noindex={noindex}
      canonical={canonical}
    >
      {ssgSlug.includes(slug) || cssSlug.includes(slug) ? (
        <div className="flex">
          <Sidebar
            sidebar={sidebar}
            themes={themesWithOthersCategory}
            slug={slug}
            category={category}
            setArrayCategory={setArrayCategory}
            arrayCategory={arrayCategory}
            SetShowIntro={SetShowIntro}
            showIntro={showIntro}
          >
            <SidebarSort
              sortMenuShow={sortMenuShow}
              sortValue={sortValue}
              handleSortThemes={handleSortThemes}
              handleSortMenu={handleSortMenu}
            />
          </Sidebar>
          <ThemeTaxonomy
            currentPage={currentPage}
            data={filterCategory}
            tools={tools}
            showIntro={showIntro}
          />
        </div>
      ) : toolSlug.includes(slug) ? (
        <>
          <MobileSidebar />
          <ResourceTaxonomy data={data} currentPage={currentPage} />
        </>
      ) : slug.includes("-examples") ? (
        <main className="main">
          <div className="container">
            <div className={`mb-10 md:mb-16`}>
              <h1 className="mb-3">{title}</h1>
              {markdownify(description, "p")}
            </div>
            <Examples examples={currentPage} tools={tools} />
          </div>
        </main>
      ) : (
        <Default data={data} />
      )}
    </Base>
  );
};
export default RegularPages;

// for regular page routes
export const getStaticPaths = async () => {
  const slugs = getRegularPageSlug();

  const paths = slugs.map((slug) => ({
    params: {
      regular: slug,
    },
  }));

  return {
    paths,
    fallback: false,
  };
};

// for regular page data
export const getStaticProps = async ({ params }) => {
  const { regular } = params;

  // get taxonomies
  const ssg = getSinglePage("content/ssg");
  const cms = getSinglePage("content/cms");
  const css = getSinglePage("content/css");
  const category = getSinglePage("content/category");
  const tool = getSinglePage("content/tool");

  // get taxonomies slug
  const ssgSlug = getSinglePageSlug("content/ssg");
  const cssSlug = getSinglePageSlug("content/css");
  const toolSlug = getSinglePageSlug("content/tool");

  // read examples data
  const examples = getSinglePage("content/examples");
  const ssgExamplesPage =
    regular.includes("-examples") &&
    examples.filter((example) =>
      example.frontmatter.ssg
        .map((d) => slugify(d))
        .includes(regular.replace("-examples", ""))
    );

  // ssg page
  const ssgThemesPage =
    ssg.length &&
    ssg.filter((page) =>
      page.frontmatter?.url
        ? page.frontmatter.url === `/${regular}`
        : page.slug === regular
    );

  // css page
  const cssThemesPage =
    css.length &&
    css.filter((page) =>
      page.frontmatter?.url
        ? page.frontmatter.url === `/${regular}`
        : page.slug === regular
    );

  // tool page
  const toolThemesPage =
    tool.length &&
    tool.filter((page) =>
      page.frontmatter?.url
        ? page.frontmatter.url === `/${regular}`
        : page.slug === regular
    );

  // current page data
  const getCurrentPage = ssgThemesPage.length
    ? slugify(ssgThemesPage[0]?.frontmatter.title)
    : ssgExamplesPage.length
    ? slugify(ssgExamplesPage[0]?.frontmatter.title)
    : cssThemesPage.length
    ? slugify(cssThemesPage[0]?.frontmatter.title)
    : toolThemesPage.length
    ? slugify(toolThemesPage[0]?.frontmatter.title)
    : regular;
  const currentPageData = await getRegularPage(getCurrentPage);

  // layout filtering
  const defaultPage = currentPageData.filter(
    (data) => !data.frontmatter.layout
  );

  // current page
  const currentPage = ssgExamplesPage.length
    ? ssgExamplesPage
    : ssgThemesPage.length
    ? ssgThemesPage
    : cssThemesPage.length
    ? cssThemesPage
    : toolThemesPage.length
    ? toolThemesPage
    : defaultPage;

  // all tools
  const tools = [...ssg, ...cms, ...css, ...category];

  return {
    props: {
      slug: regular,
      ssgSlug: ssgSlug,
      cssSlug: cssSlug,
      toolSlug: toolSlug,
      currentPage: currentPage,
      data: currentPageData,
      tools: tools,
      category: category,
    },
  };
};
