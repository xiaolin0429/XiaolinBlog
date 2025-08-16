import { useState, useEffect, useCallback, useRef } from 'react';
import { postsAPI, type Post } from '@/lib/api/posts';
import { categoriesAPI, type Category } from '@/lib/api/categories';
import { tagsAPI, type Tag } from '@/lib/api/tags';
import { toast } from 'sonner';
import { 
  validatePostContent, 
  validatePostConfig, 
  validatePost,
  type PostValidationError 
} from '@/lib/validations/post';

// 表单数据类型
export interface PostFormData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category_id: number | null;
  tag_ids: number[];
  featured_image: string;
  status: 'draft' | 'published' | 'archived';
  is_featured: boolean;
}

// Hook配置选项
interface UsePostEditorOptions {
  postId?: number;
  autoSave?: boolean;
  autoSaveInterval?: number;
}

// Hook返回类型
interface UsePostEditorReturn {
  // 状态
  loading: boolean;
  saving: boolean;
  error: string | null;
  lastSaved: Date | null;
  validationErrors: PostValidationError[];
  
  // 数据
  formData: PostFormData;
  categories: Category[];
  tags: Tag[];
  selectedTags: Tag[];
  
  // 操作方法
  updateField: (field: keyof PostFormData, value: any) => void;
  saveContent: () => Promise<boolean>;
  saveConfig: () => Promise<boolean>;
  saveAll: () => Promise<boolean>;
  fetchPost: () => Promise<void>;
  addTag: (tagId: number) => void;
  removeTag: (tagId: number) => void;
  createTag: (name: string) => Promise<Tag | null>;
  
  // 验证方法
  validateContent: () => boolean;
  validateConfiguration: () => boolean;
  clearValidationErrors: () => void;
}

