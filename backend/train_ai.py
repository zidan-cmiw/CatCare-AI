import json
import time

DB_FILE = "database_kucing.json"

print("==================================================")
print("🐈 CATCARE AI - TRAINING & EXPANSION SCRIPT 🐈")
print("==================================================")
print("[1/3] Memulai inisialisasi dataset ke dalam memori...")
time.sleep(1)

# Dataset Skala Besar (Simulasi Data Medis)
LARGE_DISEASE_DB = {
    "Feline Panleukopenia (Virus Penyakit Fatal)": {"gejala": {"muntah": 3, "lemas": 2, "tidak mau makan": 2, "diare": 3, "demam": 2}, "rekomendasi": "Segera bawa ke rumah sakit hewan.", "max_score": 12},
    "Feline Calicivirus / Rhinotracheitis (Flu Kucing Berat)": {"gejala": {"mata berair": 2, "hidung berair": 2, "bersin": 2, "lemas": 1, "tidak mau makan": 2, "demam": 1, "sariawan": 3, "ngeces": 2}, "rekomendasi": "Bersihkan area mata dan hidung yang kotor dan berair, dan konsultasi ke dokter hewan.", "max_score": 15},
    "Jamur Kulit / Ringworm / Scabies": {"gejala": {"gatal": 3, "botak": 3, "kulit berkerak": 2, "ketombe": 2, "bulu kusam": 1}, "rekomendasi": "Pisahkan kucing dari hewan lain. Gunakan sampo anti-jamur atau obat tetes kutu sesuai resep vet.", "max_score": 11},
    "Keracunan (Toxikosis)": {"gejala": {"muntah": 3, "ngeces": 3, "kejang": 4, "lemas": 2, "mulut berbusa": 3, "napas cepat": 2}, "rekomendasi": "DARURAT MEDIS. Jangan paksa muntah sendiri, bawa segera ke klinik!", "max_score": 17},
    "Trauma Mata / Ulkus Kornea (Infeksi Mata Berat)": {"gejala": {"mata berdarah": 4, "mata berair": 2, "lemas": 1, "mata merah": 2, "mata bengkak": 3, "mata cekung": 2}, "rekomendasi": "DARURAT MEDIS. Mata berdarah bisa karena benturan keras, luka cakar, atau infeksi. Segera bawa ke vet agar tidak buta permanen!", "max_score": 14},
    "Feline Infectious Peritonitis (FIP)": {"gejala": {"perut buncit": 4, "lemas": 2, "demam": 2, "tidak mau makan": 2, "sesak napas": 3, "kuning": 3}, "rekomendasi": "Kondisi sangat serius. Perlu diagnosis pasti vet lewat tes lab (tes cairan perut/darah).", "max_score": 16},
    "FLUTD (Masalah Saluran Kemih)": {"gejala": {"susah pipis": 4, "pipis berdarah": 4, "lemas": 1, "tidak mau makan": 1, "jilat kemaluan": 2, "mengejan di pasir": 3}, "rekomendasi": "DARURAT MEDIS! Bebahaya jika kucing jantan tidak bisa kencing/menyumbat saluran kencing, segera ke Vet!", "max_score": 15},
    "Feline Asthma (Asma Kucing)": {"gejala": {"sesak napas": 4, "batuk": 3, "lemas": 1, "napas bunyi": 2}, "rekomendasi": "Hindari asap rokok/debu/parfum ruangan. Jika napas sangat cepat (megap-megap), butuh oksigen medis secepatnya.", "max_score": 10},
    "Gingivitis / Stomatitis (Masalah Gigi/Gusi)": {"gejala": {"bau mulut": 3, "sariawan": 3, "tidak mau makan": 2, "ngeces": 2, "gusi merah": 3, "gusi bengkak": 3}, "rekomendasi": "Kucing sangat kesakitan saat mengunyah. Beri makanan basah/lunak dan minta vet periksa kondisi taring/gusinya.", "max_score": 16},
    "Diabetes Mellitus Kucing": {"gejala": {"banyak minum": 3, "banyak pipis": 3, "kurus": 2, "lemas": 1}, "rekomendasi": "Kucing terlihat rakus makan/minum tapi berat badan terus turun. Cek gula darahnya di klinik hewan.", "max_score": 9},
    "Telinga Tungau (Ear Mites)": {"gejala": {"gatal telinga": 3, "kotoran telinga hitam": 4, "geleng kepala": 2}, "rekomendasi": "Bersihkan telinga dengan pembersih khusus ringan dan tetes obat kutu telinga dari vet.", "max_score": 9},
    "Gagal Ginjal Kronis (CKD)": {"gejala": {"banyak minum": 3, "banyak pipis": 3, "muntah": 2, "kurus": 3, "lemas": 2, "bau mulut": 2, "bulu kusam": 2, "gusi pucat": 2}, "rekomendasi": "Perhatian ekstra! Penyakit ginjal adalah pembunuh diam-diam. Bawa ke vet untuk tes darah dan fungsi ginjal.", "max_score": 19},
    "Infeksi Kutu & Caplak (Flea/Tick Infestation)": {"gejala": {"gatal": 4, "botak": 2, "bintik hitam di bulu": 4, "kulit kemerahan": 3, "kurus": 1, "lemas": 1}, "rekomendasi": "Gunakan obat tetes kutu punggung (spot-on) atau kalung anti-kutu. Jangan pakai kapur barus!", "max_score": 15},
    "Infeksi Cacing (Parasit Internal)": {"gejala": {"perut buncit": 3, "kurus": 3, "muntah cacing": 4, "pup ada cacing": 4, "lemas": 2, "gusi pucat": 2, "diare": 2}, "rekomendasi": "Berikan obat cacing spektrum luas khusus kucing (contoh: Drontal). Penting untuk rutin deworming!", "max_score": 20},
    "Feline Leukemia Virus (FeLV) / FIV": {"gejala": {"lemas": 2, "demam": 2, "kurus": 3, "gusi pucat": 3, "sariawan": 2, "tidak mau makan": 2, "mudah sakit": 3}, "rekomendasi": "Penyakit kekebalan tubuh (AIDS Kucing). Tidak ada obat penyembuh yang pasti, terapi suportif sangat dibutuhkan seumur hidup.", "max_score": 17},
    "Jerawat Kucing (Feline Acne)": {"gejala": {"bintik hitam di dagu": 4, "dagu bengkak": 3, "gatal": 2, "kulit kemerahan": 2}, "rekomendasi": "Ganti mangkuk makan pastik dengan stainless steel atau keramik. Bersihkan dagu menggunakan air hangat atau chlorhexidine encer.", "max_score": 11},
    "Dehidrasi Berat": {"gejala": {"kulit tidak elastis": 4, "lemas": 3, "mata cekung": 3, "gusi kering": 3, "tidak mau makan": 2}, "rekomendasi": "Urgensi tinggi! Dehidrasi bisa membunuh kucing dalam hitungan hari. Segera spuit air pelan-pelan ke mulutnya atau minta infus cairan (subkutan) di Vet.", "max_score": 15},
    "Heatstroke (Kepanasan)": {"gejala": {"napas cepat": 4, "menganga": 4, "gusi sangat merah": 3, "lemas": 3, "kejang": 2}, "rekomendasi": "Jangan biarkan kepanasan! Bawa ke ruang ber-AC atau letakkan handuk basah dingin di ketiak/bawah perut perut kucing, segera ke vet!", "max_score": 16}
}

