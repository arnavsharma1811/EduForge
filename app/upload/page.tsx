"use client"

import { useState } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { GlassButton } from "@/components/ui/glass-button"
import { UploadCloud, File, X, CheckCircle2, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/apiClient"

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (selectedFile: File) => {
    setError(null)
    if (selectedFile.type === "application/pdf") {
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError("File size exceeds 50MB limit.")
        return
      }
      setFile(selectedFile)
    } else {
      setError("Please upload a valid PDF file.")
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError(null)
    
    try {
      const result = await apiClient.uploadPDF(file)
      router.push(`/course/${result.course_id}/generate`)
    } catch (err: any) {
      setError(err.message || "Failed to upload file")
      setUploading(false)
    }
  }

  return (
    <div className="flex-1 p-6 lg:p-8 max-w-4xl mx-auto w-full flex flex-col justify-center">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Upload Material</h1>
        <p className="text-muted-foreground">Upload any PDF to automatically generate a comprehensive course</p>
      </div>

      <GlassCard className="p-1 md:p-8">
        {!file ? (
          <div 
            className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center transition-all duration-200 ${
              dragActive 
                ? "border-primary bg-primary/5" 
                : "border-white/20 hover:border-white/40 hover:bg-white/5"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mb-6 text-primary shadow-[0_0_30px_rgba(99,102,241,0.2)]">
              <UploadCloud className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Drag & drop your PDF here</h3>
            <p className="text-sm text-muted-foreground mb-6">Supported formats: PDF (Max 50MB)</p>
            
            {error && (
              <div className="flex items-center gap-2 text-red-400 mb-4 bg-red-500/10 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            
            <label htmlFor="file-upload">
              <GlassButton variant="secondary" className="pointer-events-none">
                Browse Files
              </GlassButton>
            </label>
            <input 
              id="file-upload" 
              type="file" 
              className="hidden" 
              accept=".pdf"
              onChange={handleChange}
            />
          </div>
        ) : (
          <div className="p-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 mb-8">
              <div className="h-12 w-12 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                <File className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-medium truncate">{file.name}</h4>
                <p className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
              {!uploading && (
                <button 
                  onClick={() => setFile(null)}
                  className="p-2 text-muted-foreground hover:text-white rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 mb-6 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {uploading && (
              <div className="mb-8 flex flex-col items-center justify-center gap-4 py-8">
                <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-white">Uploading & analyzing document...</p>
              </div>
            )}

            {!uploading && (
              <div className="flex justify-end gap-4">
                <GlassButton onClick={handleUpload}>
                  Generate Course
                </GlassButton>
              </div>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
