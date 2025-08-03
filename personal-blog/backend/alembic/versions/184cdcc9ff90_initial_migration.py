"""Initial migration

Revision ID: 184cdcc9ff90
Revises: 
Create Date: 2025-08-02 08:18:43.781006

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '184cdcc9ff90'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 创建用户表
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(length=50), nullable=False, comment='用户名'),
        sa.Column('email', sa.String(length=100), nullable=False, comment='邮箱'),
        sa.Column('hashed_password', sa.String(length=255), nullable=False, comment='加密密码'),
        sa.Column('full_name', sa.String(length=100), nullable=True, comment='真实姓名'),
        sa.Column('avatar', sa.String(length=255), nullable=True, comment='头像URL'),
        sa.Column('bio', sa.Text(), nullable=True, comment='个人简介'),
        sa.Column('is_active', sa.Boolean(), nullable=True, comment='是否激活'),
        sa.Column('is_superuser', sa.Boolean(), nullable=True, comment='是否超级用户'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True, comment='创建时间'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True, comment='更新时间'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)

    # 创建分类表
    op.create_table('categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False, comment='分类名称'),
        sa.Column('slug', sa.String(length=100), nullable=False, comment='URL别名'),
        sa.Column('description', sa.Text(), nullable=True, comment='分类描述'),
        sa.Column('color', sa.String(length=7), nullable=True, comment='分类颜色(HEX)'),
        sa.Column('post_count', sa.Integer(), nullable=True, comment='文章数量'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True, comment='创建时间'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True, comment='更新时间'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_categories_id'), 'categories', ['id'], unique=False)
    op.create_index(op.f('ix_categories_name'), 'categories', ['name'], unique=True)
    op.create_index(op.f('ix_categories_slug'), 'categories', ['slug'], unique=True)

    # 创建标签表
    op.create_table('tags',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False, comment='标签名称'),
        sa.Column('slug', sa.String(length=50), nullable=False, comment='URL别名'),
        sa.Column('color', sa.String(length=7), nullable=True, comment='标签颜色(HEX)'),
        sa.Column('post_count', sa.Integer(), nullable=True, comment='文章数量'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True, comment='创建时间'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True, comment='更新时间'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tags_id'), 'tags', ['id'], unique=False)
    op.create_index(op.f('ix_tags_name'), 'tags', ['name'], unique=True)
    op.create_index(op.f('ix_tags_slug'), 'tags', ['slug'], unique=True)

    # 创建文章表
    op.create_table('posts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False, comment='文章标题'),
        sa.Column('slug', sa.String(length=200), nullable=False, comment='URL别名'),
        sa.Column('content', sa.Text(), nullable=False, comment='文章内容(Markdown)'),
        sa.Column('excerpt', sa.Text(), nullable=True, comment='文章摘要'),
        sa.Column('featured_image', sa.String(length=255), nullable=True, comment='特色图片URL'),
        sa.Column('status', sa.String(length=20), nullable=True, comment='文章状态: draft, published, archived'),
        sa.Column('is_featured', sa.Boolean(), nullable=True, comment='是否精选'),
        sa.Column('view_count', sa.Integer(), nullable=True, comment='浏览次数'),
        sa.Column('like_count', sa.Integer(), nullable=True, comment='点赞次数'),
        sa.Column('comment_count', sa.Integer(), nullable=True, comment='评论次数'),
        sa.Column('published_at', sa.DateTime(timezone=True), nullable=True, comment='发布时间'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True, comment='创建时间'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True, comment='更新时间'),
        sa.Column('author_id', sa.Integer(), nullable=False, comment='作者ID'),
        sa.Column('category_id', sa.Integer(), nullable=True, comment='分类ID'),
        sa.ForeignKeyConstraint(['author_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_posts_id'), 'posts', ['id'], unique=False)
    op.create_index(op.f('ix_posts_slug'), 'posts', ['slug'], unique=True)
    op.create_index(op.f('ix_posts_title'), 'posts', ['title'], unique=False)

    # 创建评论表
    op.create_table('comments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False, comment='评论内容'),
        sa.Column('author_name', sa.String(length=100), nullable=True, comment='访客姓名'),
        sa.Column('author_email', sa.String(length=100), nullable=True, comment='访客邮箱'),
        sa.Column('author_website', sa.String(length=255), nullable=True, comment='访客网站'),
        sa.Column('ip_address', sa.String(length=45), nullable=True, comment='IP地址'),
        sa.Column('user_agent', sa.String(length=500), nullable=True, comment='用户代理'),
        sa.Column('is_approved', sa.Boolean(), nullable=True, comment='是否已审核'),
        sa.Column('is_spam', sa.Boolean(), nullable=True, comment='是否垃圾评论'),
        sa.Column('like_count', sa.Integer(), nullable=True, comment='点赞次数'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True, comment='创建时间'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True, comment='更新时间'),
        sa.Column('post_id', sa.Integer(), nullable=False, comment='文章ID'),
        sa.Column('author_id', sa.Integer(), nullable=True, comment='用户ID(注册用户)'),
        sa.Column('parent_id', sa.Integer(), nullable=True, comment='父评论ID'),
        sa.ForeignKeyConstraint(['author_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['parent_id'], ['comments.id'], ),
        sa.ForeignKeyConstraint(['post_id'], ['posts.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_comments_id'), 'comments', ['id'], unique=False)

    # 创建文章标签关联表
    op.create_table('post_tags',
        sa.Column('post_id', sa.Integer(), nullable=False),
        sa.Column('tag_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['post_id'], ['posts.id'], ),
        sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], ),
        sa.PrimaryKeyConstraint('post_id', 'tag_id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('post_tags')
    op.drop_index(op.f('ix_comments_id'), table_name='comments')
    op.drop_table('comments')
    op.drop_index(op.f('ix_posts_title'), table_name='posts')
    op.drop_index(op.f('ix_posts_slug'), table_name='posts')
    op.drop_index(op.f('ix_posts_id'), table_name='posts')
    op.drop_table('posts')
    op.drop_index(op.f('ix_tags_slug'), table_name='tags')
    op.drop_index(op.f('ix_tags_name'), table_name='tags')
    op.drop_index(op.f('ix_tags_id'), table_name='tags')
    op.drop_table('tags')
    op.drop_index(op.f('ix_categories_slug'), table_name='categories')
    op.drop_index(op.f('ix_categories_name'), table_name='categories')
    op.drop_index(op.f('ix_categories_id'), table_name='categories')
    op.drop_table('categories')
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
