import os
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity



os.environ["PGCLIENTENCODING"] = "utf-8"

# --- CONFIGURACIÓN DE BASE DE DATOS ---
DB_HOST = os.getenv('DB_HOST', 'localhost') 
DB_URI = f'postgresql://postgres:postgres@{DB_HOST}:5432/bookmate_db'

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = DB_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
CORS(app) 
db = SQLAlchemy(app)

# Modelo espejo (Solo lectura para la IA)
class Book(db.Model):
    __tablename__ = 'books'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255))
    author = db.Column(db.String(255))
    genre = db.Column(db.String(100))
    synopsis = db.Column(db.Text)
    rating = db.Column(db.Float)
    tags = db.Column(db.Text)

# --- MOTOR DE IA ---
class AIRecommender:
    def __init__(self):
        self.vectorizer = None
        self.tfidf_matrix = None
        self.books_cache = []
        self.id_to_index = {}
        self.train_model()

    def train_model(self):
        with app.app_context():
            print("[IA] Conectando a Postgres para entrenar modelo...")
            try:
                books = Book.query.all()
                self.books_cache = [{
                    'id': b.id, 
                    'title': b.title, 
                    'author': b.author, 
                    'genre': b.genre, 
                    'synopsis': b.synopsis,
                    'rating': b.rating,
                    'tags': b.tags
                } for b in books]
                
                if not self.books_cache: 
                    print("[WARN] No hay libros en la BD para entrenar.")
                    return

                # Mapeo ID -> Índice
                self.id_to_index = {b['id']: i for i, b in enumerate(self.books_cache)}

                # Entrenar TF-IDF
                corpus = [f"{b['genre']} {b['synopsis']} {b['title']}" for b in self.books_cache]
                self.vectorizer = TfidfVectorizer(stop_words=None) 
                self.tfidf_matrix = self.vectorizer.fit_transform(corpus)
                
                print(f"[IA] Modelo entrenado exitosamente con {len(self.books_cache)} libros.")
                
            except Exception as e:
                print(f"[ERROR] Falló el entrenamiento: {e}")

    def get_recommendations(self, user_selected_ids, limit=3):
        if self.tfidf_matrix is None or not self.books_cache:
            return []

        selected_indices = []
        selected_books_data = []
        
        for book_id in user_selected_ids:
            if book_id in self.id_to_index:
                idx = self.id_to_index[book_id]
                selected_indices.append(idx)
                selected_books_data.append(self.books_cache[idx])

        if not selected_indices:
            return []

        # Vector promedio del usuario
        user_profile = np.asarray(self.tfidf_matrix[selected_indices].mean(axis=0)) #type:ignore
        similarities = cosine_similarity(user_profile, self.tfidf_matrix).flatten()
        related_indices = similarities.argsort()[::-1]

        # --- LÓGICA MEJORADA DE GÉNEROS ---
        user_authors = set(b['author'] for b in selected_books_data)
        
        # Extraer todos los géneros individuales del usuario
        user_genres = set()
        for b in selected_books_data:
            g_str = b.get('genre', '')
            if g_str:
                # Separamos por coma y quitamos espacios
                parts = [g.strip() for g in g_str.split(',')]
                user_genres.update(parts)

        recommendations = []
        for i in related_indices:
            book = self.books_cache[i]
            
            if book['id'] in user_selected_ids: continue

            score = float(similarities[i])
            if score <= 0.0: continue

            reasons = []
            reasons.append(f"Trama similar: {int(score*100)}%")
            
            # Verificar autor
            if book['author'] in user_authors:
                reasons.append(f"Autor: {book['author']}")
            
            # Verificar géneros (Múltiples)
            book_genres = [bg.strip() for bg in book.get('genre', '').split(',')]
            # Si ALGUNO de los géneros del libro coincide con los del usuario
            matching_genres = [bg for bg in book_genres if bg in user_genres]
            
            if matching_genres:
                # Mostramos el primer género que coincida
                reasons.append(f"Género: {matching_genres[0]}")
            
            if book['rating'] and book['rating'] >= 4.6:
                reasons.append(f"Calidad: {book['rating']}★")

            recommendations.append({
                "book": book,
                "score": int(score * 100),
                "reasons": reasons
            })

            if len(recommendations) >= limit: break
        
        return recommendations

# --- INICIALIZAR Y RUTAS ---
ai_engine = AIRecommender()

@app.route('/api/recommendations', methods=['POST'])
def recommend():
    data = request.json
    raw_ids = data.get('book_ids', [])#type:ignore
    
    if not raw_ids:
        return jsonify([])

    try:
        # CONVERSIÓN VITAL: Texto -> Enteros
        book_ids = [int(x) for x in raw_ids]
        
        results = ai_engine.get_recommendations(book_ids)
        return jsonify(results)
    except Exception as e:
        print(f"[ERROR] Recomendación fallida: {e}")
        return jsonify([])

@app.route('/api/status')
def status():
    return jsonify({
        "status": "online", 
        "books_loaded": len(ai_engine.books_cache),
        "service": "Python AI Microservice"
    })

if __name__ == '__main__':
    print(" Servicio de IA (Puerto 5000) Conectado a PostgreSQL...")
    app.run(host='0.0.0.0', port=5000, debug=True)