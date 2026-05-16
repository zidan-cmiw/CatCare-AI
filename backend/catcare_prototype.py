import re
import json
import os
import difflib
from google import genai
from PIL import Image

# Setup Gemini AI Vision
def setup_gemini():
    gemini_api_key = os.environ.get("GEMINI_API_KEY", "")
    if gemini_api_key:
        return genai.Client(api_key=gemini_api_key)
    return None

gemini_client = setup_gemini()

# Nama file database dinamis
DB_FILE = "database_kucing.json"

# Data Default (akan di-generate menjadi JSON jika file belum ada)
DEFAULT_DISEASE_DB = {
    "Feline Panleukopenia (Virus Penyakit Fatal)": {
        "gejala": {"muntah": 3, "lemas": 2, "tidak mau makan": 2, "diare": 3, "demam": 2},
        "rekomendasi": "Tingkat Risiko SANGAT TINGGI! Segera dibawa ke rumah sakit hewan.",
        "max_score": 12
    },
    "Feline Calicivirus / Rhinotracheitis (Flu Kucing Berat)": {
        "gejala": {"mata berair": 2, "hidung berair": 2, "bersin": 2, "lemas": 1, "tidak mau makan": 2, "demam": 1, "sariawan": 3, "ngeces": 2},
        "rekomendasi": "Bersihkan area mata dan hidung yang kotor dan berair, dan konsultasi ke dokter hewan.",
        "max_score": 15
    },
    "Jamur Kulit / Ringworm / Scabies": {
        "gejala": {"gatal": 3, "botak": 3, "kulit berkerak": 2},
        "rekomendasi": "Pisahkan kucing dari hewan lain. Gunakan sampo anti-jamur atau obat tetes kutu sesuai resep vet.",
        "max_score": 8
    },
    "Keracunan (Toxikosis)": {
        "gejala": {"muntah": 3, "ngeces": 3, "kejang": 4, "lemas": 2},
        "rekomendasi": "DARURAT MEDIS. Jangan paksa muntah sendiri, bawa segera ke klinik!",
        "max_score": 12
    },
    "Trauma Mata / Ulkus Kornea (Infeksi Mata Berat)": {
        "gejala": {"mata berdarah": 4, "mata berair": 2, "lemas": 1},
        "rekomendasi": "DARURAT MEDIS. Mata berdarah bisa karena benturan keras, luka cakar, atau infeksi Chlamydia/Herpes parah. Segera bawa ke vet agar tidak buta permanen!",
        "max_score": 7
    },
    "Feline Infectious Peritonitis (FIP)": {
        "gejala": {"perut buncit": 4, "lemas": 2, "demam": 2, "tidak mau makan": 2, "sesak napas": 3},
        "rekomendasi": "Kondisi sangat serius. Perlu diagnosis pasti vet lewat tes lab.",
        "max_score": 13
    },
    "FLUTD (Masalah Saluran Kemih)": {
        "gejala": {"susah pipis": 4, "pipis berdarah": 4, "lemas": 1, "tidak mau makan": 1},
        "rekomendasi": "DARURAT MEDIS! Bebahaya jika kucing jantan tidak bisa kencing, segera ke Vet!",
        "max_score": 10
    }
}

DEFAULT_SYMPTOMS = {
    "muntah": ["muntah", "keluar makanan", "huek", "muntaber", "muntahin"],
    "diare": ["diare", "mencret", "cair", "berak air", "pup cair"],
    "lemas": ["lemas", "lesu", "lelah", "capek", "loyo", "tidur terus", "lemet"],
    "tidak mau makan": ["tidak mau makan", "gak mau makan", "mogok makan", "puasa"],
    "mata berair": ["mata berair", "belekan", "mata merah", "keluar air dari mata"],
    "hidung berair": ["pilek", "flu", "ingusan", "hidung meler", "meler"],
    "gatal": ["gatal", "garuk", "menggaruk"],
    "botak": ["botak", "rontok", "pitak"],
    "kejang": ["kejang", "gemetar", "tremor", "kaku"],
    "ngeces": ["ngeces", "keluar air liur", "iler", "mulut berbusa"],
    "mata berdarah": ["darah dari mata", "berdarah matanya", "mata keluar darah", "mata berdarah"]
}

