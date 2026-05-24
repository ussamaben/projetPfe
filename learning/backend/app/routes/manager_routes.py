from flask import Blueprint, request, jsonify, send_file, current_app
from app import db
from app.models.uploaded_file import UploadedFile
from app.models.activity_log import ActivityLog
from app.models.report import Report
from app.models.analysis_result import AnalysisResult
from app.utils.decorators import manager_required
from app.utils.activity_logger import log_activity
from werkzeug.utils import secure_filename
import os
import pandas as pd
import numpy as np
import tempfile
from datetime import datetime
from fpdf import FPDF
import json
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity


manager_bp = Blueprint('manager', __name__)

UPLOAD_FOLDER = os.path.abspath('uploads')
REPORT_FOLDER = '/home/oussamaben/Desktop/school/learning/backend/reports'
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'xlsx', 'csv'}

# Ensure both folders exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(REPORT_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@manager_bp.route('/dashboard', methods=['GET'])
@manager_required
@log_activity('dashboard_view')
def manager_dashboard(user_id):
    try:
        return jsonify({
            "success": True,
            "message": "Welcome, manager!",
            "data": {
                "stats": ["test", "upload"],
                "features": ["analytics", "content-management"],
                "user_id": user_id
            }
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@manager_bp.route('/upload', methods=['GET'])
@manager_required
@log_activity('file_list_view')
def get_uploaded_files(user_id):
    try:
        uploaded_files = UploadedFile.query.filter_by(user_id=user_id).order_by(UploadedFile.upload_date.desc()).all()
        return jsonify([file.to_dict() for file in uploaded_files]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@manager_bp.route('/upload', methods=['POST'])
@manager_required
@log_activity('file_upload', details="File uploaded to system")
def upload_file(user_id):
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        try:
            filename = secure_filename(file.filename)
            # Check if the file already exists for this user
            existing_file = UploadedFile.query.filter_by(user_id=user_id, filename=filename).first()
            if existing_file:
                return jsonify({'error': 'You have already uploaded this file.'}), 400

            os.makedirs(UPLOAD_FOLDER, exist_ok=True)
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            file.save(filepath)

            new_file = UploadedFile(
                filename=filename,
                filepath=filepath,
                sheets=0,
                file_type=file.filename.rsplit('.', 1)[1].upper(),
                size=os.path.getsize(filepath),
                user_id=user_id
            )

            db.session.add(new_file)
            db.session.commit()

            return jsonify({
                'success': True,
                'message': 'File uploaded successfully',
                'file': new_file.to_dict()
            }), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

    return jsonify({'error': 'Invalid file format'}), 400

@manager_bp.route('/upload/<int:file_id>', methods=['DELETE'])
@manager_required
@log_activity('file_delete', details="File deleted from system")
def delete_file(user_id, file_id):
    try:
        file = UploadedFile.query.filter_by(id=file_id, user_id=user_id).first()

        if not file:
            return jsonify({'error': 'File not found'}), 404

        # Delete related analysis results
        from app.models.analysis_result import AnalysisResult
        try:
            # Use synchronize_session=False for performance and to avoid session issues
            AnalysisResult.query.filter_by(file_id=file_id).delete(synchronize_session=False)
        except Exception as e:
            print(f"Warning: failed to delete analysis results for file {file_id}: {e}")

        # Attempt to remove the physical file, but don't let a filesystem error prevent DB cleanup
        try:
            if file.filepath and os.path.exists(file.filepath):
                os.remove(file.filepath)
        except Exception as e:
            # Log and continue; return a more specific error message below if commit fails
            print(f"Warning: failed to remove file at {file.filepath}: {e}")

        try:
            db.session.delete(file)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f"Error committing deletion for file {file_id}: {e}")
            return jsonify({'error': f'Failed to delete file record: {str(e)}'}), 500

        return jsonify({'message': 'File and related analysis results deleted successfully'}), 200
    except Exception as e:
        # Print full traceback to server logs for debugging
        import traceback
        from flask import current_app
        tb = traceback.format_exc()
        print(f"Unhandled exception in delete_file for file {file_id}: {e}\n{tb}")
        # Return a more helpful error in debug mode, otherwise keep generic
        if current_app and getattr(current_app, 'debug', False):
            return jsonify({'error': str(e), 'traceback': tb}), 500
        else:
            return jsonify({'error': 'Internal server error'}), 500

@manager_bp.route('/analyze-excel', methods=['POST'])
@manager_required
@log_activity('excel_analysis', details="Excel file analysis performed")
def analyze_excel(user_id):
    try:
        file_id = request.json.get('file_id')
        if not file_id:
            return jsonify({"error": "File ID is required"}), 400

        file = UploadedFile.query.filter_by(id=file_id, user_id=user_id).first()
        if not file:
            return jsonify({"error": "File not found"}), 404
        
        if file.file_type.lower() not in ['xlsx', 'xls']:
            return jsonify({"error": "Only Excel files can be analyzed"}), 400
        

        try:
            # Helper to convert numpy/pandas types to JSON-serializable Python types
            def make_json_safe(obj):
                # Primitive types
                if obj is None or isinstance(obj, (str, bool)):
                    return obj
                # Numpy scalar types
                if isinstance(obj, (np.integer,)):
                    return int(obj)
                if isinstance(obj, (np.floating,)):
                    return float(obj)
                if isinstance(obj, (np.bool_ ,)):
                    return bool(obj)
                # Numbers
                if isinstance(obj, (int, float)):
                    return obj
                # Datetime-like (pandas Timestamp, datetime)
                try:
                    from datetime import datetime as _dt
                    if isinstance(obj, _dt):
                        return obj.isoformat()
                except Exception:
                    pass
                # Lists/tuples/ndarrays
                if isinstance(obj, (list, tuple, np.ndarray)):
                    return [make_json_safe(i) for i in list(obj)]
                # Dicts
                if isinstance(obj, dict):
                    new = {}
                    for k, v in obj.items():
                        try:
                            key = str(k)
                        except Exception:
                            key = repr(k)
                        new[key] = make_json_safe(v)
                    return new
                # Fallback: try to cast to str
                try:
                    return str(obj)
                except Exception:
                    return None

            df_all = pd.read_excel(file.filepath, sheet_name=None, header=None, engine="openpyxl")
            print(f"Debug: read {len(df_all)} sheets from {file.filepath}: {list(df_all.keys())}")
            result = {
                "success": True,
                "file_id": file.id,
                "filename": file.filename,
                "analyses": []
            }
            # ...existing code for analysis...
            # (Paste the analysis logic here, unchanged)
            # ...existing code for analysis...

            # If no specific analyses were detected, produce a generic per-sheet summary so the
            # frontend always has something to show. This avoids empty responses for unexpected
            # Excel layouts.
            if not result.get("analyses"):
                try:
                    for sheet_name, sheet_df in df_all.items():
                        try:
                            df = sheet_df.copy()
                            # Ensure dataframe has at least columns
                            if df.shape[1] == 0:
                                headers = []
                            else:
                                # Try to infer a header from the first row if it looks like text
                                first_row = df.iloc[0].fillna("").astype(str).tolist() if df.shape[0] > 0 else []
                                header_like = any(len(str(x).strip()) > 0 and not str(x).strip().replace(".", "", 1).isdigit() for x in first_row)
                                if header_like:
                                    headers = [str(h) if str(h) != "" else f"Col{i}" for i, h in enumerate(first_row)]
                                    data_part = df.iloc[1:]
                                else:
                                    headers = [f"Col{i}" for i in range(df.shape[1])]
                                    data_part = df

                            # Build rows sample
                            rows = []
                            if df.shape[0] > 0:
                                rows = data_part.fillna("").head(100).to_dict(orient='records')

                            # Column summary
                            columns_summary = []
                            for i, col in enumerate(df.columns):
                                col_series = df[col]
                                col_name = headers[i] if i < len(headers) else str(col)
                                columns_summary.append({
                                    "name": col_name,
                                    "type": str(col_series.dtype),
                                    "uniqueValues": int(col_series.nunique(dropna=True)),
                                    "sampleData": col_series.dropna().astype(str).head(3).tolist()
                                })

                            generic_analysis = {
                                "analysisType": "generic",
                                "sheetName": sheet_name,
                                "headers": headers,
                                "rows": rows,
                                "summary": {
                                    "totalRows": int(df.shape[0]),
                                    "columns": columns_summary
                                }
                            }
                            result["analyses"].append(generic_analysis)
                        except Exception as e:
                            print(f"Warning building fallback analysis for sheet {sheet_name}: {e}")
                except Exception as e:
                    print(f"Warning while building generic analyses: {e}")

            # If still empty, add a minimal file-level summary
            if not result.get("analyses"):
                try:
                    file_summary = {
                        "analysisType": "generic",
                        "sheetNames": list(df_all.keys()),
                        "fileInfo": {
                            "filename": file.filename,
                            "size": file.size,
                        },
                        "summary": {
                            "sheets": len(df_all)
                        }
                    }
                    result["analyses"].append(file_summary)
                except Exception as e:
                    print(f"Warning adding minimal file summary: {e}")

            # update uploaded file sheets count
            try:
                file.sheets = len(df_all)
                db.session.add(file)
                db.session.commit()
            except Exception as e:
                db.session.rollback()
                print(f"Warning updating file sheets count: {e}")

            # Sanitize analyses so they are JSON serializable (avoid numpy/pandas types)
            try:
                sanitized_analyses = [make_json_safe(a) for a in result.get('analyses', [])]
                result['analyses'] = sanitized_analyses
            except Exception as e:
                print(f"Warning sanitizing analyses: {e}")

            # Save each analysis result in the database
            print(f"Debug: total analyses to save: {len(result.get('analyses', []))}")
            if len(result.get('analyses', [])) > 0:
                try:
                    print("Debug sample analysis:", list(result['analyses'][0].keys())[:5])
                except Exception:
                    pass
            for analysis in result["analyses"]:
                # Check if result already exists for this file and analysis_type
                existing = AnalysisResult.query.filter_by(file_id=file.id, analysis_type=analysis["analysisType"]).first()
                if existing:
                    existing.result_json = analysis
                    existing.updated_at = datetime.utcnow()
                else:
                    new_result = AnalysisResult(
                        file_id=file.id,
                        analysis_type=analysis["analysisType"],
                        result_json=analysis
                    )
                    db.session.add(new_result)
            db.session.commit()

            # Final debug print to verify analyses are present before returning
            try:
                print("FINAL RESULT analyses count:", len(result.get("analyses", [])))
                if len(result.get("analyses", [])) > 0:
                    # Print a small sample of the first analysis keys to avoid huge logs
                    print("FINAL RESULT sample keys:", list(result['analyses'][0].keys()))
            except Exception as e:
                print("Error printing final result:", e)

            return jsonify(result), 200

        except Exception as e:
            import traceback as _tb
            tb = _tb.format_exc()
            print(f"Excel processing error: {str(e)}\n{tb}")
            # In debug mode return traceback to client to aid debugging
            if current_app and getattr(current_app, 'debug', False):
                return jsonify({"error": f"Excel processing error: {str(e)}", "traceback": tb}), 500
            return jsonify({"error": f"Excel processing error: {str(e)}"}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@manager_bp.route('/export-excel', methods=['POST'])
@manager_required
@log_activity('excel_export', details="Excel file exported")
def export_excel(user_id):
    tmp_path = None
    try:
        data = request.json.get('data')
        if not data:
            return jsonify({"error": "No data provided"}), 400

        with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as tmp:
            df = pd.DataFrame(data['rows'])
            df.to_excel(tmp.name, index=False, engine='openpyxl')
            tmp_path = tmp.name

        return send_file(
            tmp_path,
            as_attachment=True,
            download_name=f"analysis_{data.get('filename', 'export')}.xlsx",
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


@manager_bp.route('/analyzed-files', methods=['GET'])
@manager_required
def get_analyzed_files(user_id):
    try:
        # Return unique file_ids from analysis_results for this user's files
        analyzed = db.session.query(AnalysisResult.file_id).join(UploadedFile, UploadedFile.id==AnalysisResult.file_id)\
            .filter(UploadedFile.user_id==user_id).distinct().all()
        file_ids = [f[0] for f in analyzed]
        files = UploadedFile.query.filter(UploadedFile.id.in_(file_ids)).all()
        return jsonify([file.to_dict() for file in files]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@manager_bp.route('/analysis-result/<int:file_id>', methods=['GET'])
@manager_required
def get_analysis_result(user_id, file_id):
    try:
        file = UploadedFile.query.filter_by(id=file_id, user_id=user_id).first()
        if not file:
            return jsonify({'error': 'File not found'}), 404
        results = AnalysisResult.query.filter_by(file_id=file_id).all()
        return jsonify({'file': file.to_dict(), 'analyses': [r.result_json for r in results]}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@manager_bp.route('/generate-full-report', methods=['POST'])
@manager_required
@log_activity('full_report_generation', details="Generated full analysis report")
def generate_full_report(user_id):
    try:
        data = request.get_json()
        if not data.get('file_id'):
            return jsonify({"error": "File ID is required"}), 400

        file = UploadedFile.query.filter_by(id=data['file_id'], user_id=user_id).first()
        if not file:
            return jsonify({"error": "File not found"}), 404

        # Read and analyze the Excel file directly
        try:
            df_all = pd.read_excel(file.filepath, sheet_name=None, header=None, engine="openpyxl")
            
            analysis_data = {
                "success": True,
                "file_id": file.id,
                "filename": file.filename,
                "analyses": []
            }

            # Vulnerability Analysis
            vulnerability_analysis = None
            target_sheet_index = None
            start_row = None
            
            for sheet_name, sheet_df in df_all.items():
                for i, row in sheet_df.iterrows():
                    if 'Total' in row.values and 'High' in row.values and 'moyen' in row.values and 'faible' in row.values:
                        target_sheet_index = sheet_name
                        start_row = i
                        break
                if target_sheet_index:
                    break

            if target_sheet_index:
                sheet_df = df_all[target_sheet_index]
                header_row = sheet_df.iloc[start_row].fillna('').tolist()
                end_col = header_row.index("faible") + 1
                final_header = header_row[1:end_col]

                data_rows = []
                for i in range(start_row + 1, len(sheet_df)):
                    row = sheet_df.iloc[i]
                    if "Taux de traitement (Général)" in row.values:
                        break
                    data_rows.append(row.iloc[1:end_col].tolist())

                df = pd.DataFrame(data_rows, columns=final_header)
                df = df.dropna(how='all')

                vulnerability_analysis = {
                    "analysisType": "vulnerability",
                    "sheetName": target_sheet_index,
                    "headerRow": start_row + 1,
                    "headers": final_header,
                    "rows": df.head(100).fillna('').to_dict(orient='records'),
                    "summary": {
                        "totalRows": len(df),
                        "columns": [
                            {
                                "name": col,
                                "type": str(df[col].dtype),
                                "uniqueValues": df[col].nunique(),
                                "sampleData": df[col].dropna().head(3).tolist()
                            } for col in final_header
                        ]
                    }
                }
                analysis_data["analyses"].append(vulnerability_analysis)

            # Generate the PDF report
            report_name = f"{data.get('filename', file.filename)}_full_report"
            pdf_path = generate_full_pdf_report(
                analysis_data=analysis_data,
                file=file,
                user_id=user_id,
                report_name=report_name
            )

            # Create the report record
            report = Report(
                name=report_name,
                report_type="full",
                file_id=file.id,
                user_id=user_id,
                pdf_path=pdf_path
            )
            db.session.add(report)
            db.session.commit()

            return jsonify({
                "success": True,
                "message": "Full report generated successfully",
                "report": report.to_dict(),
                "download_url": f"/manager/download-report/{report.id}"
            }), 201

        except Exception as e:
            print(f"Error processing Excel file: {str(e)}")
            return jsonify({"error": f"Failed to process Excel file: {str(e)}"}), 500

    except Exception as e:
        db.session.rollback()
        print(f"Error generating report: {str(e)}")
        return jsonify({"error": str(e)}), 500

def generate_full_pdf_report(analysis_data, file, user_id, report_name):
    try:
        pdf = FPDF()
        pdf.add_page()
        
        # Title
        pdf.set_font("Arial", 'B', 20)
        pdf.cell(200, 20, txt="Full Analysis Report", ln=1, align="C")
        pdf.ln(10)
        
        # File Information
        pdf.set_font("Arial", 'B', 14)
        pdf.cell(200, 10, txt="File Information", ln=1, align="L")
        pdf.set_font("Arial", '', 12)
        pdf.cell(200, 10, txt=f"File Name: {file.filename}", ln=1, align="L")
        pdf.cell(200, 10, txt=f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", ln=1, align="L")
        pdf.ln(10)
        
        if analysis_data.get('analyses'):
            for analysis in analysis_data['analyses']:
                # Analysis Type Header
                pdf.set_font("Arial", 'B', 16)
                pdf.cell(200, 10, txt=f"{analysis['analysisType'].capitalize()} Analysis", ln=1, align="L")
                pdf.ln(5)
                
                # Sheet Information
                pdf.set_font("Arial", 'B', 14)
                pdf.cell(200, 10, txt="Sheet Information", ln=1, align="L")
                pdf.set_font("Arial", '', 12)
                pdf.cell(200, 10, txt=f"Sheet Name: {analysis.get('sheetName', 'N/A')}", ln=1, align="L")
                pdf.cell(200, 10, txt=f"Header Row: {analysis.get('headerRow', 'N/A')}", ln=1, align="L")
                pdf.ln(5)
                
                # Summary Information
                if analysis.get('summary'):
                    pdf.set_font("Arial", 'B', 14)
                    pdf.cell(200, 10, txt="Summary", ln=1, align="L")
                    pdf.set_font("Arial", '', 12)
                    pdf.cell(200, 10, txt=f"Total Rows: {analysis['summary'].get('totalRows', 'N/A')}", ln=1, align="L")
                    
                    # Column Information
                    if analysis['summary'].get('columns'):
                        pdf.ln(5)
                        pdf.set_font("Arial", 'B', 12)
                        pdf.cell(200, 10, txt="Column Analysis:", ln=1, align="L")
                        pdf.set_font("Arial", '', 12)
                        for col in analysis['summary']['columns']:
                            pdf.cell(200, 10, txt=f"- {col['name']}: {col['uniqueValues']} unique values", ln=1, align="L")
                
                # Chart Data Analysis
                if analysis.get('chartData'):
                    pdf.ln(5)
                    pdf.set_font("Arial", 'B', 14)
                    pdf.cell(200, 10, txt="Key Findings", ln=1, align="L")
                    pdf.set_font("Arial", '', 12)
                    
                    for chart_name, chart in analysis['chartData'].items():
                        if 'title' in chart:
                            pdf.cell(200, 10, txt=f"- {chart['title']}", ln=1, align="L")
                            if 'data' in chart and 'labels' in chart:
                                # Calculate total for percentage
                                total = sum(chart['data'])
                                for label, value in zip(chart['labels'], chart['data']):
                                    percentage = (value / total * 100) if total > 0 else 0
                                    pdf.cell(200, 10, txt=f"  • {label}: {value} ({percentage:.1f}%)", ln=1, align="L")
                
                # Sample Data
                if analysis.get('rows'):
                    pdf.ln(5)
                    pdf.set_font("Arial", 'B', 14)
                    pdf.cell(200, 10, txt="Sample Data", ln=1, align="L")
                    pdf.set_font("Arial", '', 12)
                    
                    # Get headers
                    headers = analysis.get('headers', [])
                    if headers:
                        # Calculate column widths
                        col_width = 190 / len(headers)  # 190mm is the usable width
                        
                        # Print header row
                        pdf.set_font("Arial", 'B', 12)
                        for header in headers:
                            pdf.cell(col_width, 10, txt=str(header), border=1, align='C')
                        pdf.ln()
                        
                        # Print first 5 rows of data
                        pdf.set_font("Arial", '', 12)
                        for row in analysis['rows'][:5]:
                            for header in headers:
                                value = str(row.get(header, ''))
                                # Truncate long values
                                if len(value) > 20:
                                    value = value[:17] + "..."
                                pdf.cell(col_width, 10, txt=value, border=1, align='C')
                            pdf.ln()
                
                pdf.ln(10)
                
                # Add a page break between analyses
                if analysis != analysis_data['analyses'][-1]:
                    pdf.add_page()
        
        # Save the PDF
        filename = secure_filename(f"{report_name}_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf")
        filepath = os.path.join(REPORT_FOLDER, filename)
        
        # Ensure the directory exists
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        # Save the PDF
        pdf.output(filepath)
        
        # Verify the file was created
        if not os.path.exists(filepath):
            raise Exception("Failed to create PDF file")
            
        return filepath
        
    except Exception as e:
        print(f"Error generating PDF report: {str(e)}")
        raise Exception(f"Failed to generate PDF report: {str(e)}")

@manager_bp.route('/reports', methods=['GET'])
@manager_required
@log_activity('report_list_view')
def get_reports(user_id):
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        
        print(f"Fetching reports for user {user_id}")
        reports = Report.query.filter_by(user_id=user_id)\
                            .order_by(Report.created_at.desc())\
                            .paginate(page=page, per_page=per_page, error_out=False)
        
        reports_list = [report.to_dict() for report in reports.items]
        print(f"Found {len(reports_list)} reports")
        for report in reports_list:
            print(f"Report: {report['name']}, Type: {report['type']}, Created: {report['created_at']}")
        
        return jsonify({
            'success': True,
            'reports': reports_list,
            'total': reports.total,
            'pages': reports.pages,
            'current_page': reports.page,
            'per_page': reports.per_page
        }), 200
    except Exception as e:
        print(f"Error fetching reports: {str(e)}")
        return jsonify({'error': str(e)}), 500

@manager_bp.route('/download-report/<int:report_id>', methods=['GET'])
@manager_required
def download_report(user_id, report_id):
    try:
        # Get the report
        report = Report.query.filter_by(id=report_id, user_id=user_id).first()
        if not report:
            return jsonify({"error": "Report not found"}), 404
        
        if not os.path.exists(report.pdf_path):
            return jsonify({"error": "Report file not found"}), 404

        return send_file(
            report.pdf_path,
            as_attachment=True,
            download_name=f"{report.name}.pdf",
            mimetype='application/pdf'
        )
    except Exception as e:
        print(f"Error downloading report: {str(e)}")
        return jsonify({"error": str(e)}), 500

@manager_bp.route('/activity-logs', methods=['GET'])
@manager_required
def get_activity_logs(user_id):
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        logs = ActivityLog.query.filter_by(user_id=user_id)\
                              .order_by(ActivityLog.timestamp.desc())\
                              .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'success': True,
            'logs': [log.to_dict() for log in logs.items],
            'total': logs.total,
            'pages': logs.pages,
            'current_page': logs.page,
            'per_page': logs.per_page
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@manager_bp.route('/activity-logs/<int:log_id>', methods=['DELETE'])
@manager_required
def delete_activity_log(user_id, log_id):
    try:
        log = ActivityLog.query.filter_by(id=log_id, user_id=user_id).first()
        
        if not log:
            return jsonify({'success': False, 'error': 'Log not found'}), 404
            
        db.session.delete(log)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Activity log deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@manager_bp.route('/analysis-status/<int:file_id>', methods=['GET', 'OPTIONS'])
@manager_required
def get_analysis_status(user_id, file_id):
    file = UploadedFile.query.filter_by(id=file_id, user_id=user_id).first()
    if not file:
        return jsonify({'status': 'not_analyzed'}), 404
    result = AnalysisResult.query.filter_by(file_id=file_id).first()
    if result:
        return jsonify({'status': 'done'})
    else:
        return jsonify({'status': 'not_analyzed'})