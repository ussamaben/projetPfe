from flask import Blueprint, jsonify, request
from app.utils.decorators import manager_required
from werkzeug.utils import secure_filename
import os

manager_bp = Blueprint('manager', __name__)

@manager_bp.route('/dashboard', methods=['GET'])
@manager_required
def manager_dashboard(user_id):
    return jsonify({
        "success": True,
        "message": "Welcome, manager!",
        "data": {
            "stats": ["test", "upload"],
            "features": ["analytics", "content-management"]
        }
    })



