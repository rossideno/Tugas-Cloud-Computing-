import React, { useState } from "react";
import { GeneratorConfig, Major } from "../types";
import { Settings, Folder, FileSpreadsheet, Plus, Trash2, Mail, Check, AlertCircle } from "lucide-react";

interface ConfigPanelProps {
  config: GeneratorConfig;
  onChange: (updatedConfig: GeneratorConfig) => void;
}

export default function ConfigPanel({ config, onChange }: ConfigPanelProps) {
  const [newMajorName, setNewMajorName] = useState("");
  const [newMajorFaculty, setNewMajorFaculty] = useState("Fakultas Teknologi Informasi");
  const [newMajorCode, setNewMajorCode] = useState("");

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onChange({
      ...config,
      [name]: value,
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    onChange({
      ...config,
      [name]: checked,
    });
  };

  const handleAddMajor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMajorName.trim()) return;

    const code = newMajorCode.trim().toUpperCase() || "JUR-" + (config.majors.length + 1);
    const newMajor: Major = {
      id: Date.now().toString(),
      code: code,
      name: newMajorName.trim(),
      faculty: newMajorFaculty,
    };

    onChange({
      ...config,
      majors: [...config.majors, newMajor],
    });

    setNewMajorName("");
    setNewMajorCode("");
  };

  const handleRemoveMajor = (id: string) => {
    const updatedMajors = config.majors.filter((m) => m.id !== id);
    onChange({
      ...config,
      majors: updatedMajors,
    });
  };

  const faculties = [
    "Fakultas Teknologi Informasi",
    "Fakultas Hukum",
    "Fakultas Ekonomi",
    "Fakultas Ilmu Sosial & Politik",
    "Fakultas Teknik",
    "Program Pascasarjana"
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" id="config-panel-container">
      {/* Title */}
      <div className="bg-slate-900 px-6 py-4 flex items-center gap-2.5">
        <Settings className="w-5 h-5 text-amber-400" />
        <h2 className="text-white font-bold text-sm tracking-wide uppercase">Konfigurasi Google Workspace</h2>
      </div>

      <div className="p-6 space-y-6">
        {/* Step Info */}
        <div className="bg-amber-50/70 border border-amber-100 text-slate-800 rounded-xl p-4 flex gap-3 text-xs leading-relaxed">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-slate-950 mb-0.5">Penting Sebelum deploy:</p>
            Lengkapi nilai <strong>Google Drive Folder ID</strong> di bawah ini agar file ijazah dan foto otomatis masuk ke akun Anda. Kode di sebelah kanan akan beradaptasi secara otomatis!
          </div>
        </div>

        {/* Drive & Sheet Config */}
        <div className="space-y-4">
          <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Arah Penyimpanan Data</h3>
          
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-blue-500" />
              ID Folder Google Drive Utama <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="driveFolderId"
              value={config.driveFolderId}
              onChange={handleTextChange}
              placeholder="Contoh: 1A2b3c4d5e6f7G8h9I_SalingKodeUnikDrive"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none transition-all text-xs rounded-xl font-mono text-slate-750"
              id="google-drive-id-input"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              * Dapatkan token ini dari URL folder Google Drive Anda saat dibuka di browser.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Nama Sheet Database Utama
            </label>
            <input
              type="text"
              name="spreadsheetName"
              value={config.spreadsheetName}
              onChange={handleTextChange}
              placeholder="Data Pendaftar"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none transition-all text-xs rounded-xl"
              id="sheet-name-input"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              * Tab tabel baru dengan nama ini akan otomatis dibuat di Google Sheets Anda.
            </p>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Campus & Format Config */}
        <div className="space-y-4">
          <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Identitas Kampus & No. Registrasi</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Universitas</label>
              <input
                type="text"
                name="campusName"
                value={config.campusName}
                onChange={handleTextChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none transition-all text-xs rounded-lg font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Inisial / Singkatan</label>
              <input
                type="text"
                name="campusNickname"
                value={config.campusNickname}
                onChange={handleTextChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none transition-all text-xs rounded-lg font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Format ID Pendaftaran</label>
            <input
              type="text"
              name="idFormat"
              value={config.idFormat}
              onChange={handleTextChange}
              placeholder="UNSA-2026-###"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none transition-all text-xs rounded-lg font-mono"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              * Contoh keluaran nomor urut pertama: <strong>{config.idFormat.split("-")[0] || "UNSA"}-{config.idFormat.split("-")[1] || "2026"}-001</strong>
            </p>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Email automation config */}
        <div className="space-y-4">
          <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider flex justify-between items-center">
            <span>Notifikasi Surat Elektronik (Email)</span>
            <span className="px-2 py-0.5 text-[9px] font-bold bg-blue-100 text-blue-700 rounded-md">Otomatis</span>
          </h3>

          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <input
              type="checkbox"
              id="enableEmailNotification"
              name="enableEmailNotification"
              checked={config.enableEmailNotification}
              onChange={handleCheckboxChange}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 accent-blue-600 cursor-pointer"
            />
            <label htmlFor="enableEmailNotification" className="text-xs font-bold text-slate-800 cursor-pointer select-none">
              Aktifkan Pengiriman Email Konfirmasi (Gmail App)
            </label>
          </div>

          {config.enableEmailNotification && (
            <div className="animate-fade-in">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-500" />
                Alamat Email Pengawas / Panitia PMB
              </label>
              <input
                type="email"
                name="adminEmail"
                value={config.adminEmail}
                onChange={handleTextChange}
                placeholder="Contoh: rossideno@gmail.com"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none transition-all text-xs rounded-xl"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                * Panitia juga akan menerima salinan instan ketika ada mahasiswa mendaftar.
              </p>
            </div>
          )}
        </div>

        <hr className="border-slate-100" />

        {/* Edit Majors List */}
        <div className="space-y-4">
          <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Manajemen Jurusan / Program Studi</h3>
          
          {/* Add major subform */}
          <form onSubmit={handleAddMajor} className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-xl space-y-3">
            <span className="text-[11px] font-bold text-slate-600 block uppercase tracking-wider">Tambah Program Studi Baru</span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="text"
                  placeholder="Kode (contoh: INF)"
                  value={newMajorCode}
                  onChange={(e) => setNewMajorCode(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 text-xs rounded-lg font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <select
                  value={newMajorFaculty}
                  onChange={(e) => setNewMajorFaculty(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 text-xs rounded-lg focus:outline-none focus:border-blue-500"
                >
                  {faculties.map((f, i) => (
                    <option key={i} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2 flex gap-2">
                <input
                  type="text"
                  placeholder="Nama Program Studi (cth: S1 Teknik Informatika)"
                  value={newMajorName}
                  onChange={(e) => setNewMajorName(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 text-xs rounded-lg focus:outline-none focus:border-blue-500 font-medium"
                />
                <button
                  type="submit"
                  className="px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center justify-center cursor-pointer transition-all shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>

          {/* Majors list */}
          <div className="max-h-56 overflow-y-auto pr-1 border border-slate-100 rounded-xl divide-y divide-slate-100">
            {config.majors.map((major) => (
              <div key={major.id} className="py-2.5 px-3 flex justify-between items-center hover:bg-slate-50 transition-colors">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-slate-100 text-slate-700 rounded-md">
                      {major.code}
                    </span>
                    <span className="text-xs font-semibold text-slate-800">{major.name}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{major.faculty}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveMajor(major.id)}
                  className="p-1 px-1.5 text-red-500 hover:bg-red-50 rounded-lg hover:text-red-700 transition"
                  id={`remove-major-${major.id}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {config.majors.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-400 font-medium">
                Belum ada jurusan yang aktif. Silakan tambahkan satu!
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
