from app import create_app, db
from app.models.user import User
from app.models.uploaded_file import UploadedFile
from datetime import datetime
import os

app = create_app()

def seed_admin_and_files():
    with app.app_context():
        # Check if admin already exists
        admin = User.query.filter_by(email='admin@example.com').first()
        
        if not admin:
            admin = User(
                email='admin@example.com',
                first_name='Admin',
                last_name='User',
                password_hash='',
                role='admin',
                status='approved',
            )
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()
            print('✅ Admin user created successfully!')
        else:
            print('ℹ️ Admin user already exists')

        # Check if any uploaded files already exist for this user
        existing_file = UploadedFile.query.filter_by(user_id=admin.id).first()
        if not existing_file:
            uploads_dir = os.path.abspath("uploads")
            os.makedirs(uploads_dir, exist_ok=True)  # Ensure the directory exists
            
            sample_files = [
                UploadedFile(
                    filename="sample1.xlsx",
                    filepath=os.path.join(uploads_dir, "sample1.xlsx"),
                    sheets=3,
                    file_type="xlsx",
                    size=104857,
                    user_id=admin.id
                ),
                UploadedFile(
                    filename="report_q2.xls",
                    filepath=os.path.join(uploads_dir, "report_q2.xls"),
                    sheets=5,
                    file_type="xls",
                    size=209715,
                    user_id=admin.id
                )
            ]

            db.session.bulk_save_objects(sample_files)
            db.session.commit()
            print("✅ Sample uploaded files created.")
        else:
            print("ℹ️ Sample uploaded files already exist.")

if __name__ == '__main__':
    seed_admin_and_files()
