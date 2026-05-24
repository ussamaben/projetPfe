"""create uploaded_files table

Revision ID: 6678b642e3d3
Revises: 
Create Date: 2025-05-07 15:04:36.937099

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6678b642e3d3'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('uploaded_files',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('filename', sa.String(length=255), nullable=False),
        sa.Column('filepath', sa.String(length=512), nullable=False),
        sa.Column('sheets', sa.Integer(), nullable=True),
        sa.Column('upload_date', sa.DateTime(), nullable=True),
        sa.Column('file_type', sa.String(length=50), nullable=True),
        sa.Column('size', sa.BigInteger(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
        op.drop_table('uploaded_files')
