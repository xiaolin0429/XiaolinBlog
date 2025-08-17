"""fix blog config version field

Revision ID: 003_fix_blog_config_version
Revises: 002_create_image_gallery_tables
Create Date: 2025-08-17 23:10:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003_fix_blog_config_version'
down_revision = '002_create_image_gallery_tables'
branch_labels = None
depends_on = None


def upgrade():
    """修复博客配置表中的version字段问题"""
    
    # 更新所有version为NULL的记录，设置为1
    op.execute("""
        UPDATE blog_configs 
        SET version = 1 
        WHERE version IS NULL
    """)
    
    # 修改version字段为NOT NULL
    op.alter_column('blog_configs', 'version',
                    existing_type=sa.Integer(),
                    nullable=False,
                    server_default='1')


def downgrade():
    """回滚操作"""
    
    # 允许version字段为NULL
    op.alter_column('blog_configs', 'version',
                    existing_type=sa.Integer(),
                    nullable=True,
                    server_default=None)