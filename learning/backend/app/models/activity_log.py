from app import db
from datetime import datetime

class ActivityLog(db.Model):
    __tablename__ = 'activity_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    activity_type = db.Column(db.String(50), nullable=False)
    endpoint = db.Column(db.String(100))
    method = db.Column(db.String(10))
    ip_address = db.Column(db.String(45))
    details = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'activity_type': self.activity_type,
            'endpoint': self.endpoint,
            'method': self.method,
            'ip_address': self.ip_address,
            'details': self.details,
            'timestamp': self.timestamp.isoformat()
        }