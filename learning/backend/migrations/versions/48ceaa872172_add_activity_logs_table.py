"""Add activity_logs table

Revision ID: 48ceaa872172
Revises: 6678b642e3d3
Create Date: 2025-06-11 14:29:12.336932

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '48ceaa872172'
down_revision = '6678b642e3d3'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('activity_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('activity_type', sa.String(length=50), nullable=False),
        sa.Column('endpoint', sa.String(length=100)),
        sa.Column('method', sa.String(length=10)),
        sa.Column('ip_address', sa.String(length=45)),
        sa.Column('details', sa.Text()),
        sa.Column('timestamp', sa.DateTime(), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade():
    op.drop_table('activity_logs')