# Fungsi untuk memuat atau membuat Self-Learning Database
def load_database():
    if not os.path.exists(DB_FILE):
        with open(DB_FILE, 'w') as f:
            json.dump({"diseases": DEFAULT_DISEASE_DB, "synonyms": DEFAULT_SYMPTOMS}, f, indent=4)
        return DEFAULT_DISEASE_DB, DEFAULT_SYMPTOMS
    with open(DB_FILE, 'r') as f:
        data = json.load(f)
        return data.get("diseases", DEFAULT_DISEASE_DB), data.get("synonyms", DEFAULT_SYMPTOMS)

def save_database(diseases, synonyms):
    with open(DB_FILE, 'w') as f:
        json.dump({"diseases": diseases, "synonyms": synonyms}, f, indent=4)

DISEASE_DB, SYMPTOM_SYNONYMS = load_database()

# 3. Model Gambar (Gemini Vision AI)
def analyze_cat_image_gemini(image_path):
    if not image_path or not os.path.exists(image_path):
        return []

    # Cek apakah client Gemini sudah berhasil disetup
    global gemini_client
    if gemini_client is None:
        gemini_client = setup_gemini()
        if gemini_client is None:
            print("Peringatan: GEMINI_API_KEY tidak dikonfigurasi. Lewati analisis gambar.")
            return []

    try:
        img = Image.open(image_path)
        
        # Ekstrak semua list gejala standar dari database untuk memandu AI
        gejala_standar = list(SYMPTOM_SYNONYMS.keys())
        prompt = (
            f"Kamu adalah Dokter Hewan Spesialis Kucing (Veterinarian AI) yang sangat teliti dan objektif. "
            f"Tugasmu menganalisis gambar kucing ini untuk mencari tanda-tanda penyakit FISIK yang SANGAT JELAS.\n"
            f"ATURAN KERAS: \n"
            f"1. JANGAN menebak kucing 'lemas', 'mati', atau 'kurus' hanya karena ia sedang tidur, berbaring, atau karena angle foto.\n"
            f"2. JANGAN menebak gejala jika kamu tidak yakin 100% melihatnya di foto.\n"
            f"3. Pilih HANYA gejala dari daftar ini yang BENAR-BENAR TERLIHAT JELAS secara visual: {', '.join(gejala_standar)}.\n"
            f"4. Jika kucing terlihat normal atau fotonya tidak menunjukkan luka/penyakit fisik secara jelas, BISA SAJA jawab kosong.\n"
            f"Format jawaban: HANYA list gejala yang dipisah koma (contoh: mata berair, botak, kulit berkerak) tanpa penjelasan lain."
        )

        # Gunakan client baru untuk memanggil model gemini-1.5-flash
        response = gemini_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[prompt, img]
        )
        hasil = response.text.lower()
        
        gejala_visual = []
        for gejala in gejala_standar:
            if gejala in hasil:
                gejala_visual.append(gejala)
                
        print(f"Hasil Vision AI dari gambar: {gejala_visual}")
        return gejala_visual
    except Exception as e:
        print(f"Error pada Gemini Vision AI: {e}")
        return []

