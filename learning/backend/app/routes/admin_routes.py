from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.auth_service import AuthService
from app.utils.decorators import admin_required

admin_bp = Blueprint('admin', __name__)
#admin aproved /not approve
@admin_bp.route('/pending-managers', methods=['GET'])
@jwt_required()
@admin_required
def get_pending_managers():
    try:
        managers = AuthService.get_pending_managers()
        return jsonify({
            'success': True,
            'data': [{
                'id': m.id,
                'email': m.email,
                'first_name': m.first_name,
                'last_name': m.last_name,
                'created_at': m.created_at.isoformat()
            } for m in managers]
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@admin_bp.route('/approve-manager/<int:manager_id>', methods=['PUT'])
@jwt_required()
@admin_required
def approve_manager(manager_id):
    try:
        manager, error = AuthService.update_manager_status(manager_id, 'approved')
        if error:
            return jsonify({'success': False, 'message': error}), 400
        return jsonify({
            'success': True,
            'message': 'Manager approved successfully',
            'data': {
                'id': manager.id,
                'status': manager.status
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@admin_bp.route('/reject-manager/<int:manager_id>', methods=['PUT'])
@jwt_required()
@admin_required
def reject_manager(manager_id):
    try:
        manager, error = AuthService.update_manager_status(manager_id, 'rejected')
        if error:
            return jsonify({'success': False, 'message': error}), 400
        return jsonify({
            'success': True,
            'message': 'Manager rejected successfully',
            'data': {
                'id': manager.id,
                'status': manager.status
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500