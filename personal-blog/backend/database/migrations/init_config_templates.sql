-- 基础信息配置模板
INSERT INTO config_templates (config_type, config_key, display_name, description, field_type, validation_rules, default_value, icon_name, color_scheme, display_order, is_required) VALUES
('basic_info', 'site_title', '网站标题', '网站的主标题，显示在浏览器标签页和搜索结果中', 'text', '{"maxLength": 100, "required": true}', '我的个人博客', 'Type', 'from-blue-500 to-purple-600', 1, true),
('basic_info', 'site_subtitle', '网站副标题', '网站的副标题或标语', 'text', '{"maxLength": 200}', '分享技术与生活', 'FileText', 'from-green-500 to-blue-500', 2, false),
('basic_info', 'site_description', '网站描述', '网站的详细描述，用于SEO和搜索结果', 'textarea', '{"maxLength": 500}', '这是一个个人技术博客...', 'FileText', 'from-purple-500 to-pink-500', 3, false),
('basic_info', 'site_logo', '网站Logo', '网站的Logo图片URL，建议使用PNG格式', 'url', '{"pattern": "^https?://.*\\.(png|jpg|jpeg|gif|svg)$"}', '', 'Image', 'from-pink-500 to-red-500', 4, false),
('basic_info', 'site_favicon', '网站图标', '网站的Favicon图标URL，显示在浏览器标签页', 'url', '{"pattern": "^https?://.*\\.(ico|png)$"}', '', 'Star', 'from-yellow-500 to-orange-500', 5, false),
('basic_info', 'site_language', '网站语言', '网站的主要语言设置', 'select', '{"options": [{"value": "zh-CN", "label": "简体中文"}, {"value": "en-US", "label": "English"}, {"value": "ja-JP", "label": "日本語"}]}', 'zh-CN', 'Languages', 'from-cyan-500 to-blue-500', 6, false),
('basic_info', 'site_timezone', '时区设置', '网站的时区设置，影响时间显示', 'select', '{"options": [{"value": "Asia/Shanghai", "label": "北京时间"}, {"value": "UTC", "label": "UTC"}, {"value": "America/New_York", "label": "纽约时间"}]}', 'Asia/Shanghai', 'Clock', 'from-indigo-500 to-purple-500', 7, false),
('basic_info', 'copyright_info', '版权信息', '网站的版权声明信息', 'text', '{"maxLength": 200}', '© 2024 我的博客. All rights reserved.', 'Copyright', 'from-red-500 to-pink-500', 8, false),
('basic_info', 'icp_number', 'ICP备案号', '网站的ICP备案号（中国网站必需）', 'text', '{"pattern": "^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领]ICP备\\d+号(-\\d+)?$"}', '', 'Shield', 'from-teal-500 to-green-500', 9, false),
('basic_info', 'police_number', '公安备案号', '网站的公安备案号', 'text', '{"pattern": "^\\d+号$"}', '', 'ShieldCheck', 'from-orange-500 to-red-500', 10, false);

-- 社交媒体配置模板
INSERT INTO config_templates (config_type, config_key, display_name, description, field_type, validation_rules, default_value, icon_name, color_scheme, display_order, is_required) VALUES
('social_media', 'facebook', 'Facebook', 'Facebook个人主页或页面链接', 'url', '{"pattern": "^https?://(www\\.)?facebook\\.com/.+"}', '', 'Facebook', 'from-blue-600 to-blue-700', 1, false),
('social_media', 'twitter', 'Twitter/X', 'Twitter(X)个人主页链接', 'url', '{"pattern": "^https?://(www\\.)?(twitter\\.com|x\\.com)/.+"}', '', 'Twitter', 'from-sky-400 to-blue-500', 2, false),
('social_media', 'instagram', 'Instagram', 'Instagram个人主页链接', 'url', '{"pattern": "^https?://(www\\.)?instagram\\.com/.+"}', '', 'Instagram', 'from-pink-500 to-rose-500', 3, false),
('social_media', 'linkedin', 'LinkedIn', 'LinkedIn个人资料页面链接', 'url', '{"pattern": "^https?://(www\\.)?linkedin\\.com/.+"}', '', 'Linkedin', 'from-blue-700 to-blue-800', 4, false),
('social_media', 'github', 'GitHub', 'GitHub个人主页或项目地址', 'url', '{"pattern": "^https?://(www\\.)?github\\.com/.+"}', '', 'Github', 'from-gray-700 to-gray-900', 5, false),
('social_media', 'youtube', 'YouTube', 'YouTube频道或个人页面', 'url', '{"pattern": "^https?://(www\\.)?youtube\\.com/.+"}', '', 'Youtube', 'from-red-500 to-red-600', 6, false),
('social_media', 'wechat', '微信', '微信号或微信公众号', 'text', '{"maxLength": 50}', '', 'MessageCircle', 'from-green-500 to-green-600', 7, false),
('social_media', 'website', '个人网站', '个人网站或博客地址', 'url', '{"pattern": "^https?://.+"}', '', 'Globe', 'from-purple-500 to-purple-600', 8, false),
('social_media', 'email', '邮箱', '联系邮箱地址', 'email', '{"required": false}', '', 'Mail', 'from-blue-500 to-cyan-500', 9, false),
('social_media', 'phone', '电话', '联系电话号码', 'phone', '{"pattern": "^[+]?[0-9\\s\\-\\(\\)]+$"}', '', 'Phone', 'from-green-400 to-teal-500', 10, false);

