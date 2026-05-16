from flask import Flask, render_template, request, jsonify
from catcare_prototype import DISEASE_DB, analyze_cat_health
import os
from openai import OpenAI
from dotenv import load_dotenv
from flask_cors import CORS

# Load environment variables dari file .env
load_dotenv()

app = Flask(__name__)
CORS(app) # Mengizinkan frontend React (Vite) untuk memanggil API ini
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Setup API Key Groq (Diambil dari System Environment nantinya)
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
# Kita pindahkan inisialisasi client ke dalam route agar bisa mendeteksi perubahan .env tanpa restart server
ai_client = None

# --- INSTRUKSI API KEY UNTUK DEPLOYMENT ---
# Untuk menjalankan fitur chatbot:
# 1. Dapatkan API Key gratis di https://console.groq.com/keys
# 2. Masukkan ke file .env: GROQ_API_KEY="gsk_xxx" 

# Modifikasi sedikit fungsi scoring agar mengembalikan dictionary hasil, bukan cuma print
def get_prediction(image_path, deskripsi_gejala):
    # KITA HARUS MEMANGGIL FUNGSI YANG SUDAH DIPERBARUI DARI PROTOYPE
    # Sebelumnya fungsi get_prediction punya logika sendiri yang konflik dengan logikamu
    return analyze_cat_health(image_path, deskripsi_gejala)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    if 'foto' not in request.files:
        return jsonify({"error": "Tidak ada foto yang diunggah"})
        
    foto = request.files['foto']
    gejala = request.form.get('gejala', '')
    
    if foto.filename == '':
        return jsonify({"error": "Pilih foto terlebih dahulu"})
        
    # Simpan foto sementara
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], foto.filename)
    foto.save(filepath)
    
    # Jalankan prediksi
    hasil = analyze_cat_health(filepath, gejala)
    
    return jsonify(hasil)

# --- FITUR CHATBOT DR. CATCARE ---
@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.json.get('message', '')
    
    if not user_message:
        return jsonify({"response": "Pesan tidak boleh kosong."})
        
    # Reload dotenv untuk memastikan perubahan file .env terbaca tanpa harus merestart terminal
    load_dotenv()
    api_key = os.environ.get("GROQ_API_KEY", "")
    
    if not api_key:
        return jsonify({"response": "🤖 Dr. CatCare (Sistem): Maaf, fitur dokter virtual belum aktif karena API Key Groq belum dimasukkan. Dapatkan token gratis di https://console.groq.com, dan tambahkan GROQ_API_KEY ke file .env."})
        
    try:
        # Panggil client secara dinamis
        client = OpenAI(
            api_key=api_key, 
            base_url="https://api.groq.com/openai/v1"
        )
        
        # Prompt Rahasia (System Prompt) agar AI menjadi Spesialis Kucing
        system_prompt = """
        Kamu adalah "Dr. CatCare", seorang dokter hewan yang sangat profesional, ramah, dan spesialis murni pada pengobatan dan perawatan kucing.
        Tugas utamamu:
        1. Menjawab pertanyaan terkait kesehatan, gejala penyakit, makanan, dan perilaku KUCING.
        2. Berikan penjelasan tentang penyakit secara ringkas dan tidak menakut-nakuti, namun tetap tegas jika kondisinya darurat (seperti FLUTD atau Panleukopenia).
        3. Selalu sarankan pemilik untuk membawa kucingnya ke dokter hewan / klinik terdekat untuk diagnosis pasti, posisikan dirimu sebagai penganalisa medis awal secara online.
        4. JANGAN PERNAH menjawab pertanyaan yang tidak ada hubungannya dengan kucing (misal: anjing, politik, coding, matematika). Jika ditanya di luar kucing, tolak dengan sopan dan katakan kamu hanya dokter spesialis kucing.
        Gunakan gaya bahasa santai tapi medis (seperti dokter hewan muda di Indonesia).
        """
        
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ]
        )
        
        reply = response.choices[0].message.content
        return jsonify({"response": reply})
        
    except Exception as e:
        return jsonify({"response": f"Terjadi kesalahan pada sistem AI: {str(e)}"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
