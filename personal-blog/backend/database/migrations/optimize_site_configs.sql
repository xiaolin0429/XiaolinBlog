-- 优化网站配置表以支持扇形菜单系统
-- 基于现有 site_configs 表进行扩展

-- 1. 为现有表添加新字段
ALTER TABLE site_configs 
ADD COLUMN IF NOT EXISTS display_name VARCHAR(200) COMMENT '显示名称',
ADD COLUMN IF NOT EXISTS icon_name VARCHAR(100) COMMENT '图标名称（lucide-react图标）',
ADD COLUMN IF NOT EXISTS color_scheme VARCHAR(100) COMMENT '颜色方案（渐变色配置）',
ADD COLUMN IF NOT EXISTS validation_rules JSON COMMENT '验证规则配置',
ADD COLUMN IF NOT EXISTS default_value TEXT COMMENT '默认值',
ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT FALSE COMMENT '是否必填',
ADD COLUMN IF NOT EXISTS group_name VARCHAR(100) COMMENT '分组名称（用于扇形菜单分组）',
ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT TRUE COMMENT '是否启用该配置项';

-- 2. 创建配置分组表（用于扇形菜单的分组管理）
CREATE TABLE IF NOT EXISTS config_groups (
    id SERIAL PRIMARY KEY,
    group_key VARCHAR(100) UNIQUE NOT NULL COMMENT '分组键名',
    group_name VARCHAR(200) NOT NULL COMMENT '分组显示名称',
    category VARCHAR(50) NOT NULL COMMENT '所属配置分类',
    icon_name VARCHAR(100) COMMENT '分组图标',
    color_scheme VARCHAR(100) COMMENT '分组颜色方案',
    description TEXT COMMENT '分组描述',
    display_order INTEGER DEFAULT 0 COMMENT '显示顺序',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否激活',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 创建用户配置缓存表（提升查询性能）
CREATE TABLE IF NOT EXISTS user_config_cache (
    id SERIAL PRIMARY KEY,
    user_id INTEGER DEFAULT 1 COMMENT '用户ID（当前为单用户系统）',
    category VARCHAR(50) NOT NULL COMMENT '配置分类',
    config_data JSON NOT NULL COMMENT '完整配置数据',
    cache_version VARCHAR(50) NOT NULL COMMENT '缓存版本',
    expires_at TIMESTAMP NOT NULL COMMENT '过期时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, category)
);

-- 4. 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_site_configs_category_enabled ON site_configs(category, is_enabled);
CREATE INDEX IF NOT EXISTS idx_site_configs_group_order ON site_configs(group_name, sort_order);
CREATE INDEX IF NOT EXISTS idx_config_groups_category_active ON config_groups(category, is_active);
CREATE INDEX IF NOT EXISTS idx_user_config_cache_expires ON user_config_cache(expires_at);

-- 5. 插入扇形菜单分组配置
INSERT INTO config_groups (group_key, group_name, category, icon_name, color_scheme, description, display_order) VALUES
-- 基础信息分组
('site_identity', '网站标识', 'basic', 'Globe', 'from-blue-500 to-purple-600', '网站标题、Logo等标识信息', 1),
('site_content', '内容设置', 'basic', 'FileText', 'from-green-500 to-blue-500', '网站描述、关键词等内容设置', 2),
('site_locale', '本地化', 'basic', 'Languages', 'from-purple-500 to-pink-500', '语言、时区等本地化设置', 3),
('site_legal', '法律信息', 'basic', 'Shield', 'from-orange-500 to-red-500', '版权、备案等法律信息', 4),

-- 社交媒体分组
('social_mainstream', '主流平台', 'social', 'Share2', 'from-blue-500 to-cyan-500', 'Facebook、Twitter等主流社交平台', 1),
('social_professional', '专业平台', 'social', 'Briefcase', 'from-green-500 to-teal-500', 'LinkedIn、GitHub等专业平台', 2),
('social_media', '媒体平台', 'social', 'Video', 'from-red-500 to-pink-500', 'YouTube、Instagram等媒体平台', 3),
('social_contact', '联系方式', 'social', 'MessageCircle', 'from-purple-500 to-indigo-500', '邮箱、电话等直接联系方式', 4);

-- 6. 更新现有配置项，添加扇形菜单所需的字段
UPDATE site_configs SET 
    display_name = '网站标题',
    icon_name = 'Type',
    color_scheme = 'from-blue-500 to-purple-600',
    group_name = 'site_identity',
    validation_rules = '{"required": true, "minLength": 1, "maxLength": 100}',
    is_required = true
WHERE key = 'site_title';

UPDATE site_configs SET 
    display_name = '网站副标题',
    icon_name = 'Subtitles',
    color_scheme = 'from-green-500 to-blue-500',
    group_name = 'site_identity',
    validation_rules = '{"maxLength": 200}',
    is_required = false
WHERE key = 'site_subtitle';

UPDATE site_configs SET 
    display_name = '网站描述',
    icon_name = 'FileText',
    color_scheme = 'from-purple-500 to-pink-500',
    group_name = 'site_content',
    validation_rules = '{"maxLength": 500}',
    is_required = false
WHERE key = 'site_description';

UPDATE site_configs SET 
    display_name = '网站Logo',
    icon_name = 'Image',
    color_scheme = 'from-orange-500 to-red-500',
    group_name = 'site_identity',
    validation_rules = '{"type": "url"}',
    is_required = false
WHERE key = 'site_logo';

-- 添加扇形菜单系统需要的新配置项
INSERT INTO site_configs (key, value, category, description, data_type, display_name, icon_name, color_scheme, group_name, validation_rules, sort_order, is_required) VALUES
-- 基础信息新增配置项
('site_favicon', '', 'basic', '网站图标', 'url', '网站图标', 'Star', 'from-yellow-500 to-orange-500', 'site_identity', '{"type": "url"}', 6, false),
('site_language', 'zh-CN', 'basic', '网站语言', 'string', '网站语言', 'Languages', 'from-indigo-500 to-purple-500', 'site_locale', '{"required": true}', 7, true),
('site_timezone', 'Asia/Shanghai', 'basic', '时区设置', 'string', '时区设置', 'Clock', 'from-teal-500 to-green-500', 'site_locale', '{"required": true}', 8, true),
('site_copyright', '© 2024 我的博客. All rights reserved.', 'basic', '版权信息', 'string', '版权信息', 'Copyright', 'from-gray-500 to-slate-600', 'site_legal', '{"maxLength": 200}', 9, false),
('site_icp', '', 'basic', 'ICP备案号', 'string', 'ICP备案号', 'FileCheck', 'from-blue-600 to-indigo-600', 'site_legal', '{"maxLength": 50}', 10, false),
('site_police_record', '', 'basic', '公安备案号', 'string', '公安备案号', 'Shield', 'from-red-600 to-pink-600', 'site_legal', '{"maxLength": 50}', 11, false),

-- 社交媒体新增配置项
('social_facebook', '', 'social', 'Facebook链接', 'url', 'Facebook', 'Facebook', 'from-blue-600 to-blue-700', 'social_mainstream', '{"type": "url"}', 1, false),
('social_twitter', '', 'social', 'Twitter/X链接', 'url', 'Twitter/X', 'Twitter', 'from-sky-500 to-blue-600', 'social_mainstream', '{"type": "url"}', 2, false),
('social_instagram', '', 'social', 'Instagram链接', 'url', 'Instagram', 'Instagram', 'from-pink-500 to-rose-600', 'social_media', '{"type": "url"}', 3, false),
('social_youtube', '', 'social', 'YouTube链接', 'url', 'YouTube', 'Youtube', 'from-red-500 to-red-600', 'social_media', '{"type": "url"}', 4, false),
('social_personal_website', '', 'social', '个人网站', 'url', '个人网站', 'Globe', 'from-green-500 to-emerald-600', 'social_professional', '{"type": "url"}', 5, false),
('social_email', '', 'social', '邮箱地址', 'email', '邮箱', 'Mail', 'from-indigo-500 to-purple-600', 'social_contact', '{"type": "email"}', 6, false),
('social_phone', '', 'social', '电话号码', 'string', '电话', 'Phone', 'from-teal-500 to-cyan-600', 'social_contact', '{"type": "phone"}', 7, false);

-- 7. 创建触发器自动更新缓存
CREATE OR REPLACE FUNCTION update_config_cache()
RETURNS TRIGGER AS $$
BEGIN
    -- 删除相关缓存
    DELETE FROM user_config_cache 
    WHERE category = NEW.category;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_config_cache
    AFTER INSERT OR UPDATE OR DELETE ON site_configs
    FOR EACH ROW EXECUTE FUNCTION update_config_cache();

COMMENT ON TABLE site_configs IS '网站配置表 - 支持扇形菜单系统';
COMMENT ON TABLE config_groups IS '配置分组表 - 用于扇形菜单的分组管理';
COMMENT ON TABLE user_config_cache IS '用户配置缓存表 - 提升查询性能';