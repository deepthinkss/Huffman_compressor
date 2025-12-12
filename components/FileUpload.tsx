import React, { useCallback } from 'react';
import { UploadCloud, FileText, File, FileType, X } from 'lucide-react';

interface FileUploadProps {
  accept: string;
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
  label: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ accept, onFileSelect, selectedFile, onClear, label }) => {
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      // Simple validation
      const allowedExts = accept.split(',').map(e => e.trim());
      const fileExt = "." + file.name.split('.').pop()?.toLowerCase();
      
      if (accept !== "*" && !allowedExts.includes(fileExt) && !allowedExts.includes('.*')) {
         alert(`File type not allowed. Expected: ${accept}`);
         return;
      }
      onFileSelect(file);
    }
  }, [accept, onFileSelect]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  if (selectedFile) {
    return (
      <div className="w-full p-6 bg-slate-900/50 rounded-xl border border-slate-700/50 flex items-center justify-between group hover:border-slate-600 transition-all">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400">
            {selectedFile.name.endsWith('.huff') ? <File size={32} /> : <FileText size={32} />}
          </div>
          <div className="overflow-hidden">
            <p className="font-medium text-slate-200 text-lg truncate max-w-[250px] sm:max-w-md">{selectedFile.name}</p>
            <p className="text-sm text-slate-500 font-mono">{(selectedFile.size / 1024).toFixed(2)} KB</p>
          </div>
        </div>
        <button 
          onClick={onClear}
          className="p-3 hover:bg-slate-800 rounded-full text-slate-400 hover:text-red-400 transition-colors"
        >
          <X size={24} />
        </button>
      </div>
    );
  }

  return (
    <label 
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="relative w-full h-64 flex flex-col items-center justify-center border border-dashed border-slate-700 bg-slate-900/30 rounded-2xl cursor-pointer hover:border-cyan-500/50 hover:bg-slate-800/50 transition-all group overflow-hidden"
    >
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-slate-600 group-hover:border-cyan-500/50 m-4 transition-colors"></div>
      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-slate-600 group-hover:border-cyan-500/50 m-4 transition-colors"></div>
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-slate-600 group-hover:border-cyan-500/50 m-4 transition-colors"></div>
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-slate-600 group-hover:border-cyan-500/50 m-4 transition-colors"></div>

      <div className="p-4 bg-slate-800/80 rounded-full mb-4 group-hover:scale-110 group-hover:bg-cyan-500/10 transition-all duration-300">
        <UploadCloud className="text-slate-400 group-hover:text-cyan-400" size={32} />
      </div>
      
      <p className="text-lg text-slate-300 font-medium mb-2">Drop a file or click to browse</p>
      <p className="text-sm text-slate-500 mb-6">{label}</p>
      
      <div className="flex gap-4 opacity-50 grayscale group-hover:grayscale-0 group-hover:opacity-70 transition-all duration-500">
         <FileBadge ext="txt" />
         <FileBadge ext="pdf" />
         <FileBadge ext="doc" />
         <FileBadge ext="huff" />
      </div>

      <input 
        type="file" 
        className="hidden" 
        accept={accept}
        onChange={handleChange}
      />
    </label>
  );
};

const FileBadge = ({ ext }: { ext: string }) => (
  <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded text-xs text-slate-400 border border-slate-700">
    <FileType size={12} />
    <span className="uppercase">.{ext}</span>
  </div>
);

export default FileUpload;