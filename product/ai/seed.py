import os
import json
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import JSON

# --- SOLUCIÓN DE CODIFICACIÓN (WINDOWS) ---
os.environ["PGCLIENTENCODING"] = "utf-8"

# --- CONFIGURACIÓN INTELIGENTE (Docker vs Local) ---
# 1. BASE DE DATOS: Si Docker nos da una URL, la usamos. Si no, usamos localhost.
DB_URI = os.environ.get('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/bookmate_db')

# 2. RUTAS DE ARCHIVO:
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Ruta A: Archivo local (Para Docker, ya que copiamos books.json aquí)
LOCAL_JSON_PATH = os.path.join(BASE_DIR, 'books.json')

# Ruta B: Ruta relativa (Para desarrollo local en tu PC)
DEV_JSON_PATH = os.path.join(BASE_DIR, '..', 'basic-springboot', 'src', 'main', 'resources', 'static', 'assets', 'data', 'books.json')

# Decisión automática:
if os.path.exists(LOCAL_JSON_PATH):
    JSON_FILE = LOCAL_JSON_PATH
    print(f"📂 MODO DOCKER DETECTADO: Usando {JSON_FILE}")
else:
    JSON_FILE = DEV_JSON_PATH
    print(f"💻 MODO LOCAL DETECTADO: Usando {JSON_FILE}")

# --- INICIALIZACIÓN APP ---
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
        print("Asegúrate de haber copiado books.json a la carpeta 'ai' si estás en Docker.")
        return

    with app.app_context():
        try:
            print(f"[INFO] Conectando a BD: {DB_URI}")
            print("[INFO] Limpiando base de datos...")
            db.drop_all()
            print("[INFO] Creando tablas...")
            db.create_all()

            print(f"[INFO] Leyendo archivo: {JSON_FILE}")
            with open(JSON_FILE, 'r', encoding='utf-8') as f:
                books_data = json.load(f)

            # Depuración de IDs
            ids = [b.get('id') for b in books_data]
            print(f"🔍 Se encontraron {len(ids)} libros.")

            print(f"[INFO] Insertando {len(books_data)} libros...")
            for b in books_data:
                new_book = Book(
                    id=b.get('id'),
                    title=b.get('title'),
                    author=b.get('author'),
                    year=b.get('year'),
                    genre=b.get('genre'),
                    pages=b.get('pages'),
                    rating=b.get('rating'),
                    reviews_count=b.get('reviews_count'),
                    cover=b.get('cover'),
                    synopsis=b.get('synopsis'),
                    isbn=b.get('isbn'),
                    tags=b.get('tags')
                )
                db.session.add(new_book)
            
            db.session.commit()
            print("[SUCCESS] ¡Base de datos actualizada correctamente!")
            
        except Exception as e:
            print(f" ERROR CRÍTICO: {e}")

if __name__ == '__main__':
    seed_database()