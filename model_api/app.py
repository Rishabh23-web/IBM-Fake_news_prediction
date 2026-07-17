from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import os
import re
import nltk
from nltk.corpus import stopwords
from nltk.stem.porter import PorterStemmer

# Download stopwords (will only download if missing)
nltk.download('stopwords', quiet=True)

app = Flask(__name__)
CORS(app)

# Initialize stemmer
ps = PorterStemmer()

def stemming(content):
    stemmed_content = re.sub('[^a-zA-Z]', ' ', content)
    stemmed_content = stemmed_content.lower()
    stemmed_content = stemmed_content.split()
    stemmed_content = [ps.stem(word) for word in stemmed_content if word not in stopwords.words('english')]
    stemmed_content = " ".join(stemmed_content)
    return stemmed_content

# Paths to models
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")
VECTORIZER_PATH = os.path.join(BASE_DIR, "vectorizer.pkl")

# Load models safely
try:
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)
    with open(VECTORIZER_PATH, "rb") as f:
        vectorizer = pickle.load(f)
    print("Model and vectorizer loaded successfully.")
except Exception as e:
    print(f"Error loading models: {e}")
    model, vectorizer = None, None

@app.route("/predict", methods=["POST"])
def predict():
    if model is None or vectorizer is None:
        return jsonify({"error": "Models not loaded on the server"}), 500

    data = request.get_json()
    if not data or "text" not in data:
        return jsonify({"error": "No text provided"}), 400

    text = data["text"]
    
    try:
        # Preprocess text (stemming) just like in the training notebook
        processed_text = stemming(text)
        
        # Transform text
        vectorized_text = vectorizer.transform([processed_text])
        # Predict probabilities
        probabilities = model.predict_proba(vectorized_text)[0]
        
        # probabilities array is usually [prob_class_0, prob_class_1] 
        # In WELFake dataset: 0 = Real, 1 = Fake
        prob_real = probabilities[0]
        prob_fake = probabilities[1]
        
        if prob_real > prob_fake:
            result = "Real"
            confidence = round(prob_real * 100, 2)
        else:
            result = "Fake"
            confidence = round(prob_fake * 100, 2)
        
        return jsonify({
            "prediction": result,
            "confidence": confidence
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5000, debug=True)
