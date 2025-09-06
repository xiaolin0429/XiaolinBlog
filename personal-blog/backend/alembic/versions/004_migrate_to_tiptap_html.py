"""migrate to tiptap html format

Revision ID: 004_migrate_to_tiptap_html
Revises: 003_fix_blog_config_version
Create Date: 2025-08-18 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
import re


# revision identifiers, used by Alembic.
revision = '004_migrate_to_tiptap_html'
down_revision = '003_fix_blog_config_version'
branch_labels = None
depends_on = None


def markdown_to_html(markdown_text):
    """简单的 Markdown 到 HTML 转换"""
    if not markdown_text:
        return ""
    
    html = markdown_text
    
    # 标题转换
    html = re.sub(r'^# (.*$)', r'<h1>\1</h1>', html, flags=re.MULTILINE)
    html = re.sub(r'^## (.*$)', r'<h2>\1</h2>', html, flags=re.MULTILINE)
    html = re.sub(r'^### (.*$)', r'<h3>\1</h3>', html, flags=re.MULTILINE)
    html = re.sub(r'^#### (.*$)', r'<h4>\1</h4>', html, flags=re.MULTILINE)
    html = re.sub(r'^##### (.*$)', r'<h5>\1</h5>', html, flags=re.MULTILINE)
    html = re.sub(r'^###### (.*$)', r'<h6>\1</h6>', html, flags=re.MULTILINE)
    
    # 粗体和斜体
    html = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', html)
    html = re.sub(r'\*(.*?)\*', r'<em>\1</em>', html)
    
    # 删除线
    html = re.sub(r'~~(.*?)~~', r'<s>\1</s>', html)
    
    # 行内代码
    html = re.sub(r'`(.*?)`', r'<code>\1</code>', html)
    
    # 代码块
    html = re.sub(r'```(\w+)?\n(.*?)\n```', r'<pre><code>\2</code></pre>', html, flags=re.DOTALL)
    
    # 链接
    html = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', html)
    
    # 图片
    html = re.sub(r'!\[([^\]]*)\]\(([^)]+)\)', r'<img src="\2" alt="\1" />', html)
    
    # 引用
    html = re.sub(r'^> (.*$)', r'<blockquote>\1</blockquote>', html, flags=re.MULTILINE)
    
    # 无序列表
    html = re.sub(r'^- (.*$)', r'<li>\1</li>', html, flags=re.MULTILINE)
    html = re.sub(r'^  - (.*$)', r'<li>\1</li>', html, flags=re.MULTILINE)
    
    # 有序列表
    html = re.sub(r'^\d+\. (.*$)', r'<li>\1</li>', html, flags=re.MULTILINE)
    
    # 包装列表项
    html = re.sub(r'(<li>.*?</li>)', r'<ul>\1</ul>', html, flags=re.DOTALL)
    html = re.sub(r'</ul>\s*<ul>', '', html)  # 合并连续的列表
    
    # 段落处理
    paragraphs = html.split('\n\n')
    processed_paragraphs = []
    
    for para in paragraphs:
        para = para.strip()
        if para and not para.startswith('<'):
            para = f'<p>{para}</p>'
        processed_paragraphs.append(para)
    
    html = '\n'.join(processed_paragraphs)
    
    # 换行处理
    html = html.replace('\n', '<br>')
    
    return html


def upgrade():
    # 添加 content_format 字段
    op.add_column('posts', sa.Column('content_format', sa.String(10), nullable=False, server_default='html'))
    
    # 获取数据库连接
    connection = op.get_bind()
    
    # 查询所有文章
    result = connection.execute(text("SELECT id, content FROM posts"))
    posts = result.fetchall()
    
    # 转换每篇文章的内容
    for post in posts:
        post_id, content = post
        if content:
            # 将 Markdown 转换为 HTML
            html_content = markdown_to_html(content)
            
            # 更新文章内容
            connection.execute(
                text("UPDATE posts SET content = :content, content_format = 'html' WHERE id = :id"),
                {"content": html_content, "id": post_id}
            )
    
    # 提交事务
    connection.commit()


def downgrade():
    # 注意：这个降级操作会丢失 HTML 格式，只能尽力而为
    connection = op.get_bind()
    
    # 简单的 HTML 到 Markdown 转换（不完美）
    result = connection.execute(text("SELECT id, content FROM posts WHERE content_format = 'html'"))
    posts = result.fetchall()
    
    for post in posts:
        post_id, content = post
        if content:
            # 简单的 HTML 到 Markdown 转换
            markdown_content = content
            markdown_content = re.sub(r'<h1>(.*?)</h1>', r'# \1', markdown_content)
            markdown_content = re.sub(r'<h2>(.*?)</h2>', r'## \1', markdown_content)
            markdown_content = re.sub(r'<h3>(.*?)</h3>', r'### \1', markdown_content)
            markdown_content = re.sub(r'<strong>(.*?)</strong>', r'**\1**', markdown_content)
            markdown_content = re.sub(r'<em>(.*?)</em>', r'*\1*', markdown_content)
            markdown_content = re.sub(r'<code>(.*?)</code>', r'`\1`', markdown_content)
            markdown_content = re.sub(r'<a href="([^"]+)">(.*?)</a>', r'[\2](\1)', markdown_content)
            markdown_content = re.sub(r'<img src="([^"]+)" alt="([^"]*)" />', r'![\2](\1)', markdown_content)
            markdown_content = re.sub(r'<blockquote>(.*?)</blockquote>', r'> \1', markdown_content)
            markdown_content = re.sub(r'<li>(.*?)</li>', r'- \1', markdown_content)
            markdown_content = re.sub(r'<[^>]+>', '', markdown_content)  # 移除其他 HTML 标签
            markdown_content = markdown_content.replace('<br>', '\n')
            
            connection.execute(
                text("UPDATE posts SET content = :content WHERE id = :id"),
                {"content": markdown_content, "id": post_id}
            )
    
    # 删除 content_format 字段
    op.drop_column('posts', 'content_format')
    
    connection.commit()