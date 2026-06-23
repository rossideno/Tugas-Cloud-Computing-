import React, { useState } from "react";
import { GeneratorConfig, SubmissionData } from "../types";
import { Upload, FileText, CheckCircle2, RefreshCw, Printer, File, ShieldCheck, Mail, ArrowRight, UserCheck } from "lucide-react";
import { User } from "firebase/auth";
import { googleSignIn, logout, initAuth } from "../utils/firebaseAuth";
import { findOrCreateFolder, uploadFileToFolder, findOrCreateSpreadsheet, appendRowToSpreadsheet, createGoogleForm } from "../utils/googleWorkspace";

interface InteractiveFormPreviewProps {
  config: GeneratorConfig;
}

export default function InteractiveFormPreview({ config }: InteractiveFormPreviewProps) {
  // Setup local states for the simulation
  const [formState, setFormState] = useState<SubmissionData>({
    fullName: "",
    email: "",
    phone: "",
    gender: "",
    placeOfBirth: "",
    dateOfBirth: "",
    schoolOrigin: "",
    majorId: "",
    photoFile: null,
    ijazahFile: null,
  });

  const [simState, setSimState] = useState<"idle" | "loading" | "success">("idle");
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loadingStep, setLoadingStep] = useState(0);
  const [generatedRegId, setGeneratedRegId] = useState("");
  const [subTime, setSubTime] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showPrintStatus, setShowPrintStatus] = useState(false);

  const [agreed, setAgreed] = useState(false);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // Authenticated state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [submitMode, setSubmitMode] = useState<"simulation" | "google">("simulation");
  const [googleFormUrl, setGoogleFormUrl] = useState<string | null>(null);
  const [isCreatingForm, setIsCreatingForm] = useState(false);
  const [liveLinks, setLiveLinks] = useState<{
    spreadsheetUrl?: string;
    folderUrl?: string;
    photoUrl?: string;
    ijazahUrl?: string;
  } | null>(null);

  // Step-by-Step validation flags
  const canGoToStep2 = () => {
    return (
      formState.fullName.trim() !== "" &&
      formState.email.trim() !== "" &&
      formState.phone.trim() !== "" &&
      formState.gender.trim() !== "" &&
      formState.placeOfBirth.trim() !== "" &&
      formState.dateOfBirth.trim() !== ""
    );
  };

  const canGoToStep3 = () => {
    return canGoToStep2() && formState.schoolOrigin.trim() !== "" && formState.majorId.trim() !== "";
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (canGoToStep2()) {
        setCurrentStep(2);
      } else {
        alert("Harap lengkapi semua isian biodata diri Anda pada Tahap 1 terlebih dahulu.");
      }
    } else if (currentStep === 2) {
      if (canGoToStep3()) {
        setCurrentStep(3);
      } else {
        alert("Harap tentukan asal sekolah dan program studi peminatan Anda pada Tahap 2.");
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (step: number) => {
    if (step === 2 && !canGoToStep2()) {
      alert("Harap lengkapi isian biodata diri Anda terlebih dahulu.");
      return;
    }
    if (step === 3) {
      if (!canGoToStep2()) {
        alert("Harap lengkapi isian biodata diri Anda terlebih dahulu.");
        return;
      }
      if (!canGoToStep3()) {
        alert("Harap lengkapi asal sekolah dan program studi terlebih dahulu.");
        return;
      }
    }
    setCurrentStep(step);
  };

  React.useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setGoogleAccessToken(token);
        setSubmitMode("google"); // Default to google mode if signed in
      },
      () => {
        setCurrentUser(null);
        setGoogleAccessToken(null);
        setSubmitMode("simulation");
      }
    );

    return () => {
      unsubscribe();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setGoogleAccessToken(res.accessToken);
        setSubmitMode("google");
      }
    } catch (err) {
      console.error("Login failed:", err);
      alert("Gagal menghubungkan Akun Google Anda. Harap beri izin untuk Google Drive dan Google Sheets saat diminta.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setCurrentUser(null);
      setGoogleAccessToken(null);
      setSubmitMode("simulation");
      setGoogleFormUrl(null);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleCreateForm = async () => {
    if (!googleAccessToken) {
      alert("Silakan hubungkan akun Google Anda terlebih dahulu.");
      return;
    }
    setIsCreatingForm(true);
    try {
      const response = await createGoogleForm(
        googleAccessToken,
        config.campusName,
        config.majors
      );
      if (response && response.responderUri) {
        setGoogleFormUrl(response.responderUri);
        alert(`Google Form Pendaftaran berhasil dibuat!\n\nTautan Form: ${response.responderUri}`);
      }
    } catch (err: any) {
      console.error("Gagal membuat Google Form:", err);
      alert(`Gagal membuat Google Form: ${err.message || err}`);
    } finally {
      setIsCreatingForm(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState({
      ...formState,
      [name]: value,
    });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormState({ ...formState, photoFile: file });
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIjazahChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormState({ ...formState, ijazahFile: e.target.files[0] });
    }
  };

  // Steps for realistic delay
  const simSteps = [
    { text: "Mengamankan transmisi data pendaftaran...", prog: 20 },
    { text: "Melakukan verifikasi format berkas pas foto dan scan ijazah...", prog: 50 },
    { text: "Mengunggah dokumen persyaratan ke pangkalan data akademik UNSA...", prog: 75 },
    { text: "Sinkronisasi data registrasi dan menerbitkan nomor pendaftaran...", prog: 90 },
    { text: "Menyiapkan lembar Voucher Bukti Pendaftaran digital...", prog: 100 },
  ];

  const selectedMajorObj = config.majors.find((m) => m.id === formState.majorId);
  const selectedMajorName = selectedMajorObj ? selectedMajorObj.name : "S1 Teknik Informatika";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return;

    setSimState("loading");
    setLoadingStep(0);

    // If Google sign-in is active, upload real data to Google Drive and append row to Google Sheets
    if (submitMode === "google" && googleAccessToken) {
      try {
        setLoadingStep(0); // "Mengamankan transmisi data pendaftaran..."
        await new Promise((r) => setTimeout(r, 600));

        setLoadingStep(1); // "Melakukan verifikasi format berkas pas foto...)
        await new Promise((r) => setTimeout(r, 600));

        setLoadingStep(2); // "Mengunggah dokumen persyaratan..."
        const folderName = `${config.campusNickname || "UNSA"} PMB 2026`;
        const folderId = await findOrCreateFolder(googleAccessToken, folderName);
        const folderUrl = `https://drive.google.com/drive/folders/${folderId}`;

        let photoUrl = "";
        let ijazahUrl = "";

        if (formState.photoFile) {
          const cleanName = formState.fullName.replace(/\s+/g, "_");
          const photoResult = await uploadFileToFolder(
            googleAccessToken,
            folderId,
            `PasFoto_${cleanName}_${Date.now()}.png`,
            formState.photoFile
          );
          photoUrl = photoResult.webViewLink || `https://drive.google.com/open?id=${photoResult.id}`;
        }

        if (formState.ijazahFile) {
          const cleanName = formState.fullName.replace(/\s+/g, "_");
          const ijazahResult = await uploadFileToFolder(
            googleAccessToken,
            folderId,
            `Ijazah_${cleanName}_${Date.now()}.pdf`,
            formState.ijazahFile
          );
          ijazahUrl = ijazahResult.webViewLink || `https://drive.google.com/open?id=${ijazahResult.id}`;
        }

        setLoadingStep(3); // "Sinkronisasi data registrasi..."
        const spreadsheetId = await findOrCreateSpreadsheet(googleAccessToken, config.spreadsheetName || "Data Pendaftar PMB UNSA 2026");
        const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

        // Create Reg ID
        const prefix = config.idFormat.split("-")[0] || "UNSA";
        const year = config.idFormat.split("-")[1] || "2026";
        const randomNum = Math.floor(Math.random() * 850) + 120;
        const regId = `${prefix}-${year}-${randomNum}`;
        const timestamp = new Date().toLocaleString("id-ID");

        const rowValues = [
          regId,
          formState.fullName,
          formState.email,
          formState.phone,
          selectedMajorName,
          formState.schoolOrigin,
          formState.placeOfBirth || "-",
          formState.dateOfBirth || "-",
          formState.gender || "-",
          photoUrl,
          ijazahUrl,
          timestamp
        ];

        await appendRowToSpreadsheet(googleAccessToken, spreadsheetId, rowValues);

        setLoadingStep(4); // "Menyiapkan lembar Voucher Bukti Pendaftaran..."
        await new Promise((r) => setTimeout(r, 600));

        setLiveLinks({
          spreadsheetUrl,
          folderUrl,
          photoUrl,
          ijazahUrl
        });

        setGeneratedRegId(regId);
        setSubTime(timestamp);
        setSimState("success");

      } catch (error) {
        console.error("Real workspace submit failed:", error);
        alert("Gagal melakukan registrasi riil ke Google Drive/Sheets Anda. Harap periksa koneksi Anda dan coba lagi atau gunakan Mode Simulasi offline.");
        setSimState("idle");
      }
    } else {
      // Standard local sandbox simulation mode
      let currentStep = 0;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(() => {
        currentStep += 1;
        if (currentStep < simSteps.length) {
          setLoadingStep(currentStep);
        } else {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          
          const prefix = config.idFormat.split("-")[0] || "UNSA";
          const year = config.idFormat.split("-")[1] || "2026";
          const randomNum = Math.floor(Math.random() * 85) + 12;
          const paddedNum = randomNum.toString().padStart(3, "0");
          
          setLiveLinks(null);
          setGeneratedRegId(`${prefix}-${year}-${paddedNum}`);
          setSubTime(new Date().toLocaleString("id-ID"));
          setSimState("success");
        }
      }, 700);
    }
  };

  const handleReset = () => {
    setFormState({
      fullName: "",
      email: "",
      phone: "",
      gender: "",
      placeOfBirth: "",
      dateOfBirth: "",
      schoolOrigin: "",
      majorId: "",
      photoFile: null,
      ijazahFile: null,
    });
    setPhotoPreview(null);
    setAgreed(false);
    setCurrentStep(1);
    setSimState("idle");
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-250 shadow-xl overflow-hidden flex flex-col h-full" id="form-registration-stage">
      <div className="flex-1 bg-white relative flex flex-col">
        
        {/* State 1: Fill Form */}
        {simState === "idle" && (
          <div className="flex-grow flex flex-col justify-between">
            {/* Kampus Banner */}
            <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 text-white px-5 py-6 border-b-4 border-amber-400 shrink-0 relative">
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-full p-1.5 flex items-center justify-center shadow">
                  <svg className="w-8 h-8 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
                    <path d="M4.14 12.18L12 16.47l7.86-4.29V14c0 3-3.86 5-7.86 5s-7.86-2-7.86-5v-1.82z"/>
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-black tracking-tight uppercase">PMB ONLINE KAMPUS UTAMA</h4>
                  <p className="text-[11px] text-blue-200 font-semibold">{config.campusName} ({config.campusNickname})</p>
                </div>
              </div>
            </div>

            {/* Google Workspace Integration Dashboard Status Bar */}
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${currentUser ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`}></span>
                <p className="font-semibold text-slate-700">
                  Integrasi Google: {currentUser ? (
                    <span className="text-emerald-700">Aktif (Drive & Sheets Terhubung)</span>
                  ) : (
                    <span className="text-slate-600">Simulasi Offline</span>
                  )}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                {currentUser ? (
                  <div className="flex items-center gap-3">
                    {googleFormUrl ? (
                      <a
                        href={googleFormUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-purple-100 hover:bg-purple-200 text-purple-800 border border-purple-200 py-1.5 px-3 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition text-[10px] decoration-none"
                      >
                        📝 Buka Google Form Anda
                      </a>
                    ) : (
                      <button
                        type="button"
                        disabled={isCreatingForm}
                        onClick={handleCreateForm}
                        className="bg-purple-700 hover:bg-purple-800 text-white font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 cursor-pointer transition shadow-sm text-[10px] border-0"
                      >
                        {isCreatingForm ? (
                          <span className="flex items-center gap-1">
                            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            Membuat Form...
                          </span>
                        ) : (
                          "📝 Buat Google Form"
                        )}
                      </button>
                    )}
                    <div className="flex items-center gap-1 bg-emerald-100 text-emerald-800 py-1 px-2.5 rounded-lg font-bold text-[10px]">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{currentUser.displayName || currentUser.email}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="text-[10px] text-red-500 hover:text-red-600 font-extrabold uppercase tracking-wide cursor-pointer bg-transparent border-0"
                    >
                      Putuskan
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isLoggingIn}
                    onClick={handleLogin}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 cursor-pointer transition shadow-sm text-[10px] border-0"
                  >
                    {isLoggingIn ? (
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Hubungkan...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                        Hubungkan Google Drive & Sheets
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* PROGRESS INDICATOR STEPS */}
            <div className="bg-slate-50 border-b border-slate-150 py-4 px-6 shrink-0 select-none">
              <div className="flex items-center justify-between max-w-md mx-auto relative">
                {/* Background connector line */}
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0"></div>
                <div 
                  className="absolute top-1/2 left-0 h-1 bg-amber-400 -translate-y-1/2 z-0 transition-all duration-300"
                  style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }}
                ></div>

                {/* Step Bubble 1 */}
                <div className="relative z-10 flex flex-col items-center gap-1 cursor-pointer" onClick={() => handleStepClick(1)}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    currentStep === 1 
                      ? 'bg-unsa-blue-900 text-white ring-4 ring-unsa-blue-50'
                      : currentStep > 1 
                        ? 'bg-unsa-gold-500 text-slate-900 font-extrabold' 
                        : 'bg-slate-200 text-slate-500'
                  }`}>
                    {currentStep > 1 ? "✓" : "1"}
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${currentStep === 1 ? 'text-unsa-blue-900' : 'text-slate-400'}`}>Biodata</span>
                </div>

                {/* Step Bubble 2 */}
                <div className="relative z-10 flex flex-col items-center gap-1 cursor-pointer" onClick={() => handleStepClick(2)}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    currentStep === 2 
                      ? 'bg-unsa-blue-900 text-white ring-4 ring-unsa-blue-50'
                      : currentStep > 2 
                        ? 'bg-unsa-gold-500 text-slate-900 font-extrabold' 
                        : 'bg-slate-200 text-slate-500'
                  }`}>
                    {currentStep > 2 ? "✓" : "2"}
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${currentStep === 2 ? 'text-unsa-blue-900' : 'text-slate-400'}`}>Akademik</span>
                </div>

                {/* Step Bubble 3 */}
                <div className="relative z-10 flex flex-col items-center gap-1 cursor-pointer" onClick={() => handleStepClick(3)}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    currentStep === 3 
                      ? 'bg-unsa-blue-900 text-white ring-4 ring-unsa-blue-550 ring-unsa-blue-50'
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    3
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${currentStep === 3 ? 'text-unsa-blue-900' : 'text-slate-400'}`}>Unggahan</span>
                </div>
              </div>
            </div>

            {/* Inner Form content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1">
              
              {/* STEP VIEW 1: DATA PERSONAL / BIODATA */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-fade-in text-left">
                  <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <span className="inline-block bg-unsa-blue-50 text-unsa-blue-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">1</span>
                    <h5 className="text-xs font-black text-slate-750 uppercase tracking-wide">Tahap 1: Data Identitas Calon Mahasiswa</h5>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Nama Lengkap (Sesuai Ijazah) <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="fullName"
                        required
                        value={formState.fullName}
                        onChange={handleInputChange}
                        placeholder="Contoh: Muhammad Akbar Pradana"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-unsa-blue-805 focus:border-unsa-blue-800 focus:outline-none text-xs rounded-xl font-medium transition-all"
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Alamat Email Aktif <span className="text-red-500">*</span></label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formState.email}
                        onChange={handleInputChange}
                        placeholder="pendaftar@gmail.com"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-unsa-blue-800 focus:outline-none text-xs rounded-xl font-medium transition-all"
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">No. HP / WhatsApp <span className="text-red-500">*</span></label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formState.phone}
                        onChange={handleInputChange}
                        placeholder="081234567890"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-unsa-blue-800 focus:outline-none text-xs rounded-xl font-medium transition-all"
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Jenis Kelamin <span className="text-red-500">*</span></label>
                      <select
                        name="gender"
                        required
                        value={formState.gender}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-unsa-blue-800 focus:outline-none text-xs rounded-xl font-semibold text-slate-700 cursor-pointer transition-all"
                      >
                        <option value="">Pilih</option>
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Tempat Lahir <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="placeOfBirth"
                        required
                        value={formState.placeOfBirth}
                        onChange={handleInputChange}
                        placeholder="Contoh: Surakarta"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-unsa-blue-800 focus:outline-none text-xs rounded-xl font-medium transition-all"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Tanggal Lahir <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        required
                        value={formState.dateOfBirth}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-unsa-blue-800 focus:outline-none text-xs rounded-xl font-semibold transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP VIEW 2: AKADEMIK & PILIHAN PRODI */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-fade-in text-left">
                  <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <span className="inline-block bg-unsa-blue-50 text-unsa-blue-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">2</span>
                    <h5 className="text-xs font-black text-slate-750 uppercase tracking-wide">Tahap 2: Minat Pendidikan & Asal Sekolah</h5>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Asal Sekolah (SMA/SMK/MA/Sederajat) <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="schoolOrigin"
                        required
                        value={formState.schoolOrigin}
                        onChange={handleInputChange}
                        placeholder="Contoh: SMA Negeri 2 Surakarta"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-unsa-blue-800 focus:outline-none text-xs rounded-xl font-medium transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Pilih Program Studi Utama <span className="text-red-500">*</span></label>
                      <select
                        name="majorId"
                        required
                        value={formState.majorId}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-unsa-blue-800 focus:outline-none text-xs rounded-xl font-semibold text-slate-750 cursor-pointer transition-all"
                      >
                        <option value="">-- Pilih Program Studi --</option>
                        {config.majors.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.faculty})
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1.5">Studi program Pascasarjana & Sarjana (S1). Silakan pilih opsi prodi sesuai fakultas peminatan Anda.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP VIEW 3: UPLOAD DOKUMEN BERKAS */}
              {currentStep === 3 && (
                <div className="space-y-4 animate-fade-in text-left">
                  <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <span className="inline-block bg-unsa-blue-50 text-unsa-blue-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">3</span>
                    <h5 className="text-xs font-black text-slate-750 uppercase tracking-wide">Tahap 3: Lampiran Dokumen Pelengkap</h5>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    {/* Photo File */}
                    <div className="border border-dashed border-slate-300 rounded-2xl p-4 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-50/50 transition-colors text-center relative min-h-[140px]">
                      <Upload className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-[10px] font-bold text-slate-700">Pas Foto 3x4</span>
                      <span className="text-[8px] text-slate-400 mb-2">JPG/PNG, Maks 2MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        required={!formState.photoFile}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      {formState.photoFile ? (
                        <div className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5 truncate max-w-full">
                          <span>✓ {formState.photoFile.name}</span>
                        </div>
                      ) : (
                        <span className="text-[9px] text-unsa-blue-800 font-bold underline">Pilih Berkas</span>
                      )}
                      {photoPreview && (
                        <div className="mt-1.5 w-8 h-10 border rounded overflow-hidden shadow">
                          <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    {/* Document File */}
                    <div className="border border-dashed border-slate-300 rounded-2xl p-4 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-50/50 transition-colors text-center relative min-h-[140px]">
                      <FileText className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-[10px] font-bold text-slate-700">Scan Ijazah / SKL</span>
                      <span className="text-[8px] text-slate-400 mb-2">PDF/JPG, Maks 2MB</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleIjazahChange}
                        required={!formState.ijazahFile}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      {formState.ijazahFile ? (
                        <div className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5 truncate max-w-full">
                          <span>✓ {formState.ijazahFile.name}</span>
                        </div>
                      ) : (
                        <span className="text-[9px] text-unsa-blue-800 font-bold underline">Pilih Berkas</span>
                      )}
                    </div>
                  </div>

                  {/* Agreement checkbox */}
                  <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 p-3 rounded-xl">
                    <input
                      type="checkbox"
                      id="agreed-sim"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      required
                      className="mt-1.5 cursor-pointer accent-unsa-blue-900 w-4 h-4 shrink-0"
                    />
                    <label htmlFor="agreed-sim" className="text-[10px] text-amber-950 font-semibold select-none cursor-pointer leading-tight">
                      Saya menyatakan bahwa semua data yang diisi adalah benar, sah, dan sesuai dengan dokumen asli.
                    </label>
                  </div>
                </div>
              )}

              {/* Action Buttons Row */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    Sebelumnya
                  </button>
                ) : (
                  <div></div>
                )}

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full sm:w-auto ml-auto px-5 py-2 bg-unsa-blue-900 hover:bg-unsa-blue-800 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow border-0"
                  >
                    Berikutnya
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!agreed}
                    className={`w-full sm:w-auto ml-auto px-5 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition border-0 shadow ${
                      agreed
                        ? "bg-slate-900 hover:bg-slate-800 text-white cursor-pointer active:scale-95"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    Kirim Formulir Pendaftaran
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* State 2: Simulated Loading Overlay */}
        {simState === "loading" && (
          <div className="flex-1 flex flex-col justify-center items-center p-8 space-y-6">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-blue-900 border-t-amber-400 animate-spin"></div>
            </div>
            
            <div className="text-center space-y-2 max-w-xs">
              <h4 className="text-sm font-bold text-slate-800 animate-pulse">
                {simSteps[loadingStep].text}
              </h4>
              <p className="text-[10px] text-slate-500">
                Memproses pendaftaran berkas... Harap tunggu sebentar, jangan menutup atau memuat ulang halaman ini.
              </p>
            </div>

            {/* Sim Progress Bar */}
            <div className="w-full max-w-xs bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-amber-400 h-full transition-all duration-300"
                style={{ width: `${simSteps[loadingStep].prog}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* State 3: Registration Success Certificate */}
        {simState === "success" && (
          <div className="flex-grow p-5 flex flex-col items-center justify-center space-y-5">
            <div className="w-12 h-12 bg-emerald-100 rounded-full text-emerald-600 flex items-center justify-center border-4 border-emerald-50 shadow-sm animate-bounce">
              <CheckCircle2 className="w-6 h-6 stroke-[3px]" />
            </div>

            <div className="text-center space-y-0.5">
              <span className="text-[9px] font-black uppercase text-emerald-600 tracking-wider">Registrasi Berhasil</span>
              <h4 className="text-lg font-bold text-slate-950">Pendaftaran Selesai!</h4>
              <p className="text-[10px] text-slate-500 max-w-xs">
                Data Anda telah dicatat di sistem pendaftaran UNSA. Silakan simpan Kartu Bukti Pendaftaran Digital Anda di bawah ini:
              </p>
            </div>

            {/* Digital ID Voucher Card */}
            <div className="w-full max-w-sm bg-gradient-to-br from-slate-950 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 top-0 w-1/4 bg-amber-400 opacity-5 skew-x-12 translate-x-6 pointer-events-none"></div>

              <div className="flex justify-between items-start gap-4 border-b border-slate-800 pb-3 mb-3">
                <div>
                  <span className="text-[8px] uppercase font-bold tracking-widest text-amber-400">Bukti Pendaftaran Digital</span>
                  <h5 className="text-[11px] font-black text-white">{config.campusNickname} PMB ONLINE</h5>
                </div>
                <div className="w-7 h-7 bg-white/10 rounded flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
                  </svg>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold block">Nomor Registrasi Mahasiswa</span>
                  <p className="text-base font-extrabold text-amber-400 tracking-wider font-mono">
                    {generatedRegId}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 block font-bold">Nama Lengkap</span>
                    <span className="text-[11px] font-semibold text-white truncate block">{formState.fullName || "Ahmad Fadhil"}</span>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 block font-bold">Jurusan Dipilih</span>
                    <span className="text-[11px] font-semibold text-white truncate block">{selectedMajorName}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                  <div>
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 block font-bold">Status Berkas</span>
                    <span className="text-[9px] font-bold text-green-400">Terdaftar & Terverifikasi</span>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 block font-bold">Tanggal Kirim</span>
                    <span className="text-[9px] text-slate-300 font-mono block">{subTime}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Integration URLs Block */}
            {liveLinks && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-left w-full max-w-sm text-[10px] space-y-2 text-emerald-950 leading-normal">
                <p className="font-extrabold uppercase text-[9px] text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  File & Data Berhasil Terkirim Secara Real-time!
                </p>
                <p className="text-slate-600 text-[9px]">
                  Silakan periksa lembar pendaftaran dan folder dokumen pendaftaran Anda di Google Anda menggunakan tautan di bawah ini:
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1 font-bold">
                  {liveLinks.spreadsheetUrl && (
                    <a
                      href={liveLinks.spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white hover:bg-slate-50 border border-emerald-200 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 text-emerald-800 shadow-sm text-[9px] text-center"
                    >
                      📊 Buka Google Sheets
                    </a>
                  )}
                  {liveLinks.folderUrl && (
                    <a
                      href={liveLinks.folderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white hover:bg-slate-50 border border-emerald-200 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 text-emerald-800 shadow-sm text-[9px] text-center"
                    >
                      📁 Folder Dokumen Drive
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Instruction block */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-left w-full max-w-sm text-[10px] space-y-1.5 text-blue-900 leading-normal">
              <p className="font-extrabold uppercase text-[9px] text-blue-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Petunjuk Registrasi Lanjutan:
              </p>
              <ul className="list-decimal list-inside space-y-1 font-medium">
                <li>Unduh dan cetak Bukti Pendaftaran ini sebagai dokumen fisik wajib.</li>
                <li>Simpan nomor pendaftaran di atas untuk proses registrasi ulang berkas fisik.</li>
                <li>Sekretariat PMB UNSA akan menghubungi Anda melalui WhatsApp/Email untuk jadwal tes wawancara.</li>
              </ul>
            </div>

            {/* Simulated Action buttons */}
            <div className="flex flex-col items-center gap-3 w-full max-w-sm">
              <div className="flex gap-2 w-full justify-center">
                <button
                  onClick={() => {
                    setShowPrintStatus(true);
                    setTimeout(() => setShowPrintStatus(false), 3000);
                  }}
                  className="px-3.5 py-1.5 hover:bg-slate-150 bg-white border border-slate-300 rounded-lg text-slate-700 text-[10px] font-bold flex items-center gap-1 shadow-sm transition"
                >
                  <Printer className="w-3 h-3" />
                  Cetak Bukti
                </button>
                <button
                  onClick={handleReset}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-500 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Daftarkan Lain
                </button>
              </div>

              {showPrintStatus && (
                <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] py-2 px-3 rounded-xl flex items-center gap-1.5 justify-center animate-fade-in font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  Pencetakan berhasil: Bukti pendaftaran PDF Anda sukses diterbitkan dan terunduh!
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
