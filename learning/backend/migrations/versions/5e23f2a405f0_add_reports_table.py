"""Add reports table

Revision ID: 5e23f2a405f0
Revises: 48ceaa872172
Create Date: 2025-06-13 19:06:18.544244

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5e23f2a405f0'
down_revision = '48ceaa872172'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('reports',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('report_type', sa.String(length=50), nullable=False),
        sa.Column('file_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('pdf_path', sa.String(length=500)),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['file_id'], ['uploaded_files.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade():
    op.drop_table('reports')