from app import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'
    
    # Basic fields
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    
    # Role and status fields
    role = db.Column(db.String(20), nullable=False, default='manager')
    status = db.Column(db.String(20), nullable=False, default='pending')
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Methods
    def set_password(self, password):
        """Create hashed password."""
        self.password_hash = generate_password_hash(password)
    

    def check_password(self, password):
        """Check hashed password."""
        
        return check_password_hash(self.password_hash, password)
    
    def is_active(self):
        """Check if user is approved."""
        return self.status == 'approved'
    
    def is_admin(self):
        """Check if user is admin."""
        return self.role == 'admin'
    
    def to_dict(self):
        """Convert user object to dictionary."""
        return {
            'id': self.id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'role': self.role,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def __repr__(self):
        return f'<User {self.email} (ID: {self.id})>'