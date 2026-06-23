import { GeneratorConfig } from "../types";

export function generateCodeGs(config: GeneratorConfig): string {
  const majorsJsArray = config.majors.map(m => `  "${m.name}"`).join(",\n");

  return `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT - PMB ${config.campusNickname.toUpperCase()} KAMPUS UTAMA
 * SISTEM PENDAFTARAN MAHASISWA BARU (DATABASE INTEGRASI DRIVE & SHEETS)
 * =========================================================================
 * 
 * Panduan Penggunaan:
 * 1. Buat Spreadsheet Baru di Google Drive Anda.
 * 2. Klik Menu 'Ekstensi' > 'Apps Script'.
 * 3. Hapus semua kode bawaan, lalu salin dan tempel (paste) kode di bawah ini ke berkas 'Code.gs'.
 * 4. Buat berkas baru tipe HTML di editor Apps Script dengan nama 'Index' (tanpa .html).
 * 5. Tempelkan kode dari tab 'Index.html' ke berkas baru tersebut.
 * 6. Masukkan ID folder Google Drive target di kolom konfigurasi atau variabel di bawah.
 * 7. Klik 'Terapkan' (Deploy) > 'Penerapan Baru' > pilih Jenis 'Aplikasi Web'.
 */

// KONFIGURASI SISTEM UTAMA
var CONFIG = {
  DRIVE_FOLDER_ID: "${config.driveFolderId || "SALIN_ID_FOLDER_DRIVE_DISINI"}", // ID Folder Google Drive Utama
  SPREADSHEET_NAME: "${config.spreadsheetName || "Data Pendaftar"}",           // Nama Sheet Database
  CAMPUS_NAME: "${config.campusName}",
  CAMPUS_NICKNAME: "${config.campusNickname}",
  ID_PREFIX: "${config.idFormat.split("-")[0] || "UNSA"}",
  ID_YEAR: "${config.idFormat.split("-")[1] || "2026"}",
  ENABLE_EMAIL: ${config.enableEmailNotification},
  ADMIN_EMAIL: "${config.adminEmail || ""}"
};

/**
 * Berfungsi untuk melayani permintaan GET (membuka halaman Web pendaftaran)
 */
function doGet(e) {
  var template = HtmlService.createTemplateFromFile('Index');
  
  // Mengirimkan daftar jurusan aktif dari server ke template HTML
  template.programStudi = [
${majorsJsArray}
  ];
  template.campusName = CONFIG.CAMPUS_NAME;
  template.campusNickname = CONFIG.CAMPUS_NICKNAME;
  
  return template.evaluate()
    .setTitle("PMB " + CONFIG.CAMPUS_NAME + " (" + CONFIG.CAMPUS_NICKNAME + ")")
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Berfungsi untuk memproses form pendaftaran dan berkas upload secara aman
 * @param {Object} formData data objek kiriman dari Form Frontend
 */
function prosesPendaftaran(formData) {
  try {
    // 1. Hubungkan ke Spreadsheet aktif (container-bound) atau cari sheet
    var ss;
    try {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    } catch(err) {
      // Jika dipasang sebagai script standalone, berikan petunjuk/fallback
      throw new Error("Gagal mengakses Spreadsheet. Pastikan kode Apps Script ini dibuat melalui Spreadsheet Anda (Ekstensi > Apps Script).");
    }
    
    var sheet = ss.getSheetByName(CONFIG.SPREADSHEET_NAME);
    if (!sheet) {
      // Buat sheet baru jika nama yang dispesifikasikan belum ada
      sheet = ss.insertSheet(CONFIG.SPREADSHEET_NAME);
    }
    
    // Inisialisasi Header bila sheet masih kosong
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "No. Pendaftaran", 
        "Timestamp", 
        "Nama Lengkap", 
        "Email", 
        "No. HP", 
        "Jenis Kelamin", 
        "Tempat Lahir", 
        "Tanggal Lahir", 
        "Asal Sekolah", 
        "Jurusan Pilihan", 
        "Folder Drive Pendaftar", 
        "File Pas Foto", 
        "File Scan Ijazah"
      ]);
      // Format header agar rapi
      sheet.getRange(1, 1, 1, 13)
        .setFontWeight("bold")
        .setBackground("#0F172A")
        .setFontColor("#FFFFFF")
        .setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }
    
    // 2. Buat Nomor Pendaftaran Unik (Contoh: UNSA-2026-001)
    var lastRow = sheet.getLastRow();
    var sequenceNumber = 1;
    if (lastRow > 1) {
      sequenceNumber = lastRow; // karena baris 1 header, baris 2 no urut 1, baris N no urut N-1 + 1 = N
    }
    var noPendaftaran = formatPendaftaranId(sequenceNumber);
    
    // 3. Akses Google Drive untuk Menyimpan Berkas Upload
    var parentFolder;
    try {
      parentFolder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    } catch(e) {
      throw new Error("Folder Google Drive tidak ditemukan dengan ID: " + CONFIG.DRIVE_FOLDER_ID + ". Harap pastikan folder ada dan akun memiliki akses edit.");
    }
    
    // Buat sub-folder khusus pendaftar
    var folderName = "PMB_" + CONFIG.CAMPUS_NICKNAME + "_" + CONFIG.ID_YEAR + "_" + formData.fullName.toUpperCase();
    var subFolder = parentFolder.createFolder(folderName);
    
    // Proses File Pas Foto
    var fotoUrl = "-";
    if (formData.photoData && formData.photoName) {
      var fotoBlob = Utilities.newBlob(
        Utilities.base64Decode(formData.photoData), 
        formData.photoMime, 
        "FOTO_" + formData.fullName.replace(/\\s+/g, "_") + "_" + formData.photoName
      );
      var fotoFile = subFolder.createFile(fotoBlob);
      fotoFile.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW); // Izinkan dibaca oleh admin
      fotoUrl = fotoFile.getUrl();
    }
    
    // Proses File Scan Ijazah
    var ijazahUrl = "-";
    if (formData.ijazahData && formData.ijazahName) {
      var ijazahBlob = Utilities.newBlob(
        Utilities.base64Decode(formData.ijazahData), 
        formData.ijazahMime, 
        "IJAZAH_" + formData.fullName.replace(/\\s+/g, "_") + "_" + formData.ijazahName
      );
      var ijazahFile = subFolder.createFile(ijazahBlob);
      ijazahFile.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);
      ijazahUrl = ijazahFile.getUrl();
    }
    
    // 4. Masukkan baris data baru ke Google Sheet
    var timestamp = new Date();
    sheet.appendRow([
      noPendaftaran,
      timestamp,
      formData.fullName,
      formData.email,
      "'" + formData.phone, // Tanda kutip tunggal mencegah No HP dianggap angka/kehilangan angka nol depan
      formData.gender,
      formData.placeOfBirth,
      formData.dateOfBirth,
      formData.schoolOrigin,
      formData.majorName,
      subFolder.getUrl(),
      fotoUrl,
      ijazahUrl
    ]);
    
    // 5. Kirim Email Konfirmasi (Opsional)
    if (CONFIG.ENABLE_EMAIL && formData.email) {
      kirimEmailMahasiswa(noPendaftaran, formData);
    }
    if (CONFIG.ENABLE_EMAIL && CONFIG.ADMIN_EMAIL) {
      kirimEmailAdmin(noPendaftaran, formData);
    }
    
    return {
      success: true,
      noPendaftaran: noPendaftaran,
      fullName: formData.fullName,
      majorName: formData.majorName,
      timestamp: Utilities.formatDate(timestamp, Session.getScriptTimeZone(), "dd-MM-yyyy HH:mm:ss")
    };
    
  } catch (error) {
    Logger.log(error.toString());
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * Format Angka Urut menjadi pola ID (Contoh: 1 -> UNSA-2026-001)
 */
function formatPendaftaranId(num) {
  var strNum = num.toString();
  while (strNum.length < 3) {
    strNum = "0" + strNum;
  }
  return CONFIG.ID_PREFIX + "-" + CONFIG.ID_YEAR + "-" + strNum;
}

/**
 * Mengirimkan Email Konfirmasi kepada Calon Mahasiswa secara otomatis
 */
function kirimEmailMahasiswa(noPendaftaran, data) {
  var subject = "[PMB " + CONFIG.CAMPUS_NICKNAME + " " + CONFIG.ID_YEAR + "] Konfirmasi Pendaftaran Sukses - " + noPendaftaran;
  
  var body = "Yth. " + data.fullName + ",\\n\\n" +
             "Selamat! Pendaftaran Anda di " + CONFIG.CAMPUS_NAME + " (" + CONFIG.CAMPUS_NICKNAME + ") telah kami terima.\\n\\n" +
             "Berikut rincian pendaftaran Anda:\\n" +
             "- Nomor Pendaftaran: " + noPendaftaran + "\\n" +
             "- Nama Lengkap: " + data.fullName + "\\n" +
             "- Pilihan Prodi/Jurusan: " + data.majorName + "\\n" +
             "- Asal Sekolah: " + data.schoolOrigin + "\\n\\n" +
             "Silakan simpan nomor pendaftaran ini untuk proses verifikasi berkas dan ujian masuk gelombang berikutnya.\\n\\n" +
             "Terima kasih,\\n" +
             "Panitia Penerimaan Mahasiswa Baru (PMB)\\n" +
             CONFIG.CAMPUS_NAME;
             
  MailApp.sendEmail(data.email, subject, body);
}

/**
 * Mengirimkan Email Pemberitahuan kepada Panitia/Admin
 */
function kirimEmailAdmin(noPendaftaran, data) {
  var subject = "[NOTIF PMB] Pendaftaran Baru Masuk: " + noPendaftaran + " - " + data.fullName;
  
  var body = "Halo Panitia PMB,\\n\\n" +
             "Terdapat pendaftar baru yang telah mengirimkan formulir melalui Web App.\\n\\n" +
             "Detail Calon Mahasiswa:\\n" +
             "- Nomor Pendaftaran: " + noPendaftaran + "\\n" +
             "- Nama: " + data.fullName + "\\n" +
             "- Jurusan: " + data.majorName + "\\n" +
             "- No HP: " + data.phone + "\\n" +
             "- Asal Sekolah: " + data.schoolOrigin + "\\n\\n" +
             "Data pendaftaran dan dokumen berkas telah dimasukkan ke dalam Google Sheet & Google Drive PMB.\\n" +
             "Silakan lakukan pengecekan pada sistem database pusat.\\n\\n" +
             "Salam Sukses,\\n" +
             "Sistem Otomatisasi PMB";
             
  MailApp.sendEmail(CONFIG.ADMIN_EMAIL, subject, body);
}
`;
}

