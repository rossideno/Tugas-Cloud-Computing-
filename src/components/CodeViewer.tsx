import React, { useState } from "react";
import { Copy, Check, FileCode, FileText, Sparkles, Download } from "lucide-react";

interface CodeViewerProps {
  codeGs: string;
  indexHtml: string;
}

export default function CodeViewer({ codeGs, indexHtml }: CodeViewerProps) {
  const [activeTab, setActiveTab] = useState<"gs" | "html">("gs");
  const [copied, setCopied] = useState(false);

  const activeCode = activeTab === "gs" ? codeGs : indexHtml;
  const fileName = activeTab === "gs" ? "Code.gs" : "Index.html";

  const handleCopy = () => {
    navigator.clipboard.writeText(activeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = () => {
    const element = document.createElement("a");
    const file = new Blob([activeCode], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="bg-slate-950 text-slate-100 rounded-2xl shadow-xl border border-slate-800 overflow-hidden flex flex-col h-full" id="code-viewer-container">
      {/* Tab Triggers Header */}
      <div className="bg-slate-900 px-4 py-3 flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-1.5" id="code-tabs">
          <button
            onClick={() => setActiveTab("gs")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === "gs"
                ? "bg-slate-800 text-amber-400 border border-slate-700/50"
                : "text-slate-400 hover:text-slate-200"
            }`}
            id="tab-code-gs"
          >
            <FileCode className="w-3.5 h-3.5" />
            Code.gs (Backend)
          </button>
          
          <button
            onClick={() => setActiveTab("html")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === "html"
                ? "bg-slate-800 text-amber-400 border border-slate-700/50"
                : "text-slate-400 hover:text-slate-200"
            }`}
            id="tab-code-html"
          >
            <FileText className="w-3.5 h-3.5" />
            Index.html (Frontend)
          </button>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Download button */}
          <button
            onClick={downloadFile}
            title={`Unduh ${fileName}`}
            className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Unduh</span>
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className={`p-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              copied
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-extrabold"
                : "bg-amber-400 text-slate-950 hover:bg-amber-300 font-extrabold"
            }`}
            id="copy-code-btn"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3px]" />
                Tersalin!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Salin Kode
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="p-4 overflow-auto flex-1 font-mono text-[11px] leading-relaxed relative max-h-[580px] min-h-[500px]">
        
        {/* Decorative Badge */}
        <div className="absolute top-4 right-4 bg-slate-850 px-2.5 py-1 rounded-md text-[9px] uppercase tracking-wider text-slate-400 border border-slate-800 pointer-events-none flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          Keluaran Terformat
        </div>

        {/* Real Code element */}
        <pre className="text-slate-300 whitespace-pre scrollbar-thin scrollbar-thumb-slate-800 select-all font-mono">
          <code>{activeCode}</code>
        </pre>
      </div>

      {/* Footer Info of Code Editor */}
      <div className="bg-slate-900 px-4 py-2 text-[10px] text-slate-400 border-t border-slate-800 flex justify-between items-center select-none shrink-0">
        <span>Bahasa: {activeTab === "gs" ? "JavaScript / GAS" : "HTML / Tailwind"}</span>
        <span>Mendukung upload hingga 2MB (Batas Aman Google)</span>
      </div>
    </div>
  );
}