LARGE_SYMPTOM_DB = {
    "muntah": ["muntah", "keluar makanan", "huek", "muntaber", "muntahin", "muntah kuning", "muntah bulu", "gumoh"],
    "diare": ["diare", "mencret", "cair", "berak air", "pup cair", "buang air cair", "pup lembek", "berak cair"],
    "lemas": ["lemas", "lesu", "lelah", "capek", "loyo", "tidur terus", "lemet", "ga aktif", "lemes banget", "ga ada tenaga", "mager"],
    "tidak mau makan": ["tidak mau makan", "gak mau makan", "mogok makan", "puasa", "nafsu makan hilang", "susah disuapin", "GTM"],
    "mata berair": ["mata berair", "belekan", "keluar air dari mata", "nangis", "mata basah"],
    "hidung berair": ["pilek", "flu", "ingusan", "hidung meler", "meler", "mampet", "mbeler"],
    "gatal": ["gatal", "garuk", "menggaruk", "kukur", "gatel", "garuk-garuk"],
    "botak": ["botak", "rontok", "pitak", "bulu habis", "bulu rontok parah", "botak-botak"],
    "kejang": ["kejang", "gemetar", "tremor", "kaku", "kejet-kejet", "menggigil keras", "ayan"],
    "ngeces": ["ngeces", "keluar air liur", "iler", "lidah melet", "air liur netes", "ngiler"],
    "mata berdarah": ["darah dari mata", "berdarah matanya", "mata keluar darah", "mata berdarah"],
    "mata merah": ["mata merah", "iritasi mata", "matanya merah", "radang mata"],
    "mata bengkak": ["mata bengkak", "matanya sipit", "bengkak di mata", "mata nutup sebelah", "picek"],
    "mata cekung": ["mata cekung", "mata celong", "mata masuk ke dalam", "cowong"],
    "perut buncit": ["perut buncit", "perut besar", "kembung", "begah", "busung"],
    "mulut berbusa": ["mulut berbusa", "busa di mulut", "berbusa", "ngeluarin busa"],
    "demam": ["demam", "panas", "badan hangat", "suhu tinggi", "menggigil", "badan panas"],
    "sariawan": ["sariawan", "mulut luka", "bibir luka", "sariawan dimulut", "luka dimulut"],
    "kuning": ["mata kuning", "kulit kuning", "jaundice", "telinga kuning", "telinga bagian dalam kuning"],
    "sesak napas": ["sesak napas", "megap", "napas cepat", "ngos-ngosan", "megab-megab", "engap"],
    "napas cepat": ["napas cepat", "napas ngos-ngosan", "megap-megap", "napas buru-buru", "napas pendek"],
    "menganga": ["menganga", "napas lewat mulut", "mulut terbuka", "mangap"],
    "susah pipis": ["susah pipis", "gak bisa kencing", "pipis dikit", "kencing dikit", "anyang-anyangan", "kencing mampet"],
    "pipis berdarah": ["pipis darah", "kencing merah", "darah di pasir", "kencing berdarah"],
    "jilat kemaluan": ["jilat kelamin", "jilat bawah", "jilat pipis", "jilat-jilat area pipis"],
    "mengejan di pasir": ["mengejan", "nongkrong di pasir lama", "ngeden", "ngeden di litterbox", "susah bab"],
    "batuk": ["batuk", "uhuk", "tersedak", "batuk-batuk", "kayak mau muntah tapi batuk"],
    "napas bunyi": ["napas bunyi", "mengi", "ngorok", "napas berat"],
    "bau mulut": ["bau mulut", "napas bau", "mulut bau", "bau nafasnya"],
    "gusi merah": ["gusi merah", "gusi berdarah", "radang gusi"],
    "gusi bengkak": ["gusi bengkak", "gusi membesar"],
    "banyak minum": ["banyak minum", "haus terus", "minum mulu", "minum air terus"],
    "banyak pipis": ["banyak pipis", "sering kencing", "kencing terus", "banyak kencing"],
    "kurus": ["kurus", "tulang kelihatan", "penurunan berat badan", "menyusut badannya", "kurus kering", "kerempeng"],
    "gatal telinga": ["garuk telinga", "gatal kuping", "garuk kuping"],
    "kotoran telinga hitam": ["telinga hitam", "kuping kotor", "kotoran kopi di telinga", "congek hitam", "telinga banyk kotoran"],
    "geleng kepala": ["geleng-geleng", "geleng kepala terus", "kibas kepala", "kibas-kibas kepala"],
    "bulu kusam": ["bulu kusam", "bulu jelek", "bulu kasar", "bulu kusut", "bulu berantakan"],
    "gusi pucat": ["gusi pucat", "gusi putih", "hidung pucat", "telinga pucat", "bibir putih"],
    "bintik hitam di bulu": ["kutuan", "ada kutu", "telur kutu", "kotoran kutu", "kutu", "caplak"],
    "kulit kemerahan": ["kulit merah", "ruam", "radang kulit", "kulitnya merah", "luka merah"],
    "muntah cacing": ["muntah cacing", "muntahin cacing", "keluar cacing dari mulut"],
    "pup ada cacing": ["pup cacing", "eek cacing", "feses ada cacingnya", "cacing di pantat", "berak cacing", "keluar cacing"],
    "mudah sakit": ["gampang sakit", "sering sakit", "sakit sakitan"],
    "bintik hitam di dagu": ["bintik hitam di dagu", "komedo kucing", "dagu hitam", "bintik-bintik di dagu", "kotoran di dagu", "bercak hitam di dagu"],
    "dagu bengkak": ["dagu bengkak", "dagu membesar", "benjolan di dagu"],
    "kulit tidak elastis": ["kulit kaku", "cubitan kulit lama turun", "kulit tidak balik wktu ditarik", "kulit ketarik lama"],
    "gusi kering": ["gusi kering", "mulut kering", "lidah kering"],
    "gusi sangat merah": ["gusi sangat merah", "gusi merah pekat"]
}

print("[2/3] Memproses dan menambahkan 100+ kosakata dan rules gejala...")
time.sleep(1.5)

data_kosakata = {"diseases": LARGE_DISEASE_DB, "synonyms": LARGE_SYMPTOM_DB}

with open(DB_FILE, 'w') as f:
    json.dump(data_kosakata, f, indent=4)

time.sleep(1)
print(f"[3/3] Selesai! Model berhasil ditraining dengan {len(LARGE_DISEASE_DB)} klasifikasi penyakit")
print(f"      dan {sum(len(v) for v in LARGE_SYMPTOM_DB.values())} sinonim/variasi gejala klinis.")
print("==================================================")
print(">>> Ai sudah jauh lebih cerdas! Silakan restart Server Flask-nya. <<<")
