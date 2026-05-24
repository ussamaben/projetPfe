from flask import Flask, jsonify
#from flask_cors import CORS

from app import create_app



app = create_app()
#CORS(app, supports_credentials=True, resources={r"/manager/*": {"origins": "http://localhost:3000"}}) # Enable CORS for all routes under /manager/

#@app.route('/manager/dashboard')
#def dashboard():
 #   return jsonify({'message': 'Dashboard data'})

if __name__ == '__main__':
    app.run(debug=True)
    