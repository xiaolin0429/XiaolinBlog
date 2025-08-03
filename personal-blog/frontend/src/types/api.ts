/**
 * API 数据类型定义
 */

// 基础响应类型
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// 分页响应类型
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// 用户相关类型
export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  avatar?: string;
  bio?: string;
  is_active: boolean;
  is_superuser: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface UserLogin {
  username: string;
  password: string;
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
  full_name?: string;
}

export interface UserRegister {
  username: string;
  email: string;
  password: string;
  full_name?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface RegisterResponse {
  message: string;
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

// 分类相关类型
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  post_count: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryCreate {
  name: string;
  slug: string;
  description?: string;
}

export interface CategoryUpdate {
  name?: string;
  slug?: string;
  description?: string;
}

// 标签相关类型
export interface Tag {
  id: number;
  name: string;
  slug: string;
  description?: string;
  post_count: number;
  created_at: string;
  updated_at: string;
}

export interface TagCreate {
  name: string;
  slug: string;
  description?: string;
}

export interface TagUpdate {
  name?: string;
  slug?: string;
  description?: string;
}

// 文章相关类型
export interface PostBase {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  status: 'draft' | 'published' | 'archived';
  is_featured: boolean;
}

export interface PostCreate extends PostBase {
  category_id?: number;
  tag_ids?: number[];
  cover_image?: string;
}

export interface PostUpdate {
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  featured_image?: string;
  cover_image?: string;
  status?: 'draft' | 'published' | 'archived';
  is_featured?: boolean;
  category_id?: number;
  tag_ids?: number[];
}

export interface Post extends PostBase {
  id: number;
  author_id: number;
  category_id?: number;
  view_count: number;
  like_count: number;
  comment_count: number;
  published_at?: string;
  cover_image?: string;
  created_at: string;
  updated_at: string;
  author?: User;
  category?: Category;
  tags?: Tag[];
}

export interface PostList {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  status: string;
  is_featured: boolean;
  view_count: number;
  like_count: number;
  comment_count: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
  author?: User;
  category?: Category;
  tags?: Tag[];
}

// 评论相关类型
export interface Comment {
  id: number;
  content: string;
  author_name?: string;
  author_email?: string;
  author_website?: string;
  post_id: number;
  author_id?: number;
  parent_id?: number;
  ip_address?: string;
  user_agent?: string;
  is_approved: boolean;
  is_spam: boolean;
  like_count: number;
  author?: User;
  created_at: string;
  updated_at: string;
  replies?: Comment[];
}

export interface CommentCreate {
  content: string;
  author_name: string;
  author_email: string;
  author_website?: string;
  post_id: number;
  parent_id?: number;
}

export interface CommentUpdate {
  content?: string;
  is_approved?: boolean;
}

// 搜索和筛选参数
export interface PostFilters {
  skip?: number;
  limit?: number;
  status?: string;
  category_id?: number;
  tag_id?: number;
  search?: string;
}