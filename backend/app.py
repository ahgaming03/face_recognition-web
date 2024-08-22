from face_recognition import process_frame
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import cv2
# import numpy as np
import os
import time

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/api/upload', methods=['POST'])
def upload_video():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    filepath = os.path.join(UPLOAD_FOLDER, f'video_{int(time.time())}.{file.filename.split(".")[-1]}')
    file.save(filepath)
    
    processed_path = detect(filepath)
    
    return jsonify({'processed_video_url': f'/processed/{os.path.basename(processed_path)}'})

def detect(video_path):
    cap = cv2.VideoCapture(video_path)
    output_path = os.path.join(PROCESSED_FOLDER, 'processed_' + os.path.basename(video_path).split('.')[0] + '.webm')
    fourcc = cv2.VideoWriter_fourcc(*'vp80')
    out = cv2.VideoWriter(output_path, fourcc, 20.0, (int(cap.get(3)), int(cap.get(4))))
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        frame = process_frame(frame)
        
        out.write(frame)
    
    cap.release()
    out.release()
    cv2.destroyAllWindows()
    
    return output_path
    # return "temp"

@app.route('/processed/<filename>')
def serve_processed_video(filename):
    return send_from_directory(PROCESSED_FOLDER, filename)

if __name__ == '__main__':
    app.run(debug=True)