# 4. Engine AI Hibrida yang Jauh Lebih Akurat untuk Web API
def analyze_cat_health(image_path, deskripsi_gejala):
    global SYMPTOM_SYNONYMS
    
    # Hapus tanda baca dari input user agar kata lebih bersih
    clean_text = re.sub(r'[^\w\s]', '', deskripsi_gejala.lower())
    words_in_input = clean_text.split()
    
    gejala_ditemukan = set()
    database_diperbarui = False
    
    # Kumpulkan semua kosakata murni dari sistem AI
    semua_kosakata = []
    untuk_gejala = {}
    for std_symp, keywords in SYMPTOM_SYNONYMS.items():
        for kw in keywords:
            semua_kosakata.append(kw)
            untuk_gejala[kw] = std_symp

    # Sistem Pembelajaran Mandiri (Auto-Learning) & Ekstraksi NLP
    # AI akan mengecek kata ke kata
    for word in words_in_input:
        if len(word) < 4: continue # Abaikan kata sambung pendek (dan, di, ke, dsb)
        
        # Cari kemiripan kata (Typo Detection / Slang Detection)
        # cut-off 0.82 berarti kecocokan huruf minimal 82%
        mirip = difflib.get_close_matches(word, semua_kosakata, n=1, cutoff=0.82)
        
        if mirip:
            kata_dikenali = mirip[0]
            gejala_asli = untuk_gejala[kata_dikenali]
            gejala_ditemukan.add(gejala_asli)
            
            # Jika user memasukkan kata baru (typo dikit) yg belum ada persis di DB, masukkan!
            if word not in SYMPTOM_SYNONYMS[gejala_asli]:
                SYMPTOM_SYNONYMS[gejala_asli].append(word)
                semua_kosakata.append(word)
                untuk_gejala[word] = gejala_asli
                database_diperbarui = True
                print(f"[AI Learning] Menambahkan kosakata baru: '{word}' berafiliasi dengan '{gejala_asli}'")

    # Deteksi Multi-kata (seperti "tidak mau makan")
    for standard_symp, keywords in SYMPTOM_SYNONYMS.items():
        for kw in keywords:
            # Perbaiki agar pencarian multi-kata juga lebih pintar
            if kw in clean_text:
                gejala_ditemukan.add(standard_symp)
            elif all(word in clean_text for word in kw.split()):
                # Jika user mengetip "keluar darah dari mata" (kata-katanya terbalik/terpisah tapi ada semua)
                gejala_ditemukan.add(standard_symp)

    # Simpan database jika ada kosakata baru yang dipelajari
    if database_diperbarui:
        save_database(DISEASE_DB, SYMPTOM_SYNONYMS)

    # Gabungkan dengan gejala visual dari Gemini
    gejala_visual = analyze_cat_image_gemini(image_path)
    for g_visual in gejala_visual:
        gejala_ditemukan.add(g_visual)

    gejala_list = list(gejala_ditemukan)

    # Sistem Scoring dan Kalkulasi Probabilitas Realistis
    scores = {}
    for disease, data in DISEASE_DB.items():
        score = 0
        for symp in gejala_list:
            if symp in data["gejala"]:
                score += data["gejala"][symp]
                
        if score > 0:
            # Algoritma konversi persentase yang cerdas (Maks 99%)
            confidence = min((score / data["max_score"]) * 100, 99.0)
            
            # Tambahan ketepatan: Penalti atau Bonus Kombinasi
            if len(gejala_list) >= 3 and score >= 4:
                confidence = min(confidence + 15.0, 99.0)

            scores[disease] = confidence
            
    if not scores:
        return {
            "disease": "Gejala Tidak Spesifik / Ringan",
            "symptoms": gejala_list if gejala_list else ["Tidak dikenali AI"],
            "recommendation": "Sistem kesulitan mengidentifikasi penyakit secara detil. Pastikan kucing tetap terhidrasi dan pantau pola makannya. Hubungi dokter hewan jika ada kondisi serius.",
            "confidence_score": "0.0"
        }
        
    # Urutkan dari confidence tertinggi
    sorted_diseases = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    top_disease = sorted_diseases[0][0]
    top_score = sorted_diseases[0][1]
    
    return {
        "disease": top_disease,
        "symptoms": gejala_list,
        "recommendation": DISEASE_DB[top_disease]['rekomendasi'],
        "confidence_score": f"{top_score:.1f}"
    }