from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
    get_jwt
)
from app.services.auth_service import AuthService
from app.models.activity_log import ActivityLog
from app import db

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    if not request.is_json:
        return jsonify({"msg": "Missing JSON in request"}), 400

    email = request.json.get('email')
    password = request.json.get('password')

    user, error = AuthService.login_user(email, password)
    if error:
        return jsonify({"success": False, "msg": error}), 401

    # Log the login activity
    login_log = ActivityLog(
        user_id=user.id,
        activity_type='login',
        endpoint='/auth/login',
        method='POST',
        ip_address=request.remote_addr,
        details='User logged in successfully'
    )
    db.session.add(login_log)
    
    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={
            "role": user.role,
            "email": user.email
        }
    )
    
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Failed to commit login log: {str(e)}")
    
    response = jsonify({
        "success": True,
        "access_token": access_token,
        "user_id": user.id,
        "role": user.role,
        "email": user.email
    })
    
    return response, 200

@auth_bp.route('/verify', methods=['GET'])
@jwt_required()
def verify_token():
    current_user = get_jwt_identity()
    claims = get_jwt()
    return jsonify({
        "success": True,
        "user_id": current_user,
        "role": claims.get('role'),
        "email": claims.get('email')
    }), 200

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    current_user = get_jwt_identity()
    
    # Log the logout activity
    logout_log = ActivityLog(
        user_id=current_user,
        activity_type='logout',
        endpoint='/auth/logout',
        method='POST',
        ip_address=request.remote_addr,
        details='User logged out'
    )
    db.session.add(logout_log)
    
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Failed to commit logout log: {str(e)}")
    
    return jsonify({"success": True, "msg": "Successfully logged out"}), 200

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        if not request.is_json:
            return jsonify({"success": False, "msg": "Missing JSON in request"}), 400

        data = request.get_json()
        required_fields = ['email', 'password', 'first_name', 'last_name']
        if not all(field in data for field in required_fields):
            return jsonify({"success": False, "msg": "Missing required fields"}), 400

        user, error = AuthService.register_user(
            email=data.get('email'),
            password=data.get('password'),
            first_name=data.get('first_name'),
            last_name=data.get('last_name')
        )
        
        if error:
            return jsonify({"success": False, "msg": error}), 400
            
        # Log the registration activity
        register_log = ActivityLog(
            user_id=user.id,
            activity_type='registration',
            endpoint='/auth/register',
            method='POST',
            ip_address=request.remote_addr,
            details='New user registered'
        )
        db.session.add(register_log)
        db.session.commit()
            
        return jsonify({
            "success": True,
            "message": "User registered successfully",
            "user_id": user.id
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Registration error: {str(e)}")
        return jsonify({
            "success": False,
            "msg": "Registration failed",
            "error": str(e)
        }), 500