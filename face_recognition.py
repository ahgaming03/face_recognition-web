from architecture import *
import cv2
import numpy as np
import mtcnn
from sklearn.preprocessing import Normalizer
from scipy.spatial.distance import cosine
# from keras.models import load_model
import pickle

# Configurations
confidence_t = 0.99
recognition_t = 0.5
required_size = (160, 160)

# Load face encoder model
face_encoder = InceptionResNetV2()
path_m = "facenet_keras.h5"
face_encoder.load_weights(path_m)

# Load face detector
face_detector = mtcnn.MTCNN()

# Load encoding dictionary
encodings_path = 'encodings_1724302233.pkl'
def load_pickle(path):
    with open(path, 'rb') as f:
        encoding_dict = pickle.load(f)
    return encoding_dict

encoding_dict = load_pickle(encodings_path)

# Normalizer
l2_normalizer = Normalizer('l2')

# Function to normalize the face
def normalize(img):
    mean, std = img.mean(), img.std()
    return (img - mean) / std

# Function to get face from bounding box
def get_face(img, box):
    x1, y1, width, height = box
    x1, y1 = abs(x1), abs(y1)
    x2, y2 = x1 + width, y1 + height
    face = img[y1:y2, x1:x2]
    return face, (x1, y1), (x2, y2)

# Function to get face encoding
def get_encode(face_encoder, face, size):
    face = normalize(face)
    face = cv2.resize(face, size)
    encode = face_encoder.predict(np.expand_dims(face, axis=0))[0]
    return encode

# Function to detect faces and recognize them
def detect(img, detector, encoder, encoding_dict):
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    results = detector.detect_faces(img_rgb)
    for res in results:
        if res['confidence'] < confidence_t:
            continue
        face, pt_1, pt_2 = get_face(img_rgb, res['box'])
        encode = get_encode(encoder, face, required_size)
        encode = l2_normalizer.transform(encode.reshape(1, -1))[0]
        name = 'unknown'

        distance = float("inf")
        for db_name, db_encode in encoding_dict.items():
            dist = cosine(db_encode, encode)
            if dist < recognition_t and dist < distance:
                name = db_name
                distance = dist

        if name == 'unknown':
            cv2.rectangle(img, pt_1, pt_2, (0, 0, 255), 2)
            cv2.putText(img, name, pt_1, cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 1)
        else:
            cv2.rectangle(img, pt_1, pt_2, (0, 255, 0), 2)
            cv2.putText(img, name, (pt_1[0], pt_1[1] - 5), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
    return img


def process_frame(frame):
    frame = detect(frame, face_detector, face_encoder, encoding_dict)
    return frame
