export function mapArticleVersion(article: any) {
  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    content: article.content,
    category: article.category,
    author: article.author,
    featured: article.featured,
    coverImage: article.coverImage,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
  };
}