export function generateIndexHtml(config: GeneratorConfig): string {
  const optionsHtml = config.majors.map(m => `            <option value="${m.name}">${m.name} (${m.faculty})</option>`).join("\n");

  return `<!DOCTYPE html>
<html lang="id" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PMB ${config.campusName} - Portal Penerimaan Resmi 2026/2027</title>
  
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- Font Google (Plus Jakarta Sans) -->
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  
  <!-- Lucide Icons CDN for super crisp UI icons -->
  <script src="https://unpkg.com/lucide@latest"></script>
  
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['"Plus Jakarta Sans"', 'sans-serif'],
            mono: ['"JetBrains Mono"', 'monospace'],
          },
          colors: {
            unsa: {
              navy: '#0B2545',
              blue: '#134074',
              gold: '#F4B41A',
              lightgold: '#FDF0CD',
              darkgold: '#DE9C04',
              ice: '#EEF4F8'
            }
          }
        }
      }
    }
  </script>
  
  <style>
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background-color: #F8FAFC;
    }
    
    /* Elegant blur glass effect */
    .glass-nav {
      background: rgba(11, 37, 69, 0.95);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }
    
    .glass-card {
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }

    /* Elegant custom scrollbar */
    ::-webkit-scrollbar {
      width: 8px;
    }
    ::-webkit-scrollbar-track {
      background: #F1F5F9;
    }
    ::-webkit-scrollbar-thumb {
      background: #CBD5E1;
      border-radius: 9999px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #94A3B8;
    }
  </style>
</head>
<body class="min-h-screen text-slate-800 flex flex-col justify-between selection:bg-unsa-gold selection:text-unsa-navy overflow-x-hidden">

  <!-- GLASSMORPHIC NAVIGATION BAR -->
  <nav class="glass-nav sticky top-0 z-50 text-white border-b border-white/10 shadow-lg shrink-0">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <!-- Campus Icon Wrapper resembling figma modern look -->
        <div class="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-unsa-gold shrink-0">
          <i data-lucide="graduation-cap" class="w-5.5 h-5.5 text-unsa-navy"></i>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-white font-extrabold text-[13px] sm:text-sm tracking-wide uppercase font-sans">${config.campusName}</h1>
            <span class="bg-unsa-gold text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">
              PMB 2026
            </span>
          </div>
          <p class="text-[9px] text-blue-200 tracking-wider font-bold uppercase">Portal Resmi Penerimaan Mahasiswa Baru</p>
        </div>
      </div>

      <!-- Nav Links -->
      <div class="hidden lg:flex items-center gap-6 text-xs font-bold text-slate-200">
        <a href="#beranda" class="hover:text-unsa-gold transition-colors flex items-center gap-1.5">
          <i data-lucide="home" class="w-3.5 h-3.5"></i> Beranda
        </a>
        <a href="#keunggulan" class="hover:text-unsa-gold transition-colors flex items-center gap-1.5">
          <i data-lucide="award" class="w-3.5 h-3.5"></i> Keunggulan
        </a>
        <a href="#studi" class="hover:text-unsa-gold transition-colors flex items-center gap-1.5">
          <i data-lucide="book-open" class="w-3.5 h-3.5"></i> Program Studi
        </a>
        <a href="#alur" class="hover:text-unsa-gold transition-colors flex items-center gap-1.5">
          <i data-lucide="git-merge" class="w-3.5 h-3.5"></i> Alur Seleksi
        </a>
      </div>

      <div class="flex items-center gap-3">
        <a href="#registrasi" class="bg-gradient-to-r from-unsa-gold to-amber-500 hover:from-unsa-gold-hover hover:to-amber-600 text-slate-950 font-extrabold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow shadow-unsa-gold/20 hover:scale-[1.03] active:scale-95">
          <i data-lucide="user-plus" class="w-3.5 h-3.5"></i>
          <span>Daftar Sekarang</span>
        </a>
      </div>
    </div>
  </nav>

  <!-- HERO SECTION WITH ILLUSTRATION -->
  <section id="beranda" class="bg-gradient-to-br from-unsa-navy via-slate-900 to-unsa-blue text-white relative overflow-hidden py-14 sm:py-20 px-6 shrink-0">
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-unsa-blue/45 via-transparent to-transparent pointer-events-none"></div>
    <div class="absolute -bottom-10 -left-10 w-40 h-40 bg-unsa-gold/10 rounded-full blur-3xl pointer-events-none"></div>
    
    <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10 w-full">
      <!-- Info Column left -->
      <div class="lg:col-span-7 space-y-6 text-center lg:text-left">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 ring-1 ring-white/20 rounded-xl text-xs font-bold text-unsa-gold uppercase tracking-wider mx-auto lg:mx-0">
          <i data-lucide="sparkles" class="w-4 h-4 text-unsa-gold animate-bounce"></i>
          <span>Registrasi Gelombang I Terbuka</span>
        </div>
        
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight font-sans tracking-tight">
          Penerimaan Mahasiswa Baru <br class="hidden sm:inline">
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-unsa-gold to-amber-400">
            ${config.campusName} 2026
          </span>
        </h2>
        
        <p class="text-sm sm:text-base text-slate-300 leading-relaxed font-medium max-w-2xl mx-auto lg:mx-0">
          Wujudkan karir impian Anda di era global dengan kurikulum berbasis kompetensi masa kini dan bimbingan dosen industri terpercaya. Proses pengisian pendaftaran kini 100% online, aman, dan langsung te-rintegrasi dengan Google Drive serta Google Spreadsheet Kampus Utama.
        </p>
        
        <div class="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
          <a href="#registrasi" class="w-full sm:w-auto bg-gradient-to-r from-unsa-gold to-amber-400 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black px-6 py-3.5 rounded-xl text-sm transition-all text-center flex items-center justify-center gap-2 shadow-lg shadow-unsa-gold/15">
            Mulai Pengisian Form
            <i data-lucide="arrow-right" class="w-4 h-4 text-slate-950"></i>
          </a>
          <a href="#alur" class="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm border border-white/20 hover:bg-white/5 transition-all text-center flex items-center justify-center gap-2 font-bold">
            <i data-lucide="help-circle" class="w-4 h-4"></i>
            Pelajari Alur & Syarat
          </a>
        </div>
        
        <!-- Trust indicators / Stats Grid -->
        <div class="grid grid-cols-3 gap-4 pt-6 border-t border-white/10 max-w-lg mx-auto lg:mx-0">
          <div>
            <p class="text-unsa-gold text-2xl font-extrabold font-mono">24+</p>
            <p class="text-[10px] sm:text-xs text-slate-400 font-semibold uppercase">Pilihan Program Studi</p>
          </div>
          <div>
            <p class="text-unsa-gold text-2xl font-extrabold font-mono">92%</p>
            <p class="text-[10px] sm:text-xs text-slate-400 font-semibold uppercase">Alumni Terserap Kerja</p>
          </div>
          <div>
            <p class="text-unsa-gold text-2xl font-extrabold font-mono">Tier A</p>
            <p class="text-[10px] sm:text-xs text-slate-400 font-semibold uppercase">Akreditasi Fakultas</p>
          </div>
        </div>
      </div>
      
      <!-- Graphic Card Column right -->
      <div class="lg:col-span-5 hidden lg:block">
        <div class="relative min-h-[380px] w-full flex items-center justify-center">
          <!-- Main visual board -->
          <div class="w-full bg-slate-900/60 border border-white/15 rounded-3xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
            <div class="absolute right-0 top-0 w-24 h-24 bg-unsa-gold/10 rounded-full blur-xl pointer-events-none"></div>
            
            <div class="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <span class="text-xs font-extrabold text-slate-300 font-mono tracking-widest uppercase">System Operational Live</span>
              <div class="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-emerald-500/50 shadow-md"></div>
            </div>
            
            <div class="space-y-4">
              <div class="flex items-center gap-3 bg-white/5 py-3 px-4 rounded-xl border border-white/10">
                <div class="w-9 h-9 rounded-lg bg-unsa-gold/20 flex items-center justify-center"><i data-lucide="shield-check" class="text-unsa-gold w-5 h-5"></i></div>
                <div>
                  <span class="text-xs font-bold text-white block">Server cloud terintegrasi</span>
                  <span class="text-[10px] text-slate-400 block">Sistem terenkripsi Google Workspace</span>
                </div>
              </div>
              
              <div class="flex items-center gap-3 bg-white/5 py-3 px-4 rounded-xl border border-white/10">
                <div class="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center"><i data-lucide="image" class="text-blue-400 w-5 h-5"></i></div>
                <div>
                  <span class="text-xs font-bold text-white block">Otomasi Upload Dokumen</span>
                  <span class="text-[10px] text-slate-400 block">Langsung tersinkronisasi ke Google Drive</span>
                </div>
              </div>

              <div class="flex items-center gap-3 bg-white/5 py-3 px-4 rounded-xl border border-white/10">
                <div class="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center"><i data-lucide="sheet" class="text-emerald-400 w-5 h-5"></i></div>
                <div>
                  <span class="text-xs font-bold text-white block">Akses Real-time Database</span>
                  <span class="text-[10px] text-slate-400 block">Otomatis masuk Lembar Pendaftar Kampus</span>
                </div>
              </div>
            </div>
            
            <div class="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-[10px] text-slate-400 font-mono">
              <span>SDK: v2.5 Stable Node</span>
              <span>PING: 18ms Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- SECTION STICKER ACCENT GOLD -->
  <div class="h-2 bg-gradient-to-r from-unsa-gold via-amber-400 to-yellow-300 w-full"></div>

  <!-- VALUE PROPOSITION BENTO BOXES -->
  <section id="keunggulan" class="max-w-7xl mx-auto px-6 py-12 shrink-0">
    <div class="text-center space-y-2 mb-10">
      <span class="text-[10px] font-black uppercase text-unsa-blue bg-unsa-ice ring-1 ring-unsa-blue/10 rounded-lg px-3 py-1">Mengapa Memilih Kami</span>
      <h3 class="text-2xl sm:text-3xl font-extrabold text-unsa-navy font-sans">Kampus Unggul Untuk Karir Gemilang</h3>
      <p class="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">Kami mengedepankan kualitas sistem pengajaran, integrasi digital praktis, serta jejaring industri yang luas.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
        <div class="w-11 h-11 rounded-full bg-blue-100 text-unsa-blue flex items-center justify-center mb-4">
          <i data-lucide="graduation-cap" class="w-5.5 h-5.5"></i>
        </div>
        <h4 class="font-bold text-slate-800 text-sm mb-1.5 uppercase">Kurikulum Siap Industri</h4>
        <p class="text-xs text-slate-500 leading-relaxed font-medium">Pembelajaran dirancang khusus mengadaptasi tantangan masa kini agar lulusan adaptif dan terserap pasar kerja instan.</p>
      </div>

      <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
        <div class="w-11 h-11 rounded-full bg-amber-150 text-unsa-darkgold bg-amber-100 flex items-center justify-center mb-4">
          <i data-lucide="sparkles" class="w-5.5 h-5.5"></i>
        </div>
        <h4 class="font-bold text-slate-800 text-sm mb-1.5 uppercase">Beasiswa Penuh & Subsidi</h4>
        <p class="text-xs text-slate-500 leading-relaxed font-medium">Tersedia ragam skema beasiswa prestasi akademik, beasiswa minat-bakat seni olah raga, hingga bantuan pembiayaan kuliah.</p>
      </div>

      <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
        <div class="w-11 h-11 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
          <i data-lucide="laptop" class="w-5.5 h-5.5"></i>
        </div>
        <h4 class="font-bold text-slate-800 text-sm mb-1.5 uppercase">Fasilitas Laboratorium High-Tech</h4>
        <p class="text-xs text-slate-500 leading-relaxed font-medium">Meliputi laboratorium multimedia terpadu, laboratorium komputer berteknologi modern, dan perpustakaan digital interaktif.</p>
      </div>
    </div>
  </section>

  <!-- MAIN REGISTRATION AREA & MULTI-STEP FORM -->
  <section id="registrasi" class="max-w-4xl mx-auto px-4 py-8 w-full shrink-0 flex-grow relative">
    
    <!-- Background Blur Blobs to make the card feel floating dynamic -->
    <div class="absolute -top-12 -right-12 w-48 h-48 bg-unsa-gold/5 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-12 -left-12 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

    <!-- MAIN FLOATING CARD CONTAINER -->
    <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative z-10">
      
      <!-- Card Branding Title Panel -->
      <div class="bg-gradient-to-r from-unsa-navy to-unsa-blue px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 text-white">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-unsa-gold rounded-full flex items-center justify-center shadow-inner shrink-0">
            <i data-lucide="file-text" class="w-5 h-5 text-slate-950"></i>
          </div>
          <div>
            <h3 class="font-black text-sm tracking-wide uppercase">FORMULIR PENDAFTARAN PMB ONLINE</h3>
            <p class="text-[10px] text-blue-200">Silakan lengkapi 3 tahap pengisian data di bawah ini.</p>
          </div>
        </div>
        <div class="bg-white/10 px-3 py-1.5 rounded-xl border border-white/20 text-center font-bold text-[10px] tracking-wider uppercase text-unsa-gold shrink-0">
          GELOMBANG 1 - 2026/2027
        </div>
      </div>

      <!-- PROGRESS INDICATOR STEPS -->
      <div class="bg-slate-50 border-b border-slate-150 py-5 px-6 shrink-0 select-none">
        <div class="flex items-center justify-between max-w-lg mx-auto relative">
          <!-- Background connector line -->
          <div class="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0"></div>
          <div id="stepProgressActiveLine" class="absolute top-1/2 left-0 h-1 bg-unsa-gold -translate-y-1/2 z-0 transition-all duration-300 w-0"></div>

          <!-- Step Bubble 1 -->
          <div class="relative z-10 flex flex-col items-center gap-1.5" id="bubbleStep1">
            <div id="badgeStep1" class="w-9 h-9 rounded-full bg-unsa-navy text-white flex items-center justify-center font-bold text-xs ring-4 ring-blue-50 z-10 transition-all">
              1
            </div>
            <span class="text-[10px] sm:text-xs font-black text-unsa-navy uppercase tracking-wider">Biodata</span>
          </div>

          <!-- Step Bubble 2 -->
          <div class="relative z-10 flex flex-col items-center gap-1.5" id="bubbleStep2">
            <div id="badgeStep2" class="w-9 h-9 rounded-full bg-slate-250 bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs z-10 transition-all">
              2
            </div>
            <span class="text-[10px] sm:text-xs font-extrabold text-slate-400 uppercase tracking-wider">Akademik</span>
          </div>

          <!-- Step Bubble 3 -->
          <div class="relative z-10 flex flex-col items-center gap-1.5" id="bubbleStep3">
            <div id="badgeStep3" class="w-9 h-9 rounded-full bg-slate-250 bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs z-10 transition-all">
              3
            </div>
            <span class="text-[10px] sm:text-xs font-extrabold text-slate-400 uppercase tracking-wider">Unggahan</span>
          </div>
        </div>
      </div>

      <!-- THE CORE INPUT FORMULIR -->
      <form id="pmbForm" onsubmit="handleFormSubmit(event)" class="p-6 sm:p-8 space-y-6">
        
        <!-- STEP VIEW 1: DATA PERSONAL / BIODATA -->
        <div id="stepSection1" class="transition-opacity duration-200">
          <div class="space-y-4">
            
            <div class="flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <i data-lucide="user" class="w-4 h-4 text-unsa-blue"></i>
              <h4 class="text-xs font-black tracking-wider uppercase text-slate-500">Tahap 1: Data Identitas Calon Mahasiswa</h4>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Nama Lengkap -->
              <div class="col-span-1 md:col-span-2">
                <label class="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Nama Lengkap (Sesuai Ijazah terakhir) <span class="text-red-500">*</span></label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-430 text-slate-400">
                    <i data-lucide="user" class="w-4 h-4"></i>
                  </span>
                  <input type="text" id="fullNameInput" name="fullName" required placeholder="Contoh: Ahmad Fadhillah Azis" class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-unsa-blue/10 focus:border-unsa-blue text-xs sm:text-sm font-medium transition-all">
                </div>
              </div>

              <!-- Email Aktif -->
              <div>
                <label class="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Alamat Email Aktif <span class="text-red-500">*</span></label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                    <i data-lucide="mail" class="w-4 h-4"></i>
                  </span>
                  <input type="email" id="emailInput" name="email" required placeholder="Contoh: ahmad.fadhil@gmail.com" class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-unsa-blue/10 focus:border-unsa-blue text-xs sm:text-sm font-medium transition-all">
                </div>
              </div>

              <!-- No HP / WhatsApp -->
              <div>
                <label class="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Nomor WhatsApp Aktif <span class="text-red-500">*</span></label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                    <i data-lucide="phone" class="w-4 h-4"></i>
                  </span>
                  <input type="tel" id="phoneInput" name="phone" required placeholder="Contoh: 081234567890" class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-unsa-blue/10 focus:border-unsa-blue text-xs sm:text-sm font-medium transition-all">
                </div>
              </div>

              <!-- Jenis Kelamin -->
              <div>
                <label class="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Jenis Kelamin <span class="text-red-500">*</span></label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                    <i data-lucide="users" class="w-4 h-4"></i>
                  </span>
                  <select id="genderInput" name="gender" required class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-unsa-blue/10 focus:border-unsa-blue text-xs sm:text-sm font-semibold text-slate-750 transition-all bg-white cursor-pointer">
                    <option value="">Pilih Jenis Kelamin</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
              </div>

              <!-- Tempat Lahir -->
              <div>
                <label class="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Tempat Lahir <span class="text-red-500">*</span></label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                    <i data-lucide="map-pin" class="w-4 h-4"></i>
                  </span>
                  <input type="text" id="placeOfBirthInput" name="placeOfBirth" required placeholder="Contoh: Surakarta" class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-unsa-blue/10 focus:border-unsa-blue text-xs sm:text-sm font-medium transition-all">
                </div>
              </div>

              <!-- Tanggal Lahir -->
              <div class="col-span-1">
                <label class="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Tanggal Lahir <span class="text-red-500">*</span></label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                    <i data-lucide="calendar" class="w-4 h-4"></i>
                  </span>
                  <input type="date" id="dateOfBirthInput" name="dateOfBirth" required class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-unsa-blue/10 focus:border-unsa-blue text-xs sm:text-sm font-semibold transition-all">
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- STEP VIEW 2: AKADEMIK & PILIHAN PRODI -->
        <div id="stepSection2" class="hidden transition-opacity duration-200">
          <div class="space-y-4">
            
            <div class="flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <i data-lucide="book-open" class="w-4 h-4 text-unsa-blue"></i>
              <h4 class="text-xs font-black tracking-wider uppercase text-slate-500">Tahap 2: Minat Pendidikan & Asal Sekolah</h4>
            </div>

            <div class="space-y-4">
              <!-- Asal Sekolah -->
              <div>
                <label class="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Asal Sekolah (SMA/SMK/MA/Sederajat) <span class="text-red-500">*</span></label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                    <i data-lucide="building-2" class="w-4 h-4"></i>
                  </span>
                  <input type="text" id="schoolOriginInput" name="schoolOrigin" placeholder="Contoh: SMA Negeri 2 Surakarta" class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-unsa-blue/10 focus:border-unsa-blue text-xs sm:text-sm font-medium transition-all">
                </div>
              </div>

              <!-- Pilihan Program Studi -->
              <div>
                <label class="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Pilih Program Studi Utama <span class="text-red-500">*</span></label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                    <i data-lucide="check-square" class="w-4 h-4"></i>
                  </span>
                  <select id="majorNameInput" name="majorName" class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-unsa-blue/10 focus:border-unsa-blue text-xs sm:text-sm font-semibold text-slate-750 transition-all bg-white cursor-pointer">
                    <option value="">Pilih Jurusan/Pilihan Prodi Anda</option>
${optionsHtml}
                  </select>
                </div>
                <p class="text-[10px] text-slate-400 mt-1">Studi program Pascasarjana & Sarjana (S1). Silakan pilih opsi prodi sesuai fakultas peminatan Anda.</p>
              </div>
            </div>

          </div>
        </div>

        <!-- STEP VIEW 3: UPLOAD DOKUMEN BERKAS -->
        <div id="stepSection3" class="hidden transition-opacity duration-200">
          <div class="space-y-4">
            
            <div class="flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <i data-lucide="upload-cloud" class="w-4 h-4 text-unsa-blue"></i>
              <h4 class="text-xs font-black tracking-wider uppercase text-slate-500">Tahap 3: Lampiran Dokumen Pelengkap</h4>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5 py-2">
              <!-- PAS FOTO DRAG AND DROP PORTAL -->
              <div class="flex flex-col">
                <label class="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">Pas Foto Formal Terbaru (3x4) <span class="text-red-500">*</span></label>
                <div class="border-2 border-dashed border-slate-220 border-slate-300 rounded-2xl p-5 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50/80 transition-all cursor-pointer relative text-center min-h-[170px]" id="photoUploadZone" onclick="document.getElementById('photoInput').click()">
                  <i data-lucide="image" class="w-8 h-8 text-slate-400 mb-2"></i>
                  <p class="text-xs font-bold text-slate-800">Tarik Pas Foto / Cari File</p>
                  <p class="text-[9px] text-slate-400 mt-0.5">JPEG atau PNG saja (Saran: maks 2MB)</p>
                  <input type="file" id="photoInput" accept="image/*" class="hidden">
                  
                  <!-- Thumbnail preview built dynamically -->
                  <div id="photoPreview" class="hidden absolute inset-2 bg-white rounded-xl p-1 flex items-center justify-center border shadow-inner z-10"></div>
                </div>
              </div>

              <!-- SCAN IJAZAH DRAG AND DROP PORTAL -->
              <div class="flex flex-col">
                <label class="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">Scan Ijazah Terakhir / SKL <span class="text-red-500">*</span></label>
                <div class="border-2 border-dashed border-slate-220 border-slate-300 rounded-2xl p-5 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50/80 transition-all cursor-pointer relative text-center min-h-[170px]" id="ijazahUploadZone" onclick="document.getElementById('ijazahInput').click()">
                  <i data-lucide="file-text" class="w-8 h-8 text-slate-400 mb-2"></i>
                  <p class="text-xs font-bold text-slate-800">Tarik File Ijazah / Cari PDF</p>
                  <p class="text-[9px] text-slate-400 mt-0.5">PDF, JPEG, atau PNG (maks 2MB)</p>
                  <input type="file" id="ijazahInput" accept="image/*,application/pdf" class="hidden">
                  
                  <!-- Thumbnail preview for Ijazah -->
                  <div id="ijazahPreview" class="hidden absolute inset-2 bg-white rounded-xl p-3.5 flex flex-col items-center justify-center border shadow-inner z-10 gap-1.5">
                    <div class="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center"><i data-lucide="file-check" class="w-5 h-5"></i></div>
                    <p class="text-[10px] font-bold text-teal-800 truncate max-w-[200px]" id="ijazahFileName">Ijazah_Terunggah.pdf</p>
                    <button type="button" class="text-[9px] font-bold text-red-500 hover:text-red-600 cursor-pointer flex items-center gap-1 underline bg-transparent border-0" onclick="resetFile('ijazah', event)">Hapus Berkas</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Syarat Persetujuan Ketentuan -->
            <div class="flex items-start gap-3 p-4 bg-yellow-50 rounded-2xl border border-yellow-100 text-yellow-850 mt-2">
              <input type="checkbox" id="agreedTerms" class="mt-1 w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500 accent-unsa-gold cursor-pointer shrink-0">
              <label for="agreedTerms" class="text-xs leading-relaxed font-semibold text-yellow-900 cursor-pointer select-none">
                Dengan mencentang formulir ini, saya menjamin semua rincian informasi dan berkas dokumen yang dilampirkan adalah mutlak benar dan sesuai dengan hukum yang berlaku di Indonesia.
              </label>
            </div>
          </div>
        </div>

        <!-- FORM ACTION UTILITY FLOW TRIPPERS -->
        <div class="flex items-center justify-between gap-4 pt-4 border-t border-slate-100 select-none">
          <button 
            type="button" 
            id="prevBtn" 
            onclick="prevStep()" 
            class="hidden px-5 py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer flex items-center gap-1.5 active:scale-95">
            <i data-lucide="arrow-left" class="w-4 h-4"></i>
            Sebelumnya
          </button>

          <button 
            type="button" 
            id="nextBtn" 
            onclick="nextStep()" 
            class="w-full sm:w-auto ml-auto px-6 py-3 bg-unsa-navy hover:bg-unsa-blue text-white font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow shadow-unsa-navy/10 border-0">
            Berikutnya
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </button>

          <button 
            type="submit" 
            id="submitBtn" 
            class="hidden w-full sm:w-auto ml-auto px-6 py-3.5 bg-gradient-to-r from-unsa-gold to-amber-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition transition-all cursor-pointer flex items-center justify-center gap-1.5 border-0 hover:from-amber-500 hover:to-amber-600 active:scale-95 shadow-md shadow-unsa-gold/10">
            Kirim Pendaftaran
            <i data-lucide="check-circle" class="w-4 h-4 text-slate-950"></i>
          </button>
        </div>
      </form>

      <!-- EXPERT LOADING SCREEN -->
      <div id="loadingOverlay" class="hidden p-8 sm:p-12 text-center flex-col items-center justify-center space-y-6">
        <div class="relative w-20 h-20">
          <div class="absolute inset-0 rounded-full border-4 border-slate-50 bg-slate-50"></div>
          <div class="absolute inset-0 rounded-full border-c border-slate-200 border-4 border-t-unsa-navy border-r-unsa-gold animate-spin"></div>
        </div>
        <div class="space-y-2 max-w-sm">
          <h4 class="text-base sm:text-lg font-black text-slate-850" id="loadingTitle">Memproses Pendaftaran...</h4>
          <p class="text-[10px] sm:text-xs text-slate-500 leading-normal font-semibold font-mono" id="loadingStatus">Menyiapkan enkripsi transmisi data pendaftaran Anda...</p>
        </div>
        <div class="w-full max-w-xs bg-slate-100 rounded-full h-1.5 overflow-hidden shadow-inner">
          <div id="loadingBar" class="bg-gradient-to-r from-unsa-gold to-amber-500 h-full w-0 transition-all duration-300"></div>
        </div>
      </div>

      <!-- GLORIOUS SUCCESS / INVOICE VIEW -->
      <div id="successView" class="hidden p-6 sm:p-10 text-center flex-col items-center space-y-6">
        
        <!-- Success Check Mark Bubble -->
        <div class="w-16 h-16 bg-emerald-50 rounded-full text-emerald-600 flex items-center justify-center border-4 border-emerald-100 shadow">
          <i data-lucide="badge-check" class="w-8 h-8 text-emerald-600"></i>
        </div>

        <div class="space-y-1">
          <span class="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 py-1 px-3.5 rounded-full ring-1 ring-emerald-500/20">REGISTRASI BERHASIL</span>
          <h2 class="text-2xl sm:text-3xl font-black text-slate-800 leading-tight">Selamat, Anda Terdaftar!</h2>
          <p class="text-xs text-slate-500 max-w-md mx-auto leading-normal">Nomor pendaftaran digital Anda telah diterbitkan de-ngan integrasi Google Workspace. Harap tangkap layar (screenshot) sebagai bukti resmi.</p>
        </div>

        <!-- THE AMAZING FIGMA DIGITAL ID CARD -->
        <div class="w-full max-w-sm bg-gradient-to-br from-unsa-navy to-slate-900 text-white rounded-3xl p-5 shadow-2xl relative overflow-hidden text-left border border-white/10 shadow-emerald-900/10">
          <div class="absolute -right-10 -bottom-10 w-36 h-36 bg-unsa-gold/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div class="flex justify-between items-start gap-4 border-b border-white/10 pb-4 mb-4">
            <div>
              <p class="text-[9px] uppercase font-black tracking-wider text-unsa-gold">ID Card Calon Mahasiswa</p>
              <h3 class="text-xs font-black text-white uppercase">${config.campusNickname} PMB 2026/2027</h3>
            </div>
            <!-- Dynamic QR representation -->
            <div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0 border border-slate-700/50">
              <svg class="w-8 h-8 text-slate-950" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-1h-2v2h2v-2zm-3 3h2v2h-2v-2zm3 1h2v-2h-2v2zm-3-3h-2v2h2v-2zm3-3h2V9h-2v2zm-2 2h2V9h-2v4zm-5 5h2v2h-2v-2z" />
              </svg>
            </div>
          </div>

          <div class="space-y-4">
            <!-- Registration ID -->
            <div>
              <p class="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Nomor Registrasi Unik</p>
              <p class="text-2xl font-black text-unsa-gold tracking-wide font-sans mt-0.5" id="regIdField">UNSA-2026-999</p>
            </div>

            <!-- Persona details grid -->
            <div class="grid grid-cols-2 gap-3.5">
              <div>
                <p class="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Nama Pendaftar</p>
                <p class="text-xs font-bold text-white truncate leading-normal" id="regNameField">Ahmad Fadhill Azis</p>
              </div>
              <div>
                <p class="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Program Studi Pilihan</p>
                <p class="text-xs font-bold text-white truncate leading-normal" id="regMajorField">S1 Teknik Informatika</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3.5 pt-3.5 border-t border-white/15">
              <div>
                <p class="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Sistem Sinkronisasi</p>
                <p class="text-[10px] sm:text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <i data-lucide="circle-check-big" class="w-3.5 h-3.5 text-emerald-400 inline"></i>
                  Sync Sukses
                </p>
              </div>
              <div>
                <p class="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Waktu Registrasi</p>
                <p class="text-[10px] text-slate-350 font-mono mt-0.5" id="regTimeField">23-06-2026 10:15:30</p>
              </div>
            </div>
          </div>
        </div>

        <!-- SEAMLESS BLUE INFORMATION TIP -->
        <div class="bg-blue-50 border border-blue-100 rounded-2xl p-4.5 text-left max-w-sm sm:max-w-md w-full text-slate-800 space-y-1.5 shadow-sm leading-relaxed">
          <h4 class="text-xs font-black text-blue-950 uppercase tracking-widest flex items-center gap-1.5">
            <i data-lucide="info" class="w-4 h-4 text-blue-600 shrink-0"></i>
            Langkah Penting Selanjutnya:
          </h4>
          <ol class="list-decimal list-inside text-xs text-blue-900/90 font-medium space-y-1 pl-0.5">
            <li>Bukti rincian pendaftaran lengkap kami kirimkan ke email aktif Anda.</li>
            <li>Grup koordinasi WhatsApp Mahasiswa Baru UNSA 2026 tertera pada lembar email tersebut.</li>
            <li>Siapkan fotokopi ijazah fisik yang terlegalisir saat jadwal daftar ulang akademik nanti.</li>
          </ol>
        </div>

        <div class="flex flex-col sm:flex-row gap-3 w-full max-w-sm justify-center">
          <button onclick="window.print()" class="w-full sm:w-auto px-5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-250 rounded-xl text-slate-700 text-xs font-extrabold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95">
            <i data-lucide="printer" class="w-3.5 h-3.5"></i>
            Cetak Bukti Pendaftaran
          </button>
          <button onclick="restartForm()" class="w-full sm:w-auto px-5 py-2.5 bg-unsa-navy hover:bg-unsa-blue text-white rounded-xl text-xs font-extrabold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 border-0">
            <i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-white"></i>
            Daftarkan Rekan Lain
          </button>
        </div>
      </div>

    </div>
  </section>

  <!-- CAMPUS ADDRESS & CONTACT FOOTER MAP -->
  <footer class="bg-slate-900 border-t border-slate-800 text-slate-400 py-8 text-center text-xs shrink-0 w-full mt-auto select-none">
    <div class="max-w-4xl mx-auto px-6 space-y-4">
      <div class="flex items-center justify-center gap-2 mb-2">
        <div class="w-7 h-7 bg-white rounded-full flex items-center justify-center border border-unsa-gold">
          <i data-lucide="globe" class="w-4 h-4 text-unsa-navy"></i>
        </div>
        <span class="font-extrabold text-white text-sm uppercase tracking-wider">UNIVERSITAS SURAKARTA</span>
      </div>
      
      <p class="max-w-md mx-auto text-slate-400 text-[11px] leading-relaxed">
        Jl. Raya Solo-Sragen KM 5, Jaten, Karanganyar, Surakarta, Jawa Tengah 57731 <br>
        Telepon: (0271) 852108 | Email: info@unsa.ac.id | Web: https://unsa.ac.id
      </p>

      <div class="h-px bg-slate-800 w-full"></div>

      <p class="font-semibold text-slate-500 text-[10px]">© 2026 Universitas Surakarta (UNSA). Seluruh hak cipta dilindungi undang-undang.</p>
      <p class="text-[9px] text-slate-600 font-mono">Sistem Terintegrasi Google Apps Script, Google Drive, & Google Sheets API</p>
    </div>
  </footer>

  <!-- CORE SCRIPTS & WIZARD NAVIGATION LOGIC -->
  <script>
    // Initialize Lucide icons on start
    lucide.createIcons();

    // Current Active wizard Step indicator
    var currentStepVal = 1;

    // File Data Buffers (PasFoto & Ijazah)
    var fileData = {
      photo: { base64: "", name: "", mime: "" },
      ijazah: { base64: "", name: "", mime: "" }
    };

    /**
     * File Reader Callback implementation
     */
    function handleFileRead(evt, fileType, callback) {
      var file = evt.target.files[0];
      if (!file) return;
      
      if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran berkas terlalu besar! Maksimal lampiran berukuran 2MB agar aman disimpan di Google Drive.");
        evt.target.value = "";
        return;
      }
      
      var reader = new FileReader();
      reader.onload = function(e) {
        var fullBase64 = e.target.result;
        var rawBase64 = fullBase64.split(',')[1];
        
        fileData[fileType] = {
          base64: rawBase64,
          name: file.name,
          mime: file.type
        };
        
        if (callback) callback(fullBase64, file.name, file.type);
      };
      reader.readAsDataURL(file);
    }

    // Photo input event handler
    document.getElementById('photoInput').addEventListener('change', function(e) {
      handleFileRead(e, 'photo', function(base64, name, mime) {
        var container = document.getElementById('photoPreview');
        container.innerHTML = '<div class="relative w-full h-full flex flex-col items-center justify-center bg-slate-50 rounded-xl overflow-hidden">' +
                              '<img src="' + base64 + '" class="w-full h-full object-cover">' +
                              '<button type="button" class="absolute bottom-1 right-1 bg-red-650 bg-red-500 hover:bg-red-630 text-white p-1 rounded-full border-0 cursor-pointer shadow flex items-center justify-center hover:scale-105" onclick="resetFile(\\'photo\\', event)"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg></button>' +
                              '</div>';
        container.classList.remove('hidden');
      });
    });

    // Ijazah input event handler
    document.getElementById('ijazahInput').addEventListener('change', function(e) {
      handleFileRead(e, 'ijazah', function(base64, name, mime) {
        document.getElementById('ijazahFileName').innerText = name;
        document.getElementById('ijazahPreview').classList.remove('hidden');
      });
    });

    /**
     * Resets a selected file buffer
     */
    function resetFile(fileType, event) {
      if (event) {
        event.stopPropagation();
        event.preventDefault();
      }
      
      fileData[fileType] = { base64: "", name: "", mime: "" };
      
      if (fileType === 'photo') {
        document.getElementById('photoInput').value = "";
        var container = document.getElementById('photoPreview');
        container.classList.add('hidden');
        container.innerHTML = "";
      } else if (fileType === 'ijazah') {
        document.getElementById('ijazahInput').value = "";
        document.getElementById('ijazahPreview').classList.add('hidden');
      }
    }

    /**
     * Multi-step Navigation Progress Update
     */
    function updateStepsUI() {
      // 1. Progress Bar line
      var barLine = document.getElementById('stepProgressActiveLine');
      if (currentStepVal === 1) barLine.style.width = '0%';
      if (currentStepVal === 2) barLine.style.width = '50%';
      if (currentStepVal === 3) barLine.style.width = '100%';

      // 2. Hide all sections
      document.getElementById('stepSection1').classList.add('hidden');
      document.getElementById('stepSection2').classList.add('hidden');
      document.getElementById('stepSection3').classList.add('hidden');

      // Show active section
      document.getElementById('stepSection' + currentStepVal).classList.remove('hidden');

      // 3. Update Bubbles style
      var activeRing = 'ring-4 ring-blue-105 ring-blue-100 bg-unsa-navy text-white';
      var inactiveClass = 'bg-slate-200 text-slate-500 ring-0';
      var passedClass = 'bg-unsa-gold text-slate-950 ring-4 ring-amber-100 font-black';

      // Step 1
      var step1 = document.getElementById('badgeStep1');
      if (currentStepVal == 1) {
        step1.className = 'w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ' + activeRing;
        step1.innerHTML = '1';
      } else {
        step1.className = 'w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ' + passedClass;
        step1.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg>';
      }

      // Step 2
      var step2 = document.getElementById('badgeStep2');
      if (currentStepVal == 2) {
        step2.className = 'w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ' + activeRing;
        step2.innerHTML = '2';
      } else if (currentStepVal > 2) {
        step2.className = 'w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ' + passedClass;
        step2.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg>';
      } else {
        step2.className = 'w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ' + inactiveClass;
        step2.innerHTML = '2';
      }

      // Step 3
      var step3 = document.getElementById('badgeStep3');
      if (currentStepVal == 3) {
        step3.className = 'w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ' + activeRing;
        step3.innerHTML = '3';
      } else {
        step3.className = 'w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ' + inactiveClass;
        step3.innerHTML = '3';
      }

      // 4. Update Actions buttons visibility
      var prevBtn = document.getElementById('prevBtn');
      var nextBtn = document.getElementById('nextBtn');
      var submitBtn = document.getElementById('submitBtn');

      if (currentStepVal === 1) {
        prevBtn.classList.add('hidden');
        nextBtn.classList.remove('hidden');
        submitBtn.classList.add('hidden');
      } else {
        prevBtn.classList.remove('hidden');
        if (currentStepVal === 3) {
          nextBtn.classList.add('hidden');
          submitBtn.classList.remove('hidden');
        } else {
          nextBtn.classList.remove('hidden');
          submitBtn.classList.add('hidden');
        }
      }
    }

    /**
     * Validate fields manually for each step for rich UX
     */
    function validateStep(step) {
      if (step === 1) {
        var name = document.getElementById('fullNameInput').value;
        var email = document.getElementById('emailInput').value;
        var phone = document.getElementById('phoneInput').value;
        var gender = document.getElementById('genderInput').value;
        var birthPlace = document.getElementById('placeOfBirthInput').value;
        var birthDate = document.getElementById('dateOfBirthInput').value;

        if (!name || !email || !phone || !gender || !birthPlace || !birthDate) {
          alert("Harap lengkapi semua isian bertanda bintang (*) pada Biodata.");
          return false;
        }
        
        // Simple regex emails check
        if (!email.includes('@')) {
          alert("Silakan masukkan alamat email yang valid.");
          return false;
        }
      } else if (step === 2) {
        var school = document.getElementById('schoolOriginInput').value;
        var major = document.getElementById('majorNameInput').value;

        if (!school || !major) {
          alert("Harap isi Asal Sekolah Anda dan Pilih Program Studi yang diinginkan.");
          return false;
        }
      }
      return true;
    }

    // Trigger going to next step
    function nextStep() {
      if (validateStep(currentStepVal)) {
        currentStepVal += 1;
        updateStepsUI();
        document.getElementById('registrasi').scrollIntoView({ behavior: 'smooth' });
      }
    }

    // Trigger going back to previous step
    function prevStep() {
      if (currentStepVal > 1) {
        currentStepVal -= 1;
        updateStepsUI();
      }
    }

    /**
     * Switches visual core frames (Form vs Loading vs Success)
     */
    function setScreen(screenName) {
      var form = document.getElementById('pmbForm');
      var overlay = document.getElementById('loadingOverlay');
      var success = document.getElementById('successView');
      
      form.classList.add('hidden');
      overlay.classList.add('hidden');
      success.classList.add('hidden');
      
      if (screenName === 'form') {
        form.classList.remove('hidden');
      } else if (screenName === 'loading') {
        overlay.classList.remove('hidden');
        overlay.style.display = 'flex';
      } else if (screenName === 'success') {
        success.classList.remove('hidden');
        success.style.display = 'flex';
      }
    }

    /**
     * Update dynamic loading progress bar
     */
    function updateProgress(value, text, barElement) {
      barElement.style.width = value + '%';
      document.getElementById('loadingStatus').innerText = text;
    }

    /**
     * Trigger Core success visual viewport
     */
    function showSuccessScreen(result) {
      document.getElementById('regIdField').innerText = result.noPendaftaran;
      document.getElementById('regNameField').innerText = result.fullName;
      document.getElementById('regMajorField').innerText = result.majorName;
      document.getElementById('regTimeField').innerText = result.timestamp;
      
      setScreen('success');
      document.getElementById('registrasi').scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Form Handler submit trigger
     */
    function handleFormSubmit(event) {
      event.preventDefault();
      
      if (!validateStep(3)) return;

      var agreedCheck = document.getElementById('agreedTerms').checked;
      if (!agreedCheck) {
        alert("Anda harus menyetujui pernyataan kebenaran berkas pendaftaran.");
        return;
      }

      // Check required uploads in step 3
      if (!fileData.photo.base64) {
        alert("Silakan unggah Pas Foto Formal 3x4 terlebih dahulu.");
        return;
      }
      if (!fileData.ijazah.base64) {
        alert("Silakan unggah lampiran Scan Ijazah atau SKL Anda.");
        return;
      }

      var form = event.target;
      var loadingBar = document.getElementById('loadingBar');
      
      setScreen('loading');
      updateProgress(15, "Menyiapkan enkripsi transmisi data...", loadingBar);
      
      setTimeout(function() {
        updateProgress(45, "Unggah Pas Foto diri ke Google Drive...", loadingBar);
      }, 700);

      setTimeout(function() {
        updateProgress(70, "Unggah Scan Ijazah Sekolah Menengah...", loadingBar);
      }, 1400);

      setTimeout(function() {
        updateProgress(90, "Sinkronisasi entri ke Google Sheets database...", loadingBar);
      }, 2100);

      // Package payload data matches exact backend structure
      var payload = {
        fullName: document.getElementById('fullNameInput').value,
        email: document.getElementById('emailInput').value,
        phone: document.getElementById('phoneInput').value,
        gender: document.getElementById('genderInput').value,
        schoolOrigin: document.getElementById('schoolOriginInput').value,
        placeOfBirth: document.getElementById('placeOfBirthInput').value,
        dateOfBirth: document.getElementById('dateOfBirthInput').value,
        majorName: document.getElementById('majorNameInput').value,
        
        photoData: fileData.photo.base64,
        photoName: fileData.photo.name,
        photoMime: fileData.photo.mime,
        
        ijazahData: fileData.ijazah.base64,
        ijazahName: fileData.ijazah.name,
        ijazahMime: fileData.ijazah.mime
      };

      // Server check GAS
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(result) {
            if (result.success) {
              updateProgress(100, "Registrasi Sukses!", loadingBar);
              setTimeout(function() {
                showSuccessScreen(result);
              }, 400);
            } else {
              setScreen('form');
              alert("Gagal memproses pendaftaran: " + result.message);
            }
          })
          .withFailureHandler(function(error) {
            setScreen('form');
            alert("Kesalahan transmisi jaringan: " + error.message);
          })
          .prosesPendaftaran(payload);
      } else {
        // Local preview simulation
        setTimeout(function() {
          updateProgress(100, "Berhasil disinkronisasikan!", loadingBar);
          
          var yearVal = "${config.idFormat.split("-")[1] || "2026"}";
          var prefixVal = "${config.idFormat.split("-")[0] || "UNSA"}";
          var randNum = Math.floor(Math.random() * 850) + 120;
          
          var mockResult = {
            success: true,
            noPendaftaran: prefixVal + "-" + yearVal + "-" + randNum,
            fullName: payload.fullName,
            majorName: payload.majorName,
            timestamp: new Date().toLocaleString('id-ID')
          };
          
          setTimeout(function() {
            showSuccessScreen(mockResult);
          }, 600);
        }, 3000);
      }
    }

    /**
     * Clear and restarts form states
     */
    function restartForm() {
      document.getElementById('pmbForm').reset();
      
      resetFile('photo');
      resetFile('ijazah');
      document.getElementById('agreedTerms').checked = false;

      currentStepVal = 1;
      updateStepsUI();
      
      setScreen('form');
      document.getElementById('registrasi').scrollIntoView({ behavior: 'smooth' });
    }
  </script>
</body>
</html>
`;
}
