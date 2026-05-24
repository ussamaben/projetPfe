from app import db
from datetime import datetime

class AnalysisResult(db.Model):
	__tablename__ = 'analysis_results'
	id = db.Column(db.Integer, primary_key=True)
	file_id = db.Column(db.Integer, db.ForeignKey('uploaded_files.id'), nullable=False)
	analysis_type = db.Column(db.String(50), nullable=False)  # e.g., 'vulnerability', 'alert', 'geo'
	result_json = db.Column(db.JSON, nullable=False)
	created_at = db.Column(db.DateTime, default=datetime.utcnow)
	updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

	uploaded_file = db.relationship('UploadedFile', backref='analysis_results')

	def to_dict(self):
		return {
			'id': self.id,
			'file_id': self.file_id,
			'analysis_type': self.analysis_type,
			'result_json': self.result_json,
			'created_at': self.created_at.isoformat(),
			'updated_at': self.updated_at.isoformat()
		}
