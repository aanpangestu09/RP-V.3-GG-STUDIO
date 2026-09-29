import React, { useState, useEffect } from 'react';
import { 
  FolderDown, 
  Download, 
  FileText, 
  FileSpreadsheet, 
  FileArchive, 
  ShieldCheck, 
  Key, 
  AlertCircle, 
  Clock, 
  ExternalLink,
  CheckCircle2,
  Lock,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { api } from '../../lib/api';
import { formatBytes, formatDate } from '../../lib/formatters';

interface SecureDownloadPortalProps {
  token: string;
  onBackToHome: () => void;
}

export const SecureDownloadPortal: React.FC<SecureDownloadPortalProps> = ({
  token,
  onBackToHome
}) => {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const fetchPortal = async () => {
      setIsLoading(true);
      try {
        const res = await api.validateDownloadToken(token);
        if (res.success && res.data) {
          setData(res.data);
        } else {
          setErrorMessage(res.message || 'Tautan download tidak valid atau telah kadaluarsa.');
        }
      } catch (err: any) {
        setErrorMessage('Gagal memverifikasi token unduhan.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortal();
  }, [token]);

  const handleDownloadFile = async (fileId: string, fileName: string) => {
    setDownloadingId(fileId);
    try {
      // Direct stream link from backend API
      const downloadEndpoint = `/api/download/${token}/file/${fileId}`;
      
      // Trigger download
      const link = document.createElement('a');
      link.href = downloadEndpoint;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Increment download counter locally
      if (data && data.downloadLimit > 0) {
        setData({
          ...data,
          downloadCount: data.downloadCount + 1
        });
      }
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setTimeout(() => setDownloadingId(null), 1500);
    }
  };

  const copyLicense = (key: string) => {
    navigator.clipboard.writeText(key);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-300">Memverifikasi Tautan Unduhan Aman...</p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 rounded-3xl p-8 border border-red-500/30 text-center shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Tautan Unduhan Tidak Aktif</h2>
          <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
            {errorMessage}
          </p>
          <div className="space-y-3">
            <a
              href="https://wa.me/6281234567890?text=Halo%20Admin%20Ruang%20Proyek,%20link%20download%20saya%20expired"
              target="_blank"
              rel="noreferrer"
              className="block w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all"
            >
              Minta Pengiriman Ulang Link (WhatsApp)
            </a>
            <button
              onClick={onBackToHome}
              className="block w-full py-3 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    );
  }

  const remainingQuota = data.downloadLimit > 0 
    ? Math.max(0, data.downloadLimit - data.downloadCount) 
    : 'Tak Terbatas';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Top bar info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-widest block mb-1">
              PORTAL UNDUHAN RESMI
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              {data.productName}
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Pesanan Terverifikasi: #{data.orderNumber}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Kuota Unduhan</span>
              <span className="text-xs font-black text-emerald-400 font-mono">
                {remainingQuota} {typeof remainingQuota === 'number' ? 'Tersisa' : ''}
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Status Akses</span>
              <span className="text-xs font-black text-blue-400">
                Aktif (Valid)
              </span>
            </div>
          </div>
        </div>

        {/* License Key Box if available */}
        {data.licenseKey && (
          <div className="mt-6 p-5 rounded-2xl bg-gradient-to-r from-blue-950/70 to-slate-900 border border-blue-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Kunci Lisensi Resmi (Commercial License)
                  </span>
                </div>
                <span className="text-lg font-mono font-black text-white block mt-1 tracking-wider">
                  {data.licenseKey}
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Gunakan kunci ini saat mengaktifkan software atau plugin pendukung.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyLicense(data.licenseKey)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Tersalin!' : 'Salin Lisensi'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* File Package List */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <FolderDown className="w-5 h-5 text-blue-400" />
              <span>Daftar File Paket Digital ({data.files?.length || 0} File)</span>
            </h3>
            <span className="text-xs text-slate-400">
              Klik "Unduh File" untuk mendownload langsung
            </span>
          </div>

          <div className="space-y-3.5">
            {data.files?.map((file: any) => {
              const isDownloadingThis = downloadingId === file.id;

              return (
                <div
                  key={file.id}
                  className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                      <FileArchive className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
                          {file.fileType}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {formatBytes(file.fileSizeBytes)}
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-sm sm:text-base mt-1">
                        {file.fileName}
                      </h4>
                      {file.accessInstructions && (
                        <p className="text-xs text-slate-400 mt-1">
                          {file.accessInstructions}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {file.externalLink ? (
                      <a
                        href={file.externalLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                      >
                        <span>Akses Online</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <button
                        onClick={() => handleDownloadFile(file.id, file.fileName)}
                        disabled={isDownloadingThis}
                        className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isDownloadingThis ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Mengunduh...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            <span>Unduh File</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security & Token validity info footer */}
        <div className="mt-12 p-6 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-white">Tautan Terenkripsi Privat (Secure Token)</p>
              <p className="mt-0.5 text-slate-400">
                Token aktif hingga {data.expiresAt ? formatDate(data.expiresAt) : 'Seumur Hidup'}.
              </p>
            </div>
          </div>

          <button
            onClick={onBackToHome}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors shrink-0"
          >
            ← Kembali ke Katalog
          </button>
        </div>
      </div>
    </div>
  );
};
