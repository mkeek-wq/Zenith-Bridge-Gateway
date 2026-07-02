const API_BASE = "http://37.97.224.215:8080/api/v1";

function getAuthHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/**
 * CREATE ARTICLE
 */
export async function createArticle(token: string, data: {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  published?: boolean;
  featured?: boolean;
  coverImage?: string | null;
}) {
  const res = await fetch(`${API_BASE}/admin/articles`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(`Create failed: ${await res.text()}`);
  }

  return res.json();
}

/**
 * UPDATE ARTICLE
 */
export async function updateArticle(
  token: string,
  id: number,
  data: Partial<{
    title: string;
    excerpt: string;
    content: string;
    category: string;
    author: string;
    published: boolean;
    featured: boolean;
    coverImage: string | null;
  }>
) {
  const res = await fetch(`${API_BASE}/admin/articles/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(`Update failed: ${await res.text()}`);
  }

  return res.json();
}

/**
 * GET ALL ADMIN ARTICLES
 */
export async function getAdminArticles(token: string) {
  const res = await fetch(`${API_BASE}/admin/articles`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Fetch failed: ${await res.text()}`);
  }

  return res.json();
}

/**
 * DELETE ARTICLE
 */
export async function deleteArticle(token: string, id: number) {
  const res = await fetch(`${API_BASE}/admin/articles/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Delete failed: ${await res.text()}`);
  }

  return res.json();
}
