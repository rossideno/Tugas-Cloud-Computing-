import React, { useState, useMemo } from "react";
import { GeneratorConfig } from "./types";
import { DEFAULT_UNSA_MAJORS } from "./data/unsaMajors";
import { generateCodeGs, generateIndexHtml } from "./utils/codeGenerator";
import ConfigPanel from "./components/ConfigPanel";
import CodeViewer from "./components/CodeViewer";
import InteractiveFormPreview from "./components/InteractiveFormPreview";
import StepByStepGuide from "./components/StepByStepGuide";
import { 
  Sparkles, 
  Code, 
  Eye, 
  BookOpen, 
  Heart, 
  Wrench,
  Award,
  MapPin,
  Phone,
  Mail,
  Info,
  ChevronRight,
  X,
  FileCode,
  ShieldCheck
} from "lucide-react";

export default function App() {
  // Setup default configuration for PMB UNSA
  const [config, setConfig] = useState<GeneratorConfig>({
    campusName: "Universitas Surakarta",
    campusNickname: "UNSA",
    spreadsheetName: "Data Pendaftar",
    driveFolderId: "1A2b3c4d5e6f7G8h9I_SalingKodeUnikDrive",
    idFormat: "UNSA-2026-###",
    enableEmailNotification: true,
    adminEmail: "pmb.unsa@gmail.com",
    majors: DEFAULT_UNSA_MAJORS,
  });

  const [activeTab, setActiveTab] = useState<"code" | "guide">("code");
  const [showDevModal, setShowDevModal] = useState<boolean>(false);

  // Dynamically generate code on configuration changes
  const generatedCodeGs = useMemo(() => generateCodeGs(config), [config]);
  const generatedIndexHtml = useMemo(() => generateIndexHtml(config), [config]);

  // Group majors by faculty for student display
  const groupedMajors = useMemo(() => {
    const groups: { [key: string]: typeof DEFAULT_UNSA_MAJORS } = {};
    config.majors.forEach((m) => {
      if (!groups[m.faculty]) {
        groups[m.faculty] = [];
      }
      groups[m.faculty].push(m);
    });
    return groups;
  }, [config.majors]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans text-slate-800">
      
      {/* 1. PRINCIPAL CAMPUS MENU NAVBAR */}
      <nav className="bg-unsa-blue-900 border-b-4 border-unsa-gold-500 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Campus Emblem Logo */}
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md shrink-0 border-2 border-unsa-gold-500 text-unsa-blue-900 font-extrabold text-lg">
              U
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-white font-black text-sm tracking-wide uppercase">Universitas Surakarta</h1>
                <span className="bg-unsa-gold-500 text-slate-900 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                  PMB 2026
                </span>
              </div>
              <p className="text-[10px] text-blue-200 uppercase tracking-widest font-bold">Portal Resmi Pendaftaran Mahasiswa Baru</p>
            </div>
          </div>

          {/* Nav Links and Developer Activation trigger */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-5 text-xs font-bold text-white/90">
              <span className="border-b-2 border-unsa-gold-500 pb-0.5 cursor-default text-unsa-gold-500">Beranda</span>
              <span className="hover:text-unsa-gold-500 cursor-pointer transition" onClick={() => {
                const el = document.getElementById("program-studi-section");
                el?.scrollIntoView({ behavior: "smooth" });
              }}>Program Studi</span>
              <span className="hover:text-unsa-gold-500 cursor-pointer transition" onClick={() => {
                const el = document.getElementById("persyaratan-section");
                el?.scrollIntoView({ behavior: "smooth" });
              }}>Persyaratan</span>
              <span className="hover:text-unsa-gold-500 cursor-pointer transition" onClick={() => {
                const el = document.getElementById("registrasi-form");
                el?.scrollIntoView({ behavior: "smooth" });
              }}>Isi Formulir</span>
            </div>

            <div className="h-4 w-px bg-blue-800 hidden md:block"></div>

            {/* THE DEVELOPER WORKSPACE INGRESS TRIGGER */}
            <button
              onClick={() => setShowDevModal(true)}
              className="bg-gradient-to-r from-unsa-gold-500 to-amber-500 hover:from-unsa-gold-600 hover:to-amber-600 text-slate-950 px-3.5 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow transition-all duration-250 cursor-pointer border border-unsa-gold-400 hover:scale-[1.02]"
              title="Dapatkan kode Apps Script Anda"
            >
              <Wrench className="w-3.5 h-3.5 text-slate-950 animate-bounce" />
              <span>Dapatkan Kode GAS / Panduan</span>
            </button>
          </div>
        </div>
      </nav>

      {/* 2. CAMPUS PROMOTIONAL WELCOME PANEL (STUDENT HUB HERO) WITH FIGMA METRICS */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-10 w-full relative" id="main-content">
        
        {/* Floating Background Glow Accents - Figma Style */}
        <div className="absolute top-20 left-12 w-72 h-72 bg-blue-600/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/2 right-10 w-80 h-80 bg-unsa-gold-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        {/* Figma Hero Canvas with Mesh Background */}
        <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl border border-slate-800 transition-all hover:border-slate-700/60 duration-350">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-unsa-gold-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 max-w-4xl space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-unsa-gold-500/10 to-amber-500/10 text-unsa-gold-400 border border-unsa-gold-500/20 rounded-xl text-[10px] font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-unsa-gold-500 animate-spin" style={{ animationDuration: '4s' }} />
              Gelombang I - PMB Universitas Surakarta Resmi Aktif
            </div>
            
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Ayo Bergabung Bersama <span className="text-transparent bg-clip-text bg-gradient-to-r from-unsa-gold-400 via-amber-300 to-yellow-250">Universitas Surakarta</span> Generasi 2026!
            </h2>
            
            <p className="text-xs md:text-sm text-slate-350 leading-relaxed max-w-3xl">
              Siapkan diri Anda menjadi bagian dari kampus digital terkemuka yang melahirkan lulusan unggul, adaptif, dan siap kerja. Pengisian data pendaftaran mahasiswa baru (PMB) online kini semakin aman, transparan, dan terhubung real-time ke database panitia melalui teknologi Google Cloud Integration. Unjuk karya terbaik Anda bersama UNSA!
            </p>

            {/* Quick Live Stats Row (Bento Style) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80">
              <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-4 transition hover:bg-slate-950/60 hover:scale-[1.02]">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">Status Sinkronisasi</span>
                <span className="text-sm font-black text-emerald-400 block flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  99.9% Real-time
                </span>
              </div>
              <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-4 transition hover:bg-slate-950/60 hover:scale-[1.02]">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">Kapasitas Lampiran</span>
                <span className="text-sm font-black text-amber-400 block">Maks 2MB / Berkas</span>
              </div>
              <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-4 transition hover:bg-slate-950/60 hover:scale-[1.02]">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">Respons Email</span>
                <span className="text-sm font-black text-blue-400 block">&lt; 3 Detik Instan</span>
              </div>
              <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-4 transition hover:bg-slate-950/60 hover:scale-[1.02]">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">Jurusan Aktif</span>
                <span className="text-sm font-black text-white block">{config.majors.length} Program Studi</span>
              </div>
            </div>
          </div>
        </div>
 
        {/* 3. PRIMARY SPLIT LAYOUT (Student Info Panel left, Authentic Form Registration right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
          
          {/* INFORMATIONAL BLOCK (Left - Span 5) */}
          <section className="lg:col-span-5 space-y-6">
            
            {/* Timeline & Persyaratan */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-5 transition-all hover:shadow-md duration-300" id="persyaratan-section">
              <div>
                <span className="text-[10px] bg-gradient-to-r from-unsa-blue-900 to-blue-800 text-white px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider shadow-sm">
                  Timeline Gelombang 1
                </span>
                <h3 className="text-xl font-bold text-unsa-blue-900 mt-3.5">Ketentuan & Jadwal Seleksi</h3>
                <p className="text-xs text-slate-500 mt-1">Pendaftaran Gelombang 1 dibuka dari tanggal 1 Maret hingga 31 Agustus 2026.</p>
              </div>

              {/* Requirements checklist */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Persyaratan Dokumen (Softcopy):</h4>
                <div className="grid grid-cols-1 gap-2.5">
                  <div className="flex items-start gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100/80 hover:bg-slate-100/30 transition">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs shrink-0 mt-0.5 shadow-sm">✓</div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Pas Foto Formal Terbaru (3x4)</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Latar merah/biru bebas rapi, maksimal berkas berukuran 2MB (.JPG/.PNG).</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100/80 hover:bg-slate-100/30 transition">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs shrink-0 mt-0.5 shadow-sm">✓</div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Scan Ijazah / SKL Asli</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Format PDF / JPG, memuat tanda tangan kepala sekolah & cap basah lembaga.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informative Step-by-Step Flow */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Alur Pendaftaran PMB Online:</h4>
                <div className="relative border-l-2 border-slate-200/80 ml-3 pl-4 space-y-4 text-xs">
                  <div className="relative">
                    <div className="absolute -left-[23px] top-0.5 w-4 h-4 rounded-full bg-unsa-blue-900 border-2 border-white shadow-sm flex items-center justify-center text-[8px] text-white font-bold">1</div>
                    <span className="font-bold text-slate-900">Isi Formulir Biodata Diri</span>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-0.5">Gunakan nama lengkap sesuai ijazah pendidikan terakhir Anda.</p>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[23px] top-0.5 w-4 h-4 rounded-full bg-unsa-blue-900 border-2 border-white shadow-sm flex items-center justify-center text-[8px] text-white font-bold">2</div>
                    <span className="font-bold text-slate-900">Pilih Program Studi Pilihan</span>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-0.5">Sesuaikan jurusan minatan yang ada di daftar fakultas kami.</p>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[23px] top-0.5 w-4 h-4 rounded-full bg-unsa-blue-900 border-2 border-white shadow-sm flex items-center justify-center text-[8px] text-white font-bold">3</div>
                    <span className="font-bold text-slate-900">Unggah Lampiran & Kirim Dokumen</span>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-0.5">Sistem akan melakukan verifikasi format lampiran secara otomatis.</p>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[23px] top-0.5 w-4 h-4 rounded-full bg-unsa-gold-500 border-2 border-white shadow-sm flex items-center justify-center text-[8px] text-slate-950 font-black">✓</div>
                    <span className="font-bold text-slate-900 flex items-center gap-1">
                      Peroleh Voucher Bukti Registrasi
                      <span className="bg-emerald-100 text-emerald-800 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Otomatis G-Sheet</span>
                    </span>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed font-semibold text-emerald-600 mt-0.5">Simpan voucher digital dan unduh format cetakan resminya.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* List of Majors grouping (Catalog format for students) */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4 transition-all hover:shadow-md duration-300" id="program-studi-section">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="w-8 h-8 rounded-xl bg-unsa-gold-500/10 flex items-center justify-center">
                  <Award className="w-4 h-4 text-unsa-gold-600 font-extrabold" />
                </div>
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider">Katalog Fakultas & Program Studi</h3>
              </div>
              
              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2 scrollbar-thin">
                {Object.keys(groupedMajors).map((faculty) => (
                  <div key={faculty} className="space-y-2">
                    <span className="text-[9px] font-black text-unsa-blue-900 bg-unsa-blue-50/70 border border-unsa-blue-100 px-2 py-1 rounded-md uppercase tracking-wider inline-block">
                      {faculty}
                    </span>
                    <div className="grid grid-cols-1 gap-1.5 pl-1">
                      {groupedMajors[faculty].map((major) => (
                        <div key={major.id} className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50/60 px-3 py-2 rounded-xl border border-slate-100 font-bold hover:bg-slate-50 transition cursor-default">
                          <ChevronRight className="w-3.5 h-3.5 text-unsa-gold-500 shrink-0" />
                          <span>{major.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact / Helpdesk details */}
            <div className="bg-gradient-to-br from-slate-950 to-slate-900 text-white rounded-3xl p-6 shadow-md space-y-3.5 relative overflow-hidden border border-slate-800">
              <div className="absolute right-0 bottom-0 opacity-10 font-black text-7xl tracking-widest leading-none pointer-events-none select-none">UNSA</div>
              <h4 className="text-[10px] font-black uppercase text-unsa-gold-500 tracking-wider">Hubungi Layanan & Bantuan PMB:</h4>
              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-unsa-gold-500 shrink-0 mt-0.5" />
                  <span className="leading-snug">Jl. Raya Solo-Sari KM. 5, Kota Surakarta, Jawa Tengah (Kampus Utama)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-unsa-gold-500 shrink-0" />
                  <span>+(0271) 123456 | WA: +62 812-3456-7890</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-unsa-gold-500 shrink-0" />
                  <span>pmb@unsa.ac.id / humas@unsa.ac.id</span>
                </div>
              </div>
            </div>

          </section>

          {/* AUTHENTIC WEB REGISTRATION FORM INSIDE MAC BROWSER TEMPLATE (Right - Span 7) */}
          <section className="lg:col-span-7 flex flex-col h-full space-y-4" id="registrasi-form">
            
            {/* Mac Browser Mockup wrapper - extremely popular figma style */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_15px_45px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col transition-all duration-350 hover:shadow-[0_20px_55px_rgba(0,0,0,0.08)]">
              {/* Browser control header bar */}
              <div className="bg-slate-900 px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
                {/* Traffic Dot Controls */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="w-3.5 h-3.5 rounded-full bg-red-400 border border-red-500/10"></div>
                  <div className="w-3.5 h-3.5 rounded-full bg-yellow-400 border border-yellow-500/10"></div>
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 border border-emerald-500/10"></div>
                </div>
                
                {/* Simulated URL bar */}
                <div className="bg-slate-950/80 border border-slate-800/80 text-slate-400 px-4 py-1.5 rounded-xl text-[10px] font-bold font-mono tracking-wide w-full max-w-sm text-center mx-4 truncate select-none">
                  🔒 https://pmb.unsa.ac.id/pendaftaran-online
                </div>
                
                {/* Real-time status indicator */}
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                  <span className="text-[10px] font-black text-white uppercase tracking-wider hidden sm:inline">LIVE FORM</span>
                </div>
              </div>
              
              {/* Form simulator body */}
              <div className="bg-white relative">
                <InteractiveFormPreview config={config} />
              </div>
            </div>

          </section>

        </div>

      </main>

      {/* 4. HIGH-FIDELITY FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-900 text-slate-450 py-10 text-center text-xs w-full mt-16 select-none font-sans relative overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex justify-center items-center gap-2.5 text-slate-500 font-semibold font-mono">
            <span>Universitas Surakarta (Kampus UNSA)</span>
            <span className="w-1.5 h-1.5 bg-unsa-gold-500 rounded-full"></span>
            <span>Online Admission Portal</span>
          </div>
          <p className="font-semibold text-slate-300">© 2026 Universitas Surakarta (UNSA). Seluruh Hak Cipta Dilindungi.</p>
          <div className="flex justify-center items-center gap-1.5 text-[10px] text-slate-500">
            <span>Meningkatkan Mutu Sumber Daya Manusia Indonesia Seutuhnya</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 shrink-0" />
          </div>
          
          {/* Subtle info label so developer knows they can click above or here */}
          <div className="pt-2 text-[10px] text-slate-600 font-semibold">
            Portal ini terintegrasi Google Workspace Cloud. Untuk kepentingan perancangan, 
            <span className="text-unsa-gold-500 mx-1 underline cursor-pointer hover:text-unsa-gold-400 transition" onClick={() => setShowDevModal(true)}>
              Klik disini untuk Membuka Mode Developer (Apps Script Code Generator)
            </span>.
          </div>
        </div>
      </footer>

      {/* 5. DEVELOPER OVERLAY MODAL (The Apps Script Code, Settings, & Step Manual) */}
      {showDevModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-fade-in relative max-h-[850px] border border-slate-200">
            
            {/* Modal Header */}
            <div className="bg-unsa-blue-900 text-white px-6 py-4 flex items-center justify-between border-b-2 border-unsa-gold-550 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-unsa-gold-500 text-slate-950 flex items-center justify-center font-bold">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wide">Developer Workspace (Google Sheets Integration)</h3>
                  <p className="text-[10px] text-blue-200 font-medium">Sesuaikan properti spreadsheet berkas pendaftar dan salin template kode Google Apps Script secara gratis.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDevModal(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition border border-white/15 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Split screen */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-slate-50">
              
              {/* Left Column (Span 4): Configuration slider controls */}
              <div className="lg:col-span-4 border-r border-slate-200 overflow-y-auto p-5">
                <ConfigPanel config={config} onChange={setConfig} />
              </div>

              {/* Right Column (Span 8): Viewers for raw script and step by step deployment instruction */}
              <div className="lg:col-span-8 flex flex-col overflow-hidden">
                
                {/* Modal Tab controller */}
                <div className="bg-white px-5 py-3 border-b border-slate-200 flex gap-2 shrink-0">
                  <button
                    onClick={() => setActiveTab("code")}
                    className={`px-4 py-2 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer border ${
                      activeTab === "code"
                        ? "bg-slate-950 text-white border-transparent shadow shadow-slate-950/20"
                        : "text-slate-500 hover:text-slate-800 bg-slate-50 border-slate-200"
                    }`}
                  >
                    <Code className="w-3.5 h-3.5 text-unsa-gold-500" />
                    Salin Kode Apps Script (Code.gs & Index.html)
                  </button>

                  <button
                    onClick={() => setActiveTab("guide")}
                    className={`px-4 py-2 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer border ${
                      activeTab === "guide"
                        ? "bg-slate-950 text-white border-transparent shadow shadow-slate-950/20"
                        : "text-slate-500 hover:text-slate-800 bg-slate-50 border-slate-200"
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 text-unsa-gold-500" />
                    Panduan Deployment Langkah demi Langkah
                  </button>
                </div>

                {/* Switchable contents scroll viewport */}
                <div className="flex-1 overflow-y-auto p-5" id="developer-workspace-viewport">
                  {activeTab === "code" ? (
                    <CodeViewer codeGs={generatedCodeGs} indexHtml={generatedIndexHtml} />
                  ) : (
                    <StepByStepGuide />
                  )}
                </div>

              </div>

            </div>

            {/* Modal Footer banner */}
            <div className="bg-slate-900 text-slate-450 px-6 py-3.5 text-[10px] flex items-center justify-between border-t border-slate-800 shrink-0">
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Semua berkas skrip murni berjalan di infrastruktur awan Google Drive & Spreadsheet Anda secara cuma-cuma.
              </span>
              <button 
                onClick={() => setShowDevModal(false)}
                className="bg-unsa-gold-550 hover:bg-unsa-gold-600 text-slate-950 px-5 py-1.5 rounded font-black uppercase transition cursor-pointer text-[10px]"
              >
                Selesai & Tutup Workspace
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
