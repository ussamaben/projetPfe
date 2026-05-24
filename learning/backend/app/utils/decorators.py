from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt, get_jwt_identity
from flask import jsonify

def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        claims = get_jwt()
        print("JWT Claims:", claims)  # Debug output
        # ... rest of decorator
        
        # Enhanced error response
        if not claims.get('role'):
            return jsonify({
                "success": False,
                "message": "Missing role claim in token",
                "solution": "Re-login to get a new token"
            }), 403
            
        if claims.get('role') != 'admin':
            return jsonify({
                "success": False,
                "message": "Admin privileges required",
                "required_role": "admin",
                "your_role": claims.get('role')
            }), 403
            
        return fn(*args, **kwargs)
    return wrapper

def manager_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        from flask import request, current_app
        # Allow CORS preflight to pass through
        if request.method == 'OPTIONS':
            return '', 204  # Allow preflight requests without JWT

        # Dev-mode bypass: if no Authorization header and app is in debug or explicitly allows dev mode,
        # permit the call from localhost and inject a default dev user id to keep endpoint signatures.
        auth_header = request.headers.get('Authorization')
        allow_dev = current_app.config.get('ALLOW_DEVMODE', False) or current_app.debug
        remote = request.remote_addr
        if not auth_header and allow_dev and remote in ('127.0.0.1', '::1', 'localhost'):
            dev_user_id = current_app.config.get('DEV_USER_ID', 1)
            print(f"Dev-mode manager access granted for remote {remote}, using user_id={dev_user_id}")
            return fn(dev_user_id, *args, **kwargs)

        # Normal JWT flow
        try:
            verify_jwt_in_request()
        except Exception as e:
            # Return a consistent unauthorized message rather than allowing an exception to bubble
            return jsonify({"msg": str(e)}), 401

        claims = get_jwt()
        user_id = get_jwt_identity()
        print("JWT Claims:", claims)  # Debug

        if not claims.get('role'):
            return jsonify({
                "success": False,
                "message": "Missing role claim in token",
                "solution": "Re-login to get a new token"
            }), 403

        if claims.get('role') != 'manager':
            return jsonify({
                "success": False,
                "message": "Manager privileges required",
                "required_role": "manager",
                "your_role": claims.get('role')
            }), 403

        # Pass user_id as first positional argument
        return fn(user_id, *args, **kwargs)
    return wrapper