import os
import json
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import JSON

# --- SOLUCIÓN DE CODIFICACIÓN (WINDOWS) ---
os.environ["PGCLIENTENCODING"] = "utf-8"

# --- CONFIGURACIÓN BD ---
DB_URI = 'postgresql://postgres:postgres@localhost:5432/bookmate_db'

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

SPRING_STATIC_DIR = os.path.join(BASE_DIR, '..', 'basic-springboot', 'src', 'main', 'resources', 'static')
JSON_FILE = os.path.join(SPRING_STATIC_DIR, 'assets', 'data', 'books.json')

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = DB_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# --- MODELO ---
class Book(db.Model):
    __tablename__ = 'books'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    author = db.Column(db.String(255), nullable=False)
    year = db.Column(db.Integer)
    genre = db.Column(db.String(100))
    pages = db.Column(db.Integer)
    rating = db.Column(db.Float)
    reviews_count = db.Column(db.Integer)
    cover = db.Column(db.String(500))
    synopsis = db.Column(db.Text)
    isbn = db.Column(db.String(20))
    tags = db.Column(JSON) 

# --- CARGA DE DATOS ---
def seed_database():
    if not os.path.exists(JSON_FILE):
        print(f" [ERROR] No encuentro el archivo en: {JSON_FILE}")
        print("Asegúrate de que la ruta sea correcta.")
        return

    with app.app_context():
        try:
            print("[INFO] Limpiando base de datos...")
            db.drop_all()
            print("[INFO] Creando tablas...")
            db.create_all()

            print(f"[INFO] Leyendo archivo REAL: {JSON_FILE}")
            with open(JSON_FILE, 'r', encoding='utf-8') as f:
                books_data = json.load(f)

            # Depuración de IDs
            ids = [b.get('id') for b in books_data]
            print(f"🔍 Se encontraron {len(ids)} libros. IDs: {ids}")

            print(f"[INFO] Insertando {len(books_data)} libros...")
            for b in books_data:
                new_book = Book(
                    id=b.get('id'), #type:ignore
                    title=b.get('title'),#type:ignore
                    author=b.get('author'),#type:ignore
                    year=b.get('year'),#type:ignore
                    genre=b.get('genre'),#type:ignore
                    pages=b.get('pages'),#type:ignore
                    rating=b.get('rating'),#type:ignore
                    reviews_count=b.get('reviews_count'),#type:ignore
                    cover=b.get('cover'),#type:ignore
                    synopsis=b.get('synopsis'),#type:ignore
                    isbn=b.get('isbn'),#type:ignore
                    tags=b.get('tags')#type:ignore
                )
                db.session.add(new_book)
            
            db.session.commit()
            print("[SUCCESS] ¡Base de datos actualizada con tus cambios de Spring Boot!")
            
        except Exception as e:
            print(f" ERROR: {e}")

if __name__ == '__main__':
    seed_database()