export function usePostEditor(options: UsePostEditorOptions = {}): UsePostEditorReturn {
  const { postId, autoSave = false, autoSaveInterval = 30000 } = options;
  
  // 基础状态
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [validationErrors, setValidationErrors] = useState<PostValidationError[]>([]);
  
  // 表单数据
  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    category_id: null,
    tag_ids: [],
    featured_image: '',
    status: 'draft',
    is_featured: false,
  });
  
  // 分类和标签数据
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  
  // 自动保存定时器
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const lastContentRef = useRef<string>('');

  // 获取文章数据
  const fetchPost = useCallback(async () => {
    if (!postId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const post = await postsAPI.getPost(postId);
      
      setFormData({
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt || '',
        category_id: post.category_id || null,
        tag_ids: post.tags?.map(tag => tag.id) || [],
        featured_image: post.featured_image || '',
        status: post.status,
        is_featured: post.is_featured || false,
      });
      
      lastContentRef.current = post.content;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取文章失败';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  // 获取分类和标签数据
  const fetchCategoriesAndTags = useCallback(async () => {
    try {
      const [categoriesData, tagsData] = await Promise.all([
        categoriesAPI.getCategories(),
        tagsAPI.getTags()
      ]);
      
      setCategories(categoriesData);
      setTags(tagsData);
      
    } catch (err) {
      console.error('获取分类和标签失败:', err);
    }
  }, []);

  // 更新选中的标签
  const updateSelectedTags = useCallback(() => {
    const selected = tags.filter(tag => formData.tag_ids.includes(tag.id));
    setSelectedTags(selected);
  }, [tags, formData.tag_ids]);

  // 更新表单字段
  const updateField = useCallback((field: keyof PostFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 清除相关字段的验证错误
    setValidationErrors(prev => prev.filter(error => error.field !== field));
    
    // 自动生成slug
    if (field === 'title' && typeof value === 'string') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({ ...prev, slug }));
    }
  }, []);

  // 验证内容
  const validateContent = useCallback(() => {
    const contentData = {
      title: formData.title,
      slug: formData.slug,
      content: formData.content
    };
    
    const result = validatePostContent(contentData);
    
    if (!result.success) {
      setValidationErrors(result.errors);
      return false;
    }
    
    // 清除内容相关的验证错误
    setValidationErrors(prev => 
      prev.filter(error => !['title', 'slug', 'content'].includes(error.field))
    );
    
    return true;
  }, [formData.title, formData.slug, formData.content]);

  // 验证配置
  const validateConfiguration = useCallback(() => {
    const configData = {
      excerpt: formData.excerpt,
      category_id: formData.category_id,
      tag_ids: formData.tag_ids,
      featured_image: formData.featured_image,
      status: formData.status,
      is_featured: formData.is_featured
    };
    
    const result = validatePostConfig(configData);
    
    if (!result.success) {
      setValidationErrors(prev => [
        ...prev.filter(error => ['title', 'slug', 'content'].includes(error.field)),
        ...result.errors
      ]);
      return false;
    }
    
    // 清除配置相关的验证错误
    setValidationErrors(prev => 
      prev.filter(error => ['title', 'slug', 'content'].includes(error.field))
    );
    
    return true;
  }, [formData]);

  // 清除验证错误
  const clearValidationErrors = useCallback(() => {
    setValidationErrors([]);
  }, []);

  // 保存内容
  const saveContent = useCallback(async (): Promise<boolean> => {
    if (!validateContent()) {
      toast.error('请检查表单内容');
      return false;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      const contentData = {
        title: formData.title,
        slug: formData.slug,
        content: formData.content
      };
      
      if (postId) {
        await postsAPI.updatePost(postId, contentData);
        toast.success('内容保存成功');
      } else {
        const newPost = await postsAPI.createPost({
          ...contentData,
          excerpt: '',
          status: 'draft',
          is_featured: false
        });
        // 这里可能需要更新postId或重定向
        toast.success('文章创建成功');
      }
      
      setLastSaved(new Date());
      lastContentRef.current = formData.content;
      return true;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '保存失败';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setSaving(false);
    }
  }, [postId, formData.title, formData.slug, formData.content, validateContent]);

  // 保存配置
  const saveConfig = useCallback(async (): Promise<boolean> => {
    if (!validateConfiguration()) {
      toast.error('请检查配置信息');
      return false;
    }
    
    if (!postId) {
      toast.error('请先保存文章内容');
      return false;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      const configData = {
        excerpt: formData.excerpt,
        category_id: formData.category_id || undefined,
        tag_ids: formData.tag_ids,
        featured_image: formData.featured_image,
        status: formData.status,
        is_featured: formData.is_featured
      };
      
      await postsAPI.updatePost(postId, configData);
      toast.success('配置保存成功');
      setLastSaved(new Date());
      return true;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '保存配置失败';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setSaving(false);
    }
  }, [postId, formData, validateConfiguration]);

  // 保存全部
  const saveAll = useCallback(async (): Promise<boolean> => {
    const result = validatePost(formData);
    
    if (!result.success) {
      setValidationErrors(result.errors);
      toast.error('请检查表单内容');
      return false;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      if (postId) {
        const updateData = {
          ...formData,
          category_id: formData.category_id || undefined
        };
        await postsAPI.updatePost(postId, updateData);
        toast.success('保存成功');
      } else {
        const createData = {
          ...formData,
          category_id: formData.category_id || undefined
        };
        const newPost = await postsAPI.createPost(createData);
        toast.success('文章创建成功');
      }
      
      setLastSaved(new Date());
      lastContentRef.current = formData.content;
      return true;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '保存失败';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setSaving(false);
    }
  }, [postId, formData]);

  // 添加标签
  const addTag = useCallback((tagId: number) => {
    if (!formData.tag_ids.includes(tagId)) {
      updateField('tag_ids', [...formData.tag_ids, tagId]);
    }
  }, [formData.tag_ids, updateField]);

  // 移除标签
  const removeTag = useCallback((tagId: number) => {
    updateField('tag_ids', formData.tag_ids.filter(id => id !== tagId));
  }, [formData.tag_ids, updateField]);

  // 创建标签
  const createTag = useCallback(async (name: string): Promise<Tag | null> => {
    try {
      const newTag = await tagsAPI.createTag({ name, slug: name.toLowerCase() });
      setTags(prev => [...prev, newTag]);
      toast.success('标签创建成功');
      return newTag;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建标签失败';
      toast.error(errorMessage);
      return null;
    }
  }, []);

  // 自动保存逻辑
  useEffect(() => {
    if (!autoSave || !postId) return;
    
    const hasContentChanged = formData.content !== lastContentRef.current;
    
    if (hasContentChanged) {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
      
      autoSaveTimer.current = setTimeout(() => {
        if (formData.content.trim() && formData.title.trim()) {
          saveContent();
        }
      }, autoSaveInterval);
    }
    
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [formData.content, formData.title, autoSave, autoSaveInterval, postId, saveContent]);

  // 初始化数据
  useEffect(() => {
    fetchCategoriesAndTags();
    if (postId) {
      fetchPost();
    }
  }, [postId, fetchPost, fetchCategoriesAndTags]);

  // 更新选中标签
  useEffect(() => {
    updateSelectedTags();
  }, [updateSelectedTags]);

  return {
    // 状态
    loading,
    saving,
    error,
    lastSaved,
    validationErrors,
    
    // 数据
    formData,
    categories,
    tags,
    selectedTags,
    
    // 操作方法
    updateField,
    saveContent,
    saveConfig,
    saveAll,
    fetchPost,
    addTag,
    removeTag,
    createTag,
    
    // 验证方法
    validateContent,
    validateConfiguration,
    clearValidationErrors,
  };
}