export interface OfficeHandbook {
  id: string;
  title: string;
  slug: string;
  content: string;
  categoryId: string;
  categoryName: string;
  attachmentPath?: string | null;
  attachmentName?: string | null;
  isPublished: boolean;
  publishedAt?: string | null;
  isArchived: boolean;
  createdBy: string;
  createdAt: string;
  updatedBy?: string | null;
  updatedAt?: string | null;
}

export interface CreateOfficeHandbook {
  title: string;
  slug: string;
  content: string;
  categoryId: string;
  isPublished: boolean;
}

export interface UpdateOfficeHandbook {
  title: string;
  slug: string;
  content: string;
  categoryId: string;
  isPublished: boolean;
}

export interface OfficeHandbookCategory {
  id: string;
  name: string;
  description?: string | null;
  displayOrder: number;
  isActive: boolean;
  articleCount: number;
}

export interface CreateOfficeHandbookCategory {
  name: string;
  description?: string | null;
  displayOrder: number;
}

export interface UpdateOfficeHandbookCategory {
  name: string;
  description?: string | null;
  displayOrder: number;
  isActive: boolean;
}
