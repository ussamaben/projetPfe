from functools import wraps
from flask import request
from app.models.activity_log import ActivityLog
from app import db
from datetime import datetime

def log_activity(activity_type, details=None):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            # Get user_id from either kwargs or args
            user_id = kwargs.get('user_id') or (args[0] if args else None)
            
            if not user_id:
                # If we can't get user_id, skip logging rather than failing
                return f(*args, **kwargs)
            
            # Create the log entry
            log = ActivityLog(
                user_id=user_id,
                activity_type=activity_type,
                endpoint=request.path,
                method=request.method,
                ip_address=request.remote_addr,
                details=details or f"{activity_type} action performed"
            )
            
            try:
                db.session.add(log)
                db.session.commit()
            except Exception as e:
                db.session.rollback()
                # Don't fail the request if logging fails
                print(f"Activity logging failed: {str(e)}")
            
            return f(*args, **kwargs)
        return wrapper
    return decorator