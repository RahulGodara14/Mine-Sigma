"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Zap, Shield } from "lucide-react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("idle"); // idle, processing, success, error
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus("idle");
    }
  };

  // Handle Drag and Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setStatus("idle");
    }
  };

  // Send File to Python Backend
  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setStatus("processing");
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const backendBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api").replace(/\/api\/?$/, "");
      const response = await fetch(`${backendBase}/analyze-mine`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      setProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));
      setStatus("success");
      
      // Redirect to the admin map viewer to see the results
      setTimeout(() => {
        router.push("/admin/map-viewer");
      }, 2000);

    } catch (error) {
      console.error("Error uploading:", error);
      setStatus("error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="max-w-3xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-black bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
              Mining Lease Upload
            </h1>
          </div>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Upload your mining lease document for AI-powered analysis and satellite intelligence processing
          </p>
        </div>

        {/* Upload Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative mb-8 transition-all duration-300 ${
            dragActive ? "scale-105" : ""
          }`}
        >
          <div className={`absolute -inset-1 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-2xl blur opacity-0 transition-opacity duration-300 ${
            dragActive ? "opacity-30" : ""
          }`} />
          
          <div className={`relative border-2 border-dashed rounded-2xl p-16 text-center transition-all duration-300 ${
            dragActive
              ? "border-emerald-400 bg-emerald-500/10 backdrop-blur-sm"
              : "border-emerald-500/30 bg-slate-800/30 hover:border-emerald-500/50 hover:bg-slate-800/50"
          }`}>
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className={`p-4 rounded-xl transition-all duration-300 ${
                  dragActive
                    ? "bg-emerald-500/30 scale-110"
                    : "bg-emerald-500/10 group-hover:bg-emerald-500/20"
                }`}>
                  <Upload className={`w-16 h-16 transition-colors ${
                    dragActive ? "text-emerald-400" : "text-emerald-300"
                  }`} />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="cursor-pointer block">
                  <span className="text-emerald-400 hover:text-emerald-300 font-bold text-lg transition-colors">
                    Click to upload
                  </span>
                  <span className="text-slate-400 mx-2">or drag and drop</span>
                  <input 
                    ref={inputRef}
                    type="file" 
                    className="hidden" 
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="text-sm text-slate-500 font-medium">
                  PDF, PNG or JPG (MAX. 10MB)
                </p>
              </div>

              {/* File Requirements */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700/50">
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-1">Format</p>
                  <p className="text-sm font-semibold text-slate-300">PDF, PNG, JPG</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-1">Size Limit</p>
                  <p className="text-sm font-semibold text-slate-300">10 MB Max</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-1">Processing</p>
                  <p className="text-sm font-semibold text-slate-300">2-5 Minutes</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* File Status Card */}
        {file && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-emerald-500/30 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-lg">
                    <FileText className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-lg">{file.name}</p>
                    <p className="text-sm text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                
                {status === 'idle' && (
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-emerald-500/50"
                  >
                    {uploading ? "Processing..." : "Run Analysis"}
                  </button>
                )}

                {status === 'processing' && (
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                    <span className="text-emerald-400 font-semibold">Analyzing...</span>
                  </div>
                )}

                {status === 'success' && (
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Complete!</span>
                  </div>
                )}
                
                {status === 'error' && (
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-red-400" />
                    <span className="text-red-400 font-semibold">Error</span>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {status === 'processing' && (
                <div className="space-y-2">
                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 text-center">Connecting to satellite network...</p>
                </div>
              )}

              {/* Status Messages */}
              {status === 'success' && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-emerald-300 text-sm">
                  ✅ Analysis complete! Redirecting to dashboard in 2 seconds...
                </div>
              )}
              
              {status === 'error' && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm">
                  ❌ Upload failed. Please check your backend connection and try again.
                </div>
              )}
            </div>

            {/* Info Cards */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
                <p className="text-sm text-slate-400 mb-2">📊 What We Analyze</p>
                <ul className="text-xs text-slate-500 space-y-1">
                  <li>✓ Mining coordinates & boundaries</li>
                  <li>✓ Lease area dimensions</li>
                  <li>✓ Legal vs illegal mining zones</li>
                </ul>
              </div>
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
                <p className="text-sm text-slate-400 mb-2">⚡ Processing Steps</p>
                <ul className="text-xs text-slate-500 space-y-1">
                  <li>✓ Document parsing & extraction</li>
                  <li>✓ Satellite data retrieval</li>
                  <li>✓ AI analysis & visualization</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Empty State Info */}
        {!file && (
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Fast Processing</h3>
              <p className="text-sm text-slate-400">Get results in 2-5 minutes with AI analysis</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-cyan-500/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Secure & Private</h3>
              <p className="text-sm text-slate-400">Your data is encrypted and protected</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Detailed Reports</h3>
              <p className="text-sm text-slate-400">Get comprehensive audit reports & visualizations</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}