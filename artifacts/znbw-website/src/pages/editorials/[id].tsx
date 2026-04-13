import { PublicLayout } from "@/components/layout/PublicLayout";
import { useGetArticle, getGetArticleQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditorialDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0");

  const { data: article, isLoading, error } = useGetArticle(id, {
    query: {
      enabled: !!id,
      queryKey: getGetArticleQueryKey(id)
    }
  });

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 md:px-8 py-20 max-w-4xl">
          <Skeleton className="h-4 w-24 mb-8" />
          <Skeleton className="h-12 w-3/4 mb-6" />
          <Skeleton className="h-6 w-1/3 mb-12" />
          <Skeleton className="h-96 w-full mb-12" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (error || !article) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 md:px-8 py-32 text-center">
          <h1 className="text-3xl font-serif mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-8">The editorial you are looking for does not exist or has been removed.</p>
          <Link href="/editorials" className="text-secondary hover:underline">
            Return to Editorials
          </Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <article className="pb-24">
        {/* Header */}
        <header className="bg-primary text-primary-foreground py-20">
          <div className="container mx-auto px-4 md:px-8 max-w-4xl">
            <Link href="/editorials" className="inline-flex items-center text-sm font-medium text-primary-foreground/70 hover:text-secondary mb-8 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Editorials
            </Link>
            
            <div className="flex items-center gap-4 text-sm font-medium uppercase tracking-wider text-secondary mb-6">
              <span>{article.category}</span>
              <span className="w-1 h-1 rounded-full bg-secondary/50"></span>
              <span className="text-primary-foreground/60">
                {article.publishedAt ? format(new Date(article.publishedAt), 'MMMM d, yyyy') : 'Draft'}
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif leading-tight mb-8">
              {article.title}
            </h1>
            
            <div className="flex items-center gap-4 text-primary-foreground/80">
              <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-serif text-lg">
                {article.author.charAt(0)}
              </div>
              <div>
                <div className="font-medium">{article.author}</div>
                <div className="text-sm text-primary-foreground/60">Zenith Nova Bridge Wave</div>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 md:px-8 max-w-4xl mt-12">
          {article.coverImage && (
            <div className="mb-16 rounded-sm overflow-hidden bg-muted aspect-video border border-border">
              <img 
                src={article.coverImage} 
                alt={article.title} 
                className="w-full h-full object-cover" 
              />
            </div>
          )}

          <div className="prose prose-lg dark:prose-invert prose-headings:font-serif prose-a:text-secondary hover:prose-a:text-secondary/80 max-w-none">
            {article.content.split('\n').map((paragraph, i) => (
              paragraph ? <p key={i}>{paragraph}</p> : <br key={i} />
            ))}
          </div>
        </div>
      </article>
    </PublicLayout>
  );
}
