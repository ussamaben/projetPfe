# app/models/report.py
from app import db
from datetime import datetime

class Report(db.Model):
    __tablename__ = 'reports'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    report_type = db.Column(db.String(50), nullable=False)  # 'vulnerability' or 'alert'
    file_id = db.Column(db.Integer, db.ForeignKey('uploaded_files.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    pdf_path = db.Column(db.String(500))  # Path to the generated PDF
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    uploaded_file = db.relationship('UploadedFile', backref='reports')
    user = db.relationship('User', backref='reports')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'type': self.report_type,
            'file_id': self.file_id,
            'filename': self.uploaded_file.filename if self.uploaded_file else '',
            'created_at': self.created_at.isoformat(),
            'pdf_path': self.pdf_path,
            'status': 'Completed'
        }