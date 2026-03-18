"use client"

import { useState, useCallback } from "react"
import { Upload, File, FileText, Image, FileSpreadsheet, FileArchive, X, CheckCircle2, Eye, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface UploadedFile {
    file: File
    id: string
    preview?: string
}

interface FileUploadProps {
    onFilesSelected?: (files: File[]) => void
    onSubmit?: (files: File[]) => void
    onView?: (file: File) => void
    onDelete?: (fileId: string) => void
    maxSize?: number // in MB
    accept?: string
    multiple?: boolean
    className?: string
}

export function FileUpload({
    onFilesSelected,
    onSubmit,
    onView,
    onDelete,
    maxSize = 100, // 100MB default
    accept = "*",
    multiple = true,
    className,
}: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

    const getFileIcon = (fileType: string) => {
        if (fileType.startsWith("image/")) return Image
        if (fileType.includes("pdf")) return FileText
        if (fileType.includes("sheet") || fileType.includes("csv")) return FileSpreadsheet
        if (fileType.includes("zip") || fileType.includes("rar") || fileType.includes("7z")) return FileArchive
        if (fileType.includes("document") || fileType.includes("word")) return FileText
        return File
    }

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes"
        const k = 1024
        const sizes = ["Bytes", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
    }

    const handleFiles = useCallback(
        (files: FileList | null) => {
            if (!files) return

            const fileArray = Array.from(files)
            const maxSizeBytes = maxSize * 1024 * 1024

            const validFiles = fileArray.filter((file) => {
                if (file.size > maxSizeBytes) {
                    alert(`File ${file.name} exceeds maximum size of ${maxSize}MB`)
                    return false
                }
                return true
            })

            const newFiles: UploadedFile[] = validFiles.map((file) => ({
                file,
                id: Math.random().toString(36).substring(7),
                preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
            }))

            setUploadedFiles((prev) => (multiple ? [...prev, ...newFiles] : newFiles))
            onFilesSelected?.(validFiles)
        },
        [maxSize, multiple, onFilesSelected]
    )

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            setIsDragging(false)
            handleFiles(e.dataTransfer.files)
        },
        [handleFiles]
    )

    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            handleFiles(e.target.files)
        },
        [handleFiles]
    )

    const removeFile = useCallback((id: string) => {
        setUploadedFiles((prev) => {
            const file = prev.find((f) => f.id === id)
            if (file?.preview) {
                URL.revokeObjectURL(file.preview)
            }
            return prev.filter((f) => f.id !== id)
        })
    }, [])

    const clearAll = useCallback(() => {
        uploadedFiles.forEach((file) => {
            if (file.preview) URL.revokeObjectURL(file.preview)
        })
        setUploadedFiles([])
    }, [uploadedFiles])

    const handleSubmit = useCallback(() => {
        const files = uploadedFiles.map((f) => f.file)
        onSubmit?.(files)
    }, [uploadedFiles, onSubmit])

    const handleView = useCallback((file: File) => {
        onView?.(file)
    }, [onView])

    const handleDelete = useCallback((id: string) => {
        onDelete?.(id)
        removeFile(id)
    }, [onDelete, removeFile])

    return (
        <div className={cn("space-y-4", className)}>
            {/* Drop Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    "relative border-2 border-dashed rounded-xl p-12 transition-all duration-200",
                    isDragging
                        ? "border-emerald-500 bg-emerald-500/5"
                        : "border-slate-700 hover:border-slate-600 bg-slate-900/50"
                )}
            >
                <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileInput}
                    accept={accept}
                    multiple={multiple}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
                            <Upload className="w-8 h-8 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-lg font-semibold text-slate-200">
                                {isDragging ? "Drop files here" : "Drag & drop files here"}
                            </p>
                            <p className="text-sm text-slate-400 mt-1">
                                or click to browse your computer
                            </p>
                        </div>
                        <div className="text-xs text-slate-500">
                            Supports all file formats • Max {maxSize}MB per file
                        </div>
                    </div>
                </label>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-200">
                            Uploaded Files ({uploadedFiles.length})
                        </h3>
                        <div className="flex gap-2">
                            {onSubmit && (
                                <Button
                                    onClick={handleSubmit}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-xs"
                                    size="sm"
                                >
                                    Submit All
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearAll}
                                className="text-xs text-slate-400 hover:text-slate-200"
                            >
                                Clear All
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                        {uploadedFiles.map((uploadedFile) => {
                            const FileIcon = getFileIcon(uploadedFile.file.type)
                            return (
                                <Card key={uploadedFile.id} className="bg-slate-900/50 border-slate-800">
                                    <CardContent className="p-3">
                                        <div className="flex items-center gap-3">
                                            {/* File Preview or Icon */}
                                            {uploadedFile.preview ? (
                                                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-800">
                                                    <img
                                                        src={uploadedFile.preview}
                                                        alt={uploadedFile.file.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                                    <FileIcon className="w-6 h-6 text-emerald-500" />
                                                </div>
                                            )}

                                            {/* File Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-200 truncate">
                                                    {uploadedFile.file.name}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-slate-400">
                                                        {formatFileSize(uploadedFile.file.size)}
                                                    </span>
                                                    <span className="text-xs text-slate-600">•</span>
                                                    <span className="text-xs text-slate-400">
                                                        {uploadedFile.file.type || "Unknown type"}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-1">
                                                {onView && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-emerald-400"
                                                        onClick={() => handleView(uploadedFile.file)}
                                                        title="View file"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-rose-400"
                                                    onClick={() => handleDelete(uploadedFile.id)}
                                                    title="Delete file"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
