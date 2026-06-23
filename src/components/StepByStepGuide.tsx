import React, { useState } from "react";
import { Compass, BookOpen, Layers, CheckCircle, ShieldCheck, Mail, Users, ArrowRight, HelpCircle } from "lucide-react";

export default function StepByStepGuide() {
  const [activeStep, setActiveStep] = useState<number>(1);

  const steps = [
    {
      id: 1,
      title: "1. Spreadsheet & Drive",
      short: "Persiapan Lingkungan",
      icon: Compass,
    },
    {
      id: 2,
      title: "2. Menulis Kode",
      short: "Salin Code & HTML",
      icon: BookOpen,
    },
    {
      id: 3,
      title: "3. Penerapan (Deploy)",
      short: "Jadikan Web App",
      icon: Layers,
    },
    {
      id: 4,
      title: "4. Izin & Otorisasi",
      short: "Bypass Keamanan",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" id="step-by-step-guide">
      {/* Header */}
      <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-800">
        <h2 className="text-white font-extrabold text-sm tracking-wide uppercase flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-400" />
          Panduan Pemasangan Google Apps Script (GAS)
        </h2>
        <span className="text-[10px] bg-slate-800 text-slate-350 px-2.5 py-1 rounded font-bold">
          Manual Lengkap (Bahasa Indonesia)
        </span>
      </div>

      {/* Guide Steps selectors */}
      <div className="bg-slate-50 flex border-b border-slate-100 overflow-x-auto scrollbar-none divide-x divide-slate-100" id="guide-tabs">
        {steps.map((step) => {
          const Icon = step.icon;
          const isActive = activeStep === step.id;
          return (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className={`flex-1 min-w-[130px] px-4 py-3.5 text-left transition relative cursor-pointer focus:outline-none ${
                isActive ? "bg-white" : "hover:bg-slate-100/50"
              }`}
              id={`tab-step-${step.id}`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                  isActive ? "bg-blue-900 text-amber-400" : "bg-slate-200 text-slate-500"
                }`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className={`text-xs font-extrabold leading-tight ${isActive ? "text-slate-900" : "text-slate-500"}`}>
                    {step.title}
                  </h4>
                  <p className="text-[9px] text-slate-400 font-medium whitespace-nowrap mt-0.5">{step.short}</p>
                </div>
              </div>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-400"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Body Content */}
      <div className="p-6 md:p-8">
        
        {/* Step 1: Persiapan */}
        {activeStep === 1 && (
          <div className="space-y-4 animate-fade-in text-sm text-slate-600 leading-relaxed">
            <h3 className="text-base font-extrabold text-slate-905 flex items-center gap-2">
              <span className="bg-slate-800 text-white text-xs w-5.5 h-5.5 rounded-full flex items-center justify-center font-bold">1</span>
              Persiapan Akun, Google Drive, & Google Sheets
            </h3>
            
            <p className="text-xs">
              Pertama-tama, persiapkan wadah folder di Google Drive Anda untuk menampung file-file calon mahasiswa dan Spreadsheet yang akan bertindak sebagai basis data pusat (cloud database).
            </p>

            <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-3.5">
              <div className="flex gap-2.5">
                <span className="w-5 h-5 bg-blue-105 text-blue-900 rounded-full font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">A</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Membuat Folder Penyimpanan Berkas</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Buka Google Drive (<a href="https://drive.google.com" target="_blank" rel="noreferrer" className="text-blue-600 underline">drive.google.com</a>), buat folder baru bernama <strong>&quot;PMB UNSA 2026&quot;</strong>. Masuklah ke dalam folder tersebut.
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <span className="w-5 h-5 bg-blue-105 text-blue-900 rounded-full font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">B</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Mendapatkan ID Folder Google Drive (Penting)</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Ketika Anda di dalam folder tersebut, perhatikan tautan (URL) di address bar browser Anda. Suku kata acak di ujung URL setelah <code>/folders/</code> adalah ID Folder Anda. 
                  </p>
                  <p className="font-mono text-[10px] mt-2 bg-slate-900 text-amber-300 p-2 rounded-lg break-all select-all inline-block">
                    Contoh: https://drive.google.com/drive/folders/<strong>1_Apx8X90uT-vF8b72-3y-XgU89AnK9z</strong>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    * Salin ID folder unik tersebut (di contoh adalah yang ditebalkan) dan masukkan ke kolom konfigurasi di sebelah kiri.
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <span className="w-5 h-5 bg-blue-105 text-blue-900 rounded-full font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">C</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Membuat Google Spreadsheet Database</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Di dalam folder &quot;PMB UNSA 2026&quot; tersebut, buatlah Google Sheets baru. Beri judul bebas (misal: <strong>Database PMB UNSA 2026</strong>).
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveStep(2)}
              className="mt-2 text-xs font-extrabold text-blue-900 bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-blue-100 transition shadow-sm ml-auto cursor-pointer"
            >
              Lanjutkan ke Menulis Kode
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Step 2: Menulis Kode */}
        {activeStep === 2 && (
          <div className="space-y-4 animate-fade-in text-sm text-slate-600 leading-relaxed">
            <h3 className="text-base font-extrabold text-slate-905 flex items-center gap-2">
              <span className="bg-slate-800 text-white text-xs w-5.5 h-5.5 rounded-full flex items-center justify-center font-bold">2</span>
              Memasang Komponen Kode di Google Apps Script editor
            </h3>
            
            <p className="text-xs">
              Sekarang kita akan memasang kode Backend (Code.gs) dan Frontend (Index.html) yang telah di-generate ke dalam platform Google Apps Script melalui spreadsheet Anda.
            </p>

            <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-3.5">
              <div className="flex gap-2.5">
                <span className="w-5 h-5 bg-blue-105 text-blue-900 rounded-full font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">A</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Buka Google Apps Script Editor</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Di dalam Google Spreadsheet yang baru Anda buat tadi, cari menu atas: Klik <strong>Ekstensi</strong> (atau <em>Extensions</em>) &gt; klik <strong>Apps Script</strong>.
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <span className="w-5 h-5 bg-blue-105 text-blue-900 rounded-full font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">B</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Isi Berkas Code.gs</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Anda akan melihat file bawaan bernama <code>Code.gs</code>. Klik dua kali file tersebut, hapus seluruh isinya, lalu <strong>salin (copy) dan tempel (paste)</strong> semua baris kode yang ada di tab <strong>&quot;Code.gs (Backend)&quot;</strong> di atas.
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <span className="w-5 h-5 bg-blue-105 text-blue-900 rounded-full font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">C</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Buat Berkas Baru Index.html</h4>
                  <ol className="list-decimal list-inside text-[11px] text-slate-500 space-y-1 mt-1 pl-1">
                    <li>Di bilah kiri editor Apps Script (tepat di atas tulisan &apos;Berkas&apos; / <em>Files</em>), klik tombol ikon <strong>+</strong> (Plus).</li>
                    <li>Pilih jenis berkas <strong>HTML</strong>.</li>
                    <li>Ketikkan nama berkas secara persis: <code>Index</code> (tanpa menuliskan akhiran .html). Tekan Enter.</li>
                    <li>Buka file <code>Index.html</code> tersebut, hapus struktur dasar yang ada, lalu <strong>salin dan tempel (paste)</strong> seluruh baris kode dari tab <strong>&quot;Index.html (Frontend)&quot;</strong> di editor ini.</li>
                  </ol>
                </div>
              </div>

              <div className="flex gap-2.5">
                <span className="w-5 h-5 bg-blue-105 text-blue-900 rounded-full font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">D</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Simpan Proyek</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Klik tombol ikon disket (<strong>Simpan Proyek</strong>) di bar menu atas editor Apps Script, atau tekan kombinasi tombol <code>Ctrl + S</code>.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs mt-2">
              <button
                onClick={() => setActiveStep(1)}
                className="text-slate-500 font-bold hover:text-slate-700 transition"
              >
                Kembali ke Sebelumnya
              </button>
              
              <button
                onClick={() => setActiveStep(3)}
                className="text-xs font-extrabold text-blue-900 bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-blue-100 transition shadow-sm cursor-pointer"
              >
                Lanjutkan ke Deploy Web App
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Deploy */}
        {activeStep === 3 && (
          <div className="space-y-4 animate-fade-in text-sm text-slate-600 leading-relaxed">
            <h3 className="text-base font-extrabold text-slate-905 flex items-center gap-2">
              <span className="bg-slate-800 text-white text-xs w-5.5 h-5.5 rounded-full flex items-center justify-center font-bold">3</span>
              Melakukan Deploy (Penerapan) sebagai Web Application Publik
            </h3>
            
            <p className="text-xs">
              Pada tahap ini, kita akan menginstruksikan server Google Cloud untuk merakit program kita menjadi sebuah tautan link resmi dan aman yang dapat diklik oleh publik dunia maya.
            </p>

            <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-3.5">
              <div className="flex gap-2.5">
                <span className="w-5 h-5 bg-blue-105 text-blue-900 rounded-full font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">A</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Buka Menu Penerapan Baru</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Di sisi kanan atas sudut halaman editor Apps Script Anda, klik tombol biru <strong>Tepatkan / Deploy</strong> &gt; pilih opsi <strong>Penerapan baru (New deployment)</strong>.
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <span className="w-5 h-5 bg-blue-105 text-blue-900 rounded-full font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">B</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Silakan Pilih Jenis &apos;Aplikasi Web&apos;</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Klik ikon roda gigi kecil (Pilih Jenis) di baris kiri atas modal dialog &quot;Terapkan baru&quot;, lalu pilihlah opsi <strong>Aplikasi Web (Web App)</strong>.
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <span className="w-5 h-5 bg-blue-105 text-blue-900 rounded-full font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">C</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Atur Hak Akses Secara Tepat (Penting!)</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Untuk menjamin formulir pendaftaran berjalan lancar, atur pengaturan konfigurasinya sebagai berikut:
                  </p>
                  <ul className="list-disc list-inside text-[11px] text-slate-600 mt-2 space-y-1 bg-white border border-slate-100 p-2.5 rounded-lg font-medium">
                    <li>
                      <strong>Jalankan sebagai (Execute as):</strong> Pilihlah opsi <span className="text-blue-700 font-bold">Saya (Me - email_anda@gmail.com)</span>. Hal ini memberi wewenang script untuk menyisipkan berkas ke Drive Anda.
                    </li>
                    <li>
                      <strong>Siapa yang memiliki akses (Who has access):</strong> Pilihlah opsi <span className="text-blue-700 font-bold">Siapa saja (Anyone)</span>. Hal ini memperbolehkan calon mahasiswa baru membuka dan mengisi formulir tanpa wajib memiliki / login akun Google apapun.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-2.5">
                <span className="w-5 h-5 bg-blue-105 text-blue-900 rounded-full font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">D</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Luncurkan Deploy</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tulis diskripsi ringkas (misalkan: <code>PMB UNSA Online v1.0</code>) kemudian klik tombol biru <strong>Terapkan (Deploy)</strong> di pojok kanan bawah modal.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs mt-2">
              <button
                onClick={() => setActiveStep(2)}
                className="text-slate-505 font-bold hover:text-slate-700 transition"
              >
                Kembali ke Sebelumnya
              </button>
              
              <button
                onClick={() => setActiveStep(4)}
                className="text-xs font-extrabold text-blue-900 bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-blue-100 transition shadow-sm cursor-pointer"
              >
                Lanjutkan ke Otorisasi Izin
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Authorization Bypass */}
        {activeStep === 4 && (
          <div className="space-y-4 animate-fade-in text-sm text-slate-600 leading-relaxed">
            <h3 className="text-base font-extrabold text-slate-905 flex items-center gap-2">
              <span className="bg-slate-800 text-white text-xs w-5.5 h-5.5 rounded-full flex items-center justify-center font-bold">4</span>
              Otorisasi Keamanan Akun Google Anda
            </h3>
            
            <p className="text-xs">
              Karena kode program ini berinteraksi langsung mengirim file ke Google Drive Anda dan mencatat data Spreadsheet, Google mewajibkan Anda memberikan persetujuan akses keamanan akun internal.
            </p>

            <div className="bg-yellow-50/70 border border-yellow-200 p-4 rounded-xl space-y-4">
              <div className="flex gap-2.5">
                <span className="w-5 h-5 bg-amber-200 text-amber-900 rounded-full font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Pemberian Otorisasi</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Sebuah pop-up modal berlaber &quot;Otorisasi diperlukan&quot; (Authorization required) akan muncul. Klik tautan tombol <strong>Izinkan Akses (Authorize Access)</strong> dan pilih Akun Google Anda.
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <span className="w-5 h-5 bg-amber-200 text-amber-900 rounded-full font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Melewati Peringatan Keamanan Google (Safe Bypass)</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Google biasanya menampilkan layar merah bertuliskan <em>&quot;Google belum memverifikasi aplikasi ini&quot; (Google hasn&apos;t verified this app)</em>. 
                  </p>
                  <p className="text-[11px] text-slate-600 mt-1.5 font-semibold">
                    Cara melewati layar ini dengan aman:
                  </p>
                  <ol className="list-decimal list-inside text-[11px] text-slate-500 mt-1.5 space-y-1.5">
                    <li>Klik tautan bertuliskan <strong className="text-slate-850">Lanjutan / Advanced</strong> di sisi sudut kiri bawah.</li>
                    <li>Klik tautan paling bawah yang bertuliskan <strong className="text-slate-850">Buka Proyek Tanpa Judul (tidak aman)</strong> atau <strong className="text-slate-850">Go to Project (unsafe)</strong>. Seluruh kode ini adalah kode milik pribadi Anda sendiri, sehingga dijamin 100% aman disetujui.</li>
                    <li>Klik tombol biru besar <strong className="text-slate-850">Izinkan / Allow</strong>.</li>
                  </ol>
                </div>
              </div>

              <div className="flex gap-2.5">
                <span className="w-5 h-5 bg-amber-200 text-amber-900 rounded-full font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-950 flex items-center gap-1.5 text-emerald-800 font-extrabold">
                    <CheckCircle className="w-4 h-4 text-emerald-600 stroke-[2.5px]" />
                    Selesai! Web App Link Diterbitkan
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-1 font-medium leading-relaxed">
                    Setelah izin berhasil disetujui, editor Google Apps Script akan membagikan tautan <strong>Aplikasi Web URL (Web App URL)</strong> ke Anda. URL ini biasanya berakhiran dengan baris <code>/exec</code>.
                  </p>
                  <p className="text-[11px] text-slate-700 mt-1 leading-snug font-bold">
                    Tautan inilah yang dapat Anda sebarkan di sosial media atau disematkan di website resmi Universitas Surakarta (UNSA) untuk digunakan langsung oleh calon mahasiswa baru!
                  </p>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 text-center flex items-center gap-1 justify-center pt-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              Butuh bimbingan tambahan? Hubungi Administrator TI Kampus UNSA.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
