import { AdminLayout } from "@/components/layout/AdminLayout";
import { useGetArticle, useUpdateArticle, getGetArticleQueryKey, getAdminListArticlesQueryKey } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useParams, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save } from "lucide-react";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const articleSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  excerpt: z.string().min(10, "Excerpt is required"),
  content: z.string().min(20, "Content is required"),
  category: z.string().min(1, "Category is required"),
  author: z.string().min(2, "Author is required"),
  published: z.boolean().default(false),
  featured: z.boolean().default(false),
  coverImage: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type ArticleFormValues = z.infer<typeof articleSchema>;

export default function AdminArticleEdit() {
  const params = useParams();
  const id = parseInt(params.id || "0");
  
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const { data: article, isLoading } = useGetArticle(id, {
    query: {
      enabled: !!id,
      queryKey: getGetArticleQueryKey(id)
    }
  });
  
  const updateArticle = useUpdateArticle();
  
  const form = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: "",
      excerpt: "",
      content: "",
      category: "Market Insights",
      author: "ZNBW Partners",
      published: false,
      featured: false,
      coverImage: "",
    },
  });

  useEffect(() => {
    if (article) {
      form.reset({
        title: article.title,
        excerpt: article.excerpt,
        content: article.content,
        category: article.category,
        author: article.author,
        published: article.published,
        featured: article.featured,
        coverImage: article.coverImage || "",
      });
    }
  }, [article, form]);

  function onSubmit(data: ArticleFormValues) {
    const payload = {
      ...data,
      coverImage: data.coverImage === "" ? null : data.coverImage
    };

    updateArticle.mutate({ id, data: payload }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListArticlesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetArticleQueryKey(id) });
        toast({
          title: "Article updated",
          description: "Changes have been saved successfully.",
        });
        setLocation("/admin");
      },
      onError: (err) => {
        toast({
          title: "Error",
          description: err.message || "Failed to update article",
          variant: "destructive",
        });
      }
    });
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="mb-6">
          <Skeleton className="h-4 w-24 mb-4" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="bg-card border border-border p-6 rounded-md">
          <Skeleton className="h-[600px] w-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <Link href="/admin" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Articles
        </Link>
        <h1 className="text-2xl font-serif">Edit Article</h1>
      </div>

      <div className="bg-card border border-border p-6 md:p-8 rounded-md shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input className="text-lg font-medium" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="excerpt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Excerpt</FormLabel>
                      <FormControl>
                        <Textarea 
                          className="resize-none h-20" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>Shown on article cards and summaries.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea 
                          className="min-h-[400px] font-mono text-sm" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-6">
                <div className="bg-muted/30 p-4 rounded-md border border-border space-y-6">
                  <h3 className="font-medium text-sm uppercase tracking-wider text-muted-foreground mb-4">Publishing</h3>
                  
                  <FormField
                    control={form.control}
                    name="published"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border bg-card p-4 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Publish</FormLabel>
                          <FormDescription>Make publicly visible</FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="featured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border bg-card p-4 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Featured</FormLabel>
                          <FormDescription>Show on homepage</FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="bg-muted/30 p-4 rounded-md border border-border space-y-6">
                  <h3 className="font-medium text-sm uppercase tracking-wider text-muted-foreground mb-4">Metadata</h3>
                  
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Market Insights">Market Insights</SelectItem>
                            <SelectItem value="Regulatory News">Regulatory News</SelectItem>
                            <SelectItem value="Firm Updates">Firm Updates</SelectItem>
                            <SelectItem value="Case Studies">Case Studies</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="author"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Author</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="coverImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cover Image URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/image.jpg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-border">
              <Link href="/admin">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button type="submit" disabled={updateArticle.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Save className="w-4 h-4 mr-2" />
                {updateArticle.isPending ? "Saving..." : "Update Article"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}
