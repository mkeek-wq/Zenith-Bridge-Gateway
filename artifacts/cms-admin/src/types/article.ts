export type Article = {
  id: string;
  title: string;
  html: string;
  status: "draft" | "published";
};
