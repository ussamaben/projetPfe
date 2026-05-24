from app.models.user import User
from app import db

class AuthService:
    @staticmethod
    def register_user(email, password, first_name, last_name):
        if User.query.filter_by(email=email).first():
            return None, 'Email already registered'
        
        user = User(
            email=email,
            first_name=first_name,
            last_name=last_name,
            role='manager',
            status='pending'
        )
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        return user, None

    @staticmethod
    def login_user(email, password):
        user = User.query.filter_by(email=email).first()
        if not user or not user.check_password(password):
            return None, 'Invalid credentials'
        
        if user.status != 'approved':
            return None, 'Account not approved yet'
        
        return user, None

    @staticmethod
    def get_pending_managers():
        return User.query.filter_by(role='manager', status='pending').all()

    @staticmethod
    def update_manager_status(manager_id, status):
        manager = User.query.get(manager_id)
        if not manager or manager.role != 'manager':
            return None, 'Manager not found'
        
        manager.status = status
        db.session.commit()
        return manager, None    