import React, { useState } from 'react';
import { Download, RefreshCw, Zap, ShieldCheck, Binary, FileCheck, ArrowRight, Sparkles } from 'lucide-react';
import FileUpload from './components/FileUpload';
import { compressData, createCompressedFileContent, decompressFile } from './utils/huffman';
import { CompressionResult } from './types';

// Helper to infer MIME type from extension to ensure browser respects the file type
const getMimeType = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeMap: { [key: string]: string } = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'json': 'application/json',
    'xml': 'application/xml',
    'zip': 'application/zip',
    'mp3': 'audio/mpeg',
    'mp4': 'video/mp4',
    'csv': 'text/csv',
    'html': 'text/html',
    'js': 'text/javascript',
    'css': 'text/css',
  };
  return mimeMap[ext || ''] || 'application/octet-stream';
};

function App() {
  const [activeTab, setActiveTab] = useState<'compress' | 'decompress'>('compress');
  
  // Compression State
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<CompressionResult | null>(null);
  
  // Decompression State
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [decompressedData, setDecompressedData] = useState<{ data: Uint8Array, name: string } | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);

  // Handlers
  const handleCompress = async () => {
    if (!sourceFile) return;
    setIsProcessing(true);
    setResult(null);

    // Simulate async for UI breathability
    setTimeout(async () => {
      try {
        const arrayBuffer = await sourceFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const res = await compressData(uint8Array, sourceFile.name);
        setResult(res);
      } catch (err) {
        console.error(err);
        alert("Error compressing file");
      } finally {
        setIsProcessing(false);
      }
    }, 400); // Slight delay for effect
  };

  const handleDecompress = async () => {
    if (!compressedFile) return;
    setIsProcessing(true);
    setDecompressedData(null);
    setPreviewText(null);

    setTimeout(async () => {
      try {
        // We read as text because the compressed format is JSON, regardless of the file extension
        const textContent = await compressedFile.text();
        // Pass the filename to provide a fallback if internal metadata is missing
        const { data, originalName } = await decompressFile(textContent, compressedFile.name);
        
        setDecompressedData({ data, name: originalName });

        // Try to generate preview if it looks like a text file
        if (originalName.match(/\.(txt|md|json|js|ts|html|css|csv)$/i)) {
          const decoder = new TextDecoder('utf-8');
          setPreviewText(decoder.decode(data.slice(0, 1000))); 
        } else {
          setPreviewText(null);
        }

      } catch (err) {
        console.error(err);
        alert("Error decompressing file. The file might be corrupted or not a valid compressed file.");
      } finally {
        setIsProcessing(false);
      }
    }, 400);
  };

  const downloadCompressed = () => {
    if (!result) return;
    const fileContent = createCompressedFileContent(result);
    // Use application/octet-stream to prevent browser from guessing extensions based on content (JSON)
    const blob = new Blob([fileContent], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Download with the original name (e.g., file.pdf) as requested
    // This file will contain the compressed JSON data but look like the original file
    a.download = result.originalName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadDecompressed = () => {
    if (!decompressedData) return;
    
    // Strictly remove .huff extension if present (legacy support)
    const cleanName = decompressedData.name.replace(/\.huff$/i, '');

    // Explicitly set the MIME type to ensure the browser handles the file type correctly
    const mimeType = getMimeType(cleanName);
    
    // Create blob from raw bytes with the correct MIME type
    const blob = new Blob([decompressedData.data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Download with the CLEAN name (e.g. file.pdf)
    a.download = cleanName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-inter selection:bg-cyan-500/30">
      
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative max-w-5xl mx-auto px-6 py-16 flex flex-col items-center">
        
        {/* Header Section */}
        <div className="flex flex-col items-center space-y-6 text-center mb-16 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/30 border border-cyan-500/20 text-cyan-400 text-xs font-medium tracking-wide uppercase">
            <Binary size={12} /> Huffman Algorithm
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white">
            File <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">Compressor</span>
          </h1>
          
          <p className="text-slate-400 max-w-lg text-lg leading-relaxed">
            Compress and decompress files using Huffman encoding. <br/>
            Supports PDF, Word, and text files.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl mb-12">
          <FeatureCard 
            icon={<Zap className="text-amber-400" size={24} />}
            title="Fast Processing"
          />
          <FeatureCard 
            icon={<ShieldCheck className="text-emerald-400" size={24} />}
            title="Lossless"
          />
          <FeatureCard 
            icon={<Binary className="text-cyan-400" size={24} />}
            title="Any File Type"
          />
        </div>

        {/* Main Interface Card */}
        <div className="w-full max-w-3xl bg-[#0f172a]/80 backdrop-blur-xl rounded-3xl border border-slate-800 p-2 shadow-2xl">
          
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/50 rounded-2xl mb-2">
            <button 
              onClick={() => { setActiveTab('compress'); setResult(null); setSourceFile(null); }}
              className={`py-3 rounded-xl font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === 'compress' 
                ? 'bg-slate-800 text-cyan-400 shadow-lg shadow-black/20' 
                : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Compress File
            </button>
            <button 
              onClick={() => { setActiveTab('decompress'); setDecompressedData(null); setCompressedFile(null); }}
              className={`py-3 rounded-xl font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === 'decompress' 
                ? 'bg-slate-800 text-indigo-400 shadow-lg shadow-black/20' 
                : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Decompress File
            </button>
          </div>

          <div className="p-6 md:p-8">
            {/* COMPRESSION VIEW */}
            {activeTab === 'compress' && (
              <div className="space-y-6 animate-fade-in">
                {!result ? (
                  <>
                    <FileUpload 
                      accept="*" 
                      label="Supports TXT, PDF, DOC, DOCX, and other files"
                      onFileSelect={setSourceFile} 
                      selectedFile={sourceFile}
                      onClear={() => setSourceFile(null)}
                    />
                    <button 
                      disabled={!sourceFile || isProcessing}
                      onClick={handleCompress}
                      className="w-full py-4 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg flex justify-center items-center gap-3 transition-all shadow-lg shadow-cyan-900/20"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="animate-spin" /> Compressing...
                        </>
                      ) : (
                        <>
                          Compress Now <ArrowRight size={20} />
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <ResultCard 
                    title="Compression Complete"
                    stats={[
                      { label: "Original Size", value: formatBytes(result.originalSize) },
                      { label: "Compressed Size", value: formatBytes(result.compressedSize) },
                      { label: "Reduction", value: `${result.compressionRatio.toFixed(2)}%`, highlight: true },
                      { label: "Time", value: `${result.timing.toFixed(1)}ms` }
                    ]}
                    action={
                      <button 
                        onClick={downloadCompressed}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex justify-center items-center gap-2 transition-colors"
                      >
                        <Download size={20} /> Download Compressed File
                      </button>
                    }
                    onReset={() => { setResult(null); setSourceFile(null); }}
                  />
                )}
              </div>
            )}

            {/* DECOMPRESSION VIEW */}
            {activeTab === 'decompress' && (
              <div className="space-y-6 animate-fade-in">
                {!decompressedData ? (
                  <>
                    <FileUpload 
                      accept="*" 
                      label="Upload a compressed file to restore"
                      onFileSelect={setCompressedFile} 
                      selectedFile={compressedFile}
                      onClear={() => setCompressedFile(null)}
                    />
                    <button 
                      disabled={!compressedFile || isProcessing}
                      onClick={handleDecompress}
                      className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg flex justify-center items-center gap-3 transition-all shadow-lg shadow-indigo-900/20"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="animate-spin" /> Restoring...
                        </>
                      ) : (
                        <>
                          Decompress & Restore <Sparkles size={20} />
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <ResultCard 
                    title="File Restored Successfully"
                    icon={<FileCheck className="text-emerald-400 mb-2" size={40} />}
                    stats={[
                      { label: "Filename", value: decompressedData.name },
                      { label: "Size", value: formatBytes(decompressedData.data.length) },
                    ]}
                    preview={previewText}
                    action={
                      <button 
                        onClick={downloadDecompressed}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex justify-center items-center gap-2 transition-colors"
                      >
                        <Download size={20} /> Download Restored File
                      </button>
                    }
                    onReset={() => { setDecompressedData(null); setCompressedFile(null); }}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="mt-12 text-slate-600 text-sm font-medium">
          Built with Huffman encoding algorithm • Files processed locally in your browser
        </p>

      </div>
    </div>
  );
}

// UI Components
const FeatureCard = ({ icon, title }: { icon: React.ReactNode, title: string }) => (
  <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-3 hover:bg-slate-800/50 transition-colors cursor-default">
    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 shadow-sm">
      {icon}
    </div>
    <span className="font-semibold text-slate-300">{title}</span>
  </div>
);

const ResultCard = ({ title, icon, stats, action, onReset, preview }: any) => (
  <div className="bg-slate-900/50 rounded-2xl border border-slate-700/50 p-6 text-center animate-fade-in">
    <div className="flex flex-col items-center mb-6">
      {icon || <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-400 mb-3"><ShieldCheck size={32} /></div>}
      <h3 className="text-xl font-bold text-white">{title}</h3>
    </div>
    
    <div className="bg-slate-950/50 rounded-xl p-4 mb-6 space-y-3">
      {stats.map((s: any, i: number) => (
        <div key={i} className="flex justify-between items-center text-sm border-b border-slate-800/50 last:border-0 pb-2 last:pb-0">
          <span className="text-slate-500">{s.label}</span>
          <span className={`font-mono font-medium ${s.highlight ? 'text-emerald-400' : 'text-slate-300'}`}>
            {s.value}
          </span>
        </div>
      ))}
    </div>

    {preview && (
      <div className="mb-6 text-left">
        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Preview</p>
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono text-slate-400 overflow-hidden max-h-32">
          {preview}...
        </div>
      </div>
    )}

    <div className="space-y-3">
      {action}
      <button onClick={onReset} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
        Process another file
      </button>
    </div>
  </div>
);

const formatBytes = (bytes: number) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default App;