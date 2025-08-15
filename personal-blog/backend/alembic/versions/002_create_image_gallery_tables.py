"""创建图库相关数据表

Revision ID: 002_create_image_gallery_tables
Revises: 001_create_blog_config_tables
Create Date: 2025-08-15 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002_create_image_gallery_tables'
down_revision = '001_create_blog_config_tables'
branch_labels = None
depends_on = None


def upgrade():
    # 创建图库主表
    op.create_table('image_gallery',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('filename', sa.String(length=255), nullable=False, comment='原始文件名'),
        sa.Column('display_name', sa.String(length=255), nullable=True, comment='显示名称'),
        sa.Column('description', sa.Text(), nullable=True, comment='图片描述'),
        sa.Column('alt_text', sa.String(length=500), nullable=True, comment='替代文本（用于SEO和无障碍）'),
        sa.Column('file_path', sa.String(length=500), nullable=False, comment='文件存储路径'),
        sa.Column('file_url', sa.String(length=500), nullable=False, comment='访问URL'),
        sa.Column('file_size', sa.BigInteger(), nullable=False, comment='文件大小（字节）'),
        sa.Column('file_hash', sa.String(length=64), nullable=True, comment='文件MD5哈希值'),
        sa.Column('mime_type', sa.String(length=100), nullable=False, comment='MIME类型'),
        sa.Column('width', sa.Integer(), nullable=True, comment='图片宽度'),
        sa.Column('height', sa.Integer(), nullable=True, comment='图片高度'),
        sa.Column('format', sa.String(length=20), nullable=True, comment='图片格式（jpg, png, webp等）'),
        sa.Column('thumbnail_path', sa.String(length=500), nullable=True, comment='缩略图路径'),
        sa.Column('thumbnail_url', sa.String(length=500), nullable=True, comment='缩略图URL'),
        sa.Column('category', sa.String(length=50), nullable=True, comment='图片分类'),
        sa.Column('tags', sa.JSON(), nullable=True, comment='图片标签（JSON数组）'),
        sa.Column('usage_count', sa.Integer(), nullable=True, comment='使用次数'),
        sa.Column('download_count', sa.Integer(), nullable=True, comment='下载次数'),
        sa.Column('status', sa.String(length=20), nullable=True, comment='图片状态'),
        sa.Column('is_public', sa.Boolean(), nullable=True, comment='是否公开访问'),
        sa.Column('uploaded_by', sa.Integer(), nullable=True, comment='上传用户ID'),
        sa.Column('upload_ip', sa.String(length=45), nullable=True, comment='上传IP地址'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True, comment='创建时间'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True, comment='更新时间'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_image_gallery_id'), 'image_gallery', ['id'], unique=False)
    op.create_index(op.f('ix_image_gallery_file_hash'), 'image_gallery', ['file_hash'], unique=True)
    op.create_index(op.f('ix_image_gallery_category'), 'image_gallery', ['category'], unique=False)
    op.create_index(op.f('ix_image_gallery_status'), 'image_gallery', ['status'], unique=False)
    op.create_index(op.f('ix_image_gallery_uploaded_by'), 'image_gallery', ['uploaded_by'], unique=False)
    op.create_index(op.f('ix_image_gallery_created_at'), 'image_gallery', ['created_at'], unique=False)

    # 创建图片使用记录表
    op.create_table('image_usage',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('image_id', sa.Integer(), nullable=False, comment='图片ID'),
        sa.Column('usage_type', sa.String(length=50), nullable=False, comment='使用类型（blog_config, post_content, user_avatar等）'),
        sa.Column('reference_id', sa.String(length=100), nullable=True, comment='引用ID（配置键名、文章ID等）'),
        sa.Column('reference_table', sa.String(length=100), nullable=True, comment='引用表名'),
        sa.Column('usage_context', sa.JSON(), nullable=True, comment='使用上下文信息'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True, comment='创建时间'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True, comment='更新时间'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_image_usage_id'), 'image_usage', ['id'], unique=False)
    op.create_index(op.f('ix_image_usage_image_id'), 'image_usage', ['image_id'], unique=False)
    op.create_index(op.f('ix_image_usage_usage_type'), 'image_usage', ['usage_type'], unique=False)
    op.create_index(op.f('ix_image_usage_reference_id'), 'image_usage', ['reference_id'], unique=False)


def downgrade():
    # 删除索引和表
    op.drop_index(op.f('ix_image_usage_reference_id'), table_name='image_usage')
    op.drop_index(op.f('ix_image_usage_usage_type'), table_name='image_usage')
    op.drop_index(op.f('ix_image_usage_image_id'), table_name='image_usage')
    op.drop_index(op.f('ix_image_usage_id'), table_name='image_usage')
    op.drop_table('image_usage')
    
    op.drop_index(op.f('ix_image_gallery_created_at'), table_name='image_gallery')
    op.drop_index(op.f('ix_image_gallery_uploaded_by'), table_name='image_gallery')
    op.drop_index(op.f('ix_image_gallery_status'), table_name='image_gallery')
    op.drop_index(op.f('ix_image_gallery_category'), table_name='image_gallery')
    op.drop_index(op.f('ix_image_gallery_file_hash'), table_name='image_gallery')
    op.drop_index(op.f('ix_image_gallery_id'), table_name='image_gallery')
    op.drop_table('image_gallery')