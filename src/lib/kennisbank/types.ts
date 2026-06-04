export type ArticleSummary = {
  id: string;
  title: string;
  cover_image_url: string | null;
  excerpt: string;
  created_at: string;
  updated_at: string;
  author_name: string | null;
};

export type Article = {
  id: string;
  title: string;
  content_html: string;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
  author_name: string | null;
};
