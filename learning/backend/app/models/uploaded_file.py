from app import db
from datetime import datetime

class UploadedFile(db.Model):
    __tablename__ = 'uploaded_files'
    
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    filepath = db.Column(db.String(512), nullable=False)
    sheets = db.Column(db.Integer)
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)
    file_type = db.Column(db.String(50))
    size = db.Column(db.BigInteger)
    
    # Relationship to User
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    user = db.relationship('User', backref='uploaded_files')
    
    def __repr__(self):
        return f'<UploadedFile {self.filename} (ID: {self.id})>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'filepath': self.filepath,
            'sheets': self.sheets,
            'upload_date': self.upload_date.isoformat(),
            'type': self.file_type,
            'size': self.size,
            'user_id': self.user_id
        }

# Optional: Add this to your __init__.py if using separate model files
# from .uploaded_file import UploadedFile