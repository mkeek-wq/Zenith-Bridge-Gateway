import type { InferSelectModel } from "@workspace/db";
import { articles } from "@workspace/db";

type Article = InferSelectModel<typeof articles>;

export function toArticleDTO(article: Article) {
  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    content: article.content,

    category: article.category,
    country: article.country,

    primaryCountry: article.primaryCountry,
    secondaryCountries: article.secondaryCountries,
    primaryCategory: article.primaryCategory,
    secondaryCategories: article.secondaryCategories,

    sectorTags: article.sectorTags,
    businessTopics: article.businessTopics,
    workforceAttributes: article.workforceAttributes,
    infrastructureAttributes: article.infrastructureAttributes,
    incentiveTypes: article.incentiveTypes,
    institutions: article.institutions,
    strategicRisks: article.strategicRisks,

    author: article.author,
    featured: article.featured,
    published: article.published,
    coverImage: article.coverImage ?? null,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    publishedAt: article.publishedAt,
  };
}
