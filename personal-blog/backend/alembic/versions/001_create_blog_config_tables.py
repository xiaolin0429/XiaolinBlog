"""Create blog config tables

Revision ID: 001_create_blog_config_tables
Revises: 1c43027ea407
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_create_blog_config_tables'
down_revision = '1c43027ea407'
branch_labels = None
depends_on = None


def upgrade():
    # 使用字符串类型代替枚举类型
    config_category_type = sa.String(50)
    config_data_type = sa.String(50)

    # Create config_groups table
    op.create_table(
        'config_groups',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('group_key', sa.String(length=100), nullable=False),
        sa.Column('group_name', sa.String(length=200), nullable=False),
        sa.Column('category', config_category_type, nullable=False),
        sa.Column('icon_name', sa.String(length=100), nullable=True),
        sa.Column('color_scheme', sa.String(length=100), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('display_order', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_config_groups_id'), 'config_groups', ['id'], unique=False)
    op.create_index(op.f('ix_config_groups_group_key'), 'config_groups', ['group_key'], unique=True)

    # Create blog_configs table
    op.create_table(
        'blog_configs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('config_key', sa.String(length=100), nullable=False),
        sa.Column('config_value', sa.Text(), nullable=True),
        sa.Column('default_value', sa.Text(), nullable=True),
        sa.Column('category', config_category_type, nullable=False),
        sa.Column('group_key', sa.String(length=100), nullable=True),
        sa.Column('data_type', config_data_type, nullable=True),
        sa.Column('display_name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('placeholder', sa.String(length=500), nullable=True),
        sa.Column('help_text', sa.Text(), nullable=True),
        sa.Column('validation_rules', sa.JSON(), nullable=True),
        sa.Column('options', sa.JSON(), nullable=True),
        sa.Column('is_required', sa.Boolean(), nullable=True),
        sa.Column('is_public', sa.Boolean(), nullable=True),
        sa.Column('is_enabled', sa.Boolean(), nullable=True),
        sa.Column('sort_order', sa.Integer(), nullable=True),
        sa.Column('version', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_blog_configs_id'), 'blog_configs', ['id'], unique=False)
    op.create_index(op.f('ix_blog_configs_config_key'), 'blog_configs', ['config_key'], unique=True)

    # Create config_histories table
    op.create_table(
        'config_histories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('config_key', sa.String(length=100), nullable=False),
        sa.Column('old_value', sa.Text(), nullable=True),
        sa.Column('new_value', sa.Text(), nullable=True),
        sa.Column('change_reason', sa.String(length=500), nullable=True),
        sa.Column('changed_by', sa.Integer(), nullable=True),
        sa.Column('changed_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_config_histories_id'), 'config_histories', ['id'], unique=False)

    # Create config_caches table
    op.create_table(
        'config_caches',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('cache_key', sa.String(length=200), nullable=False),
        sa.Column('cache_data', sa.JSON(), nullable=False),
        sa.Column('category', config_category_type, nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_config_caches_id'), 'config_caches', ['id'], unique=False)
    op.create_index(op.f('ix_config_caches_cache_key'), 'config_caches', ['cache_key'], unique=True)


def downgrade():
    # Drop tables
    op.drop_table('config_caches')
    op.drop_table('config_histories')
    op.drop_table('blog_configs')
    op.drop_table('config_groups')
    
    # Drop enum types
    op.execute('DROP TYPE IF EXISTS configdatatype')
    op.execute('DROP TYPE IF EXISTS configcategory')