-- 联系方式配置模板
INSERT INTO config_templates (config_type, config_key, display_name, description, field_type, validation_rules, default_value, icon_name, color_scheme, display_order, is_required) VALUES
('contact', 'email', '邮箱地址', '主要联系邮箱', 'email', '{"required": true}', '', 'Mail', 'from-blue-500 to-cyan-500', 1, true),
('contact', 'phone', '电话号码', '联系电话', 'phone', '{"pattern": "^[+]?[0-9\\s\\-\\(\\)]+$"}', '', 'Phone', 'from-green-400 to-teal-500', 2, false),
('contact', 'address', '联系地址', '详细联系地址', 'textarea', '{"maxLength": 300}', '', 'MapPin', 'from-red-500 to-pink-500', 3, false),
('contact', 'qq', 'QQ号码', 'QQ联系方式', 'text', '{"pattern": "^[0-9]{5,12}$"}', '', 'MessageSquare', 'from-blue-400 to-blue-600', 4, false);

-- SEO配置模板
INSERT INTO config_templates (config_type, config_key, display_name, description, field_type, validation_rules, default_value, icon_name, color_scheme, display_order, is_required) VALUES
('seo', 'meta_keywords', '关键词', '网站SEO关键词，用逗号分隔', 'text', '{"maxLength": 200}', '', 'Tag', 'from-purple-500 to-indigo-500', 1, false),
('seo', 'meta_author', '作者信息', '网站作者或所有者信息', 'text', '{"maxLength": 100}', '', 'User', 'from-green-500 to-teal-500', 2, false),
('seo', 'google_analytics', 'Google Analytics', 'Google Analytics跟踪ID', 'text', '{"pattern": "^(G-[A-Z0-9]+|UA-[0-9]+-[0-9]+)?$"}', '', 'BarChart3', 'from-yellow-500 to-orange-500', 3, false),
('seo', 'google_search_console', 'Google Search Console', 'Google Search Console验证码', 'text', '{"maxLength": 100}', '', 'Search', 'from-blue-500 to-purple-500', 4, false);

-- 其他配置模板
INSERT INTO config_templates (config_type, config_key, display_name, description, field_type, validation_rules, default_value, icon_name, color_scheme, display_order, is_required) VALUES
('other', 'theme_color', '主题色彩', '网站主题色彩设置', 'select', '{"options": [{"value": "blue", "label": "蓝色"}, {"value": "purple", "label": "紫色"}, {"value": "green", "label": "绿色"}]}', 'blue', 'Palette', 'from-indigo-500 to-purple-500', 1, false),
('other', 'comment_system', '评论系统', '选择评论系统类型', 'select', '{"options": [{"value": "disqus", "label": "Disqus"}, {"value": "gitalk", "label": "Gitalk"}, {"value": "valine", "label": "Valine"}]}', 'disqus', 'MessageSquare', 'from-blue-500 to-cyan-500', 2, false),
('other', 'analytics_enabled', '统计分析', '是否启用网站统计分析', 'boolean', '{}', 'true', 'BarChart3', 'from-green-500 to-teal-500', 3, false);