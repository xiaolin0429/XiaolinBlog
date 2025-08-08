-- 初始化网站配置项
-- 如果配置项不存在则插入，存在则跳过

-- 基础信息配置
INSERT INTO site_configs (key, value, category, description, data_type, is_public, sort_order)
SELECT 'site_title', '我的博客', 'basic', '网站标题', 'string', 'true', 1
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE key = 'site_title');

INSERT INTO site_configs (key, value, category, description, data_type, is_public, sort_order)
SELECT 'site_subtitle', '分享技术与生活', 'basic', '网站副标题', 'string', 'true', 2
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE key = 'site_subtitle');

INSERT INTO site_configs (key, value, category, description, data_type, is_public, sort_order)
SELECT 'site_description', '这是一个个人技术博客', 'basic', '网站描述', 'string', 'true', 3
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE key = 'site_description');

INSERT INTO site_configs (key, value, category, description, data_type, is_public, sort_order)
SELECT 'site_keywords', '博客,技术,编程', 'basic', '网站关键词', 'string', 'true', 4
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE key = 'site_keywords');

INSERT INTO site_configs (key, value, category, description, data_type, is_public, sort_order)
SELECT 'site_logo', '', 'basic', '网站Logo', 'url', 'true', 5
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE key = 'site_logo');

INSERT INTO site_configs (key, value, category, description, data_type, is_public, sort_order)
SELECT 'site_favicon', '', 'basic', '网站图标', 'url', 'true', 6
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE key = 'site_favicon');

INSERT INTO site_configs (key, value, category, description, data_type, is_public, sort_order)
SELECT 'site_language', 'zh-CN', 'basic', '网站语言', 'string', 'true', 7
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE key = 'site_language');

INSERT INTO site_configs (key, value, category, description, data_type, is_public, sort_order)
SELECT 'site_timezone', 'Asia/Shanghai', 'basic', '时区设置', 'string', 'true', 8
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE key = 'site_timezone');

-- 联系方式配置
INSERT INTO site_configs (key, value, category, description, data_type, is_public, sort_order)
SELECT 'contact_email', '', 'contact', '联系邮箱', 'email', 'true', 1
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE key = 'contact_email');

INSERT INTO site_configs (key, value, category, description, data_type, is_public, sort_order)
SELECT 'contact_phone', '', 'contact', '联系电话', 'string', 'true', 2
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE key = 'contact_phone');

INSERT INTO site_configs (key, value, category, description, data_type, is_public, sort_order)
SELECT 'contact_address', '', 'contact', '联系地址', 'string', 'true', 3
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE key = 'contact_address');

INSERT INTO site_configs (key, value, category, description, data_type, is_public, sort_order)
SELECT 'contact_wechat', '', 'contact', '微信号', 'string', 'true', 4
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE key = 'contact_wechat');

INSERT INTO site_configs (key, value, category, description, data_type, is_public, sort_order)
SELECT 'contact_qq', '', 'contact', 'QQ号', 'string', 'true', 5
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE key = 'contact_qq');

-- 社交媒体配置
INSERT INTO site_configs (key, value, category, description, data_type, is_public, sort_order)
SELECT 'social_github', '', 'social', 'GitHub链接', 'url', 'true', 1
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE key = 'social_github');

INSERT INTO site_configs (key, value, category, description, data_type, is_public, sort_order)
SELECT 'social_weibo', '', 'social', '微博链接', 'url', 'true', 2
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE key = 'social_weibo');

INSERT INTO site_configs (key, value, category, description, data_type, is_public, sort_order)
SELECT 'social_wechat', '', 'social', '微信链接', 'string', 'true', 3
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE key = 'social_wechat');

INSERT INTO site_configs (key, value, category, description, data_type, is_public, sort_order)
SELECT 'social_twitter', '', 'social', 'Twitter链接', 'url', 'true', 4
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE key = 'social_twitter');

INSERT INTO site_configs (key, value, category, description, data_type, is_public, sort_order)
SELECT 'social_linkedin', '', 'social', 'LinkedIn链接', 'url', 'true', 5
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE key = 'social_linkedin');

INSERT INTO site_configs (key, value, category, description, data_type, is_public, sort_order)
SELECT 'social_instagram', '', 'social', 'Instagram链接', 'url', 'true', 6
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE key = 'social_instagram');

INSERT INTO site_configs (key, value, category, description, data_type, is_public, sort_order)
SELECT 'social_youtube', '', 'social', 'YouTube链接', 'url', 'true', 7
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE key = 'social_youtube');

-- SEO设置
INSERT INTO site_configs (key, value, category, description, data_type, is_public, sort_order)
SELECT 'seo_google_analytics', '', 'seo', 'Google Analytics代码', 'string', 'false', 1
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE key = 'seo_google_analytics');

INSERT INTO site_configs (key, value, category, description, data_type, is_public, sort_order)
SELECT 'seo_baidu_analytics', '', 'seo', '百度统计代码', 'string', 'false', 2
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE key = 'seo_baidu_analytics');

INSERT INTO site_configs (key, value, category, description, data_type, is_public, sort_order)
SELECT 'seo_meta_author', '', 'seo', '网站作者', 'string', 'true', 3
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE key = 'seo_meta_author');

INSERT INTO site_configs (key, value, category, description, data_type, is_public, sort_order)
SELECT 'seo_meta_keywords', '', 'seo', 'SEO关键词', 'string', 'true', 4
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE key = 'seo_meta_keywords');

INSERT INTO site_configs (key, value, category, description, data_type, is_public, sort_order)
SELECT 'seo_meta_description', '', 'seo', 'SEO描述', 'string', 'true', 5
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE key = 'seo_meta_description');

-- 基础信息配置（补充缺失的配置项）
INSERT INTO site_configs (key, value, category, description, data_type, is_public, sort_order)
SELECT 'site_copyright', '© 2024 我的博客. All rights reserved.', 'basic', '版权声明', 'string', 'true', 9
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE key = 'site_copyright');

INSERT INTO site_configs (key, value, category, description, data_type, is_public, sort_order)
SELECT 'site_icp', '', 'basic', 'ICP备案号', 'string', 'true', 10
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE key = 'site_icp');

INSERT INTO site_configs (key, value, category, description, data_type, is_public, sort_order)
SELECT 'site_public_security', '', 'basic', '公安备案号', 'string', 'true', 11
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE key = 'site_public_security');

-- 其他配置
INSERT INTO site_configs (key, value, category, description, data_type, is_public, sort_order)
SELECT 'other_copyright', '© 2024 我的博客. All rights reserved.', 'other', '版权声明', 'string', 'true', 1
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE key = 'other_copyright');

INSERT INTO site_configs (key, value, category, description, data_type, is_public, sort_order)
SELECT 'other_icp', '', 'other', 'ICP备案号', 'string', 'true', 2
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE key = 'other_icp');

INSERT INTO site_configs (key, value, category, description, data_type, is_public, sort_order)
SELECT 'other_public_security', '', 'other', '公安备案号', 'string', 'true', 3
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE key = 'other_public_security');

INSERT INTO site_configs (key, value, category, description, data_type, is_public, sort_order)
SELECT 'other_notice', '', 'other', '网站公告', 'string', 'true', 4
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE key = 'other_notice');