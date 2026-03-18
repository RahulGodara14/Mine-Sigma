"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, MapPin, X, FileText, Image, FileSpreadsheet } from "lucide-react"
import { UploadedFileData } from "@/lib/file-store"

interface FileViewDialogProps {
    file: UploadedFileData | null
    isOpen: boolean
    onClose: () => void
    onDownload?: (file: UploadedFileData) => void
    onViewOnMap?: (file: UploadedFileData) => void
}

export function FileViewDialog({ file, isOpen, onClose, onDownload, onViewOnMap }: FileViewDialogProps) {
    if (!file) return null

    const getFileIcon = (fileType: string) => {
        if (fileType.includes("image")) return Image
        if (fileType.includes("spreadsheet") || fileType.includes("csv")) return FileSpreadsheet
        return FileText
    }

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes"
        const k = 1024
        const sizes = ["Bytes", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
    }

    const FileIcon = getFileIcon(file.type)
    const isImage = file.type.includes("image")

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl bg-slate-900 border-slate-800">
                <DialogHeader>
                    <DialogTitle className="text-slate-100 flex items-center gap-2">
                        <FileIcon className="w-5 h-5 text-emerald-500" />
                        {file.name}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Uploaded on {new Date(file.uploadedAt).toLocaleString()}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* File Preview */}
                    {isImage && file.preview && (
                        <div className="rounded-lg overflow-hidden bg-slate-950 border border-slate-800">
                            <img
                                src={file.preview}
                                alt={file.name}
                                className="w-full max-h-96 object-contain"
                            />
                        </div>
                    )}

                    {/* File Details */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs text-slate-500 font-medium">File Type</label>
                            <Badge variant="secondary">{file.type.split("/")[1]?.toUpperCase() || "FILE"}</Badge>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-slate-500 font-medium">File Size</label>
                            <p className="text-sm text-slate-300">{formatFileSize(file.size)}</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-slate-500 font-medium">Uploaded By</label>
                            <p className="text-sm text-slate-300">{file.uploadedBy}</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-slate-500 font-medium">Category</label>
                            <Badge variant="outline">{file.category}</Badge>
                        </div>
                    </div>

                    {/* Coordinates */}
                    {file.latitude !== undefined && file.longitude !== undefined && (
                        <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <MapPin className="w-4 h-4 text-emerald-500" />
                                <h4 className="text-sm font-semibold text-slate-200">Location Coordinates</h4>
                            </div>
                            <div className="flex gap-4">
                                <div>
                                    <label className="text-xs text-slate-500">Latitude</label>
                                    <p className="text-sm font-mono text-emerald-400">{file.latitude.toFixed(6)}°</p>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500">Longitude</label>
                                    <p className="text-sm font-mono text-emerald-400">{file.longitude.toFixed(6)}°</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    {file.description && (
                        <div className="space-y-1">
                            <label className="text-xs text-slate-500 font-medium">Description</label>
                            <p className="text-sm text-slate-300">{file.description}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-4">
                        <Button
                            onClick={() => onDownload?.(file)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                        </Button>
                        {file.latitude !== undefined && file.longitude !== undefined && onViewOnMap && (
                            <Button
                                onClick={() => onViewOnMap(file)}
                                variant="outline"
                                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                            >
                                <MapPin className="w-4 h-4 mr-2" />
                                View on Map
                            </Button>
                        )}
                        <Button
                            onClick={onClose}
                            variant="ghost"
                            className="text-slate-400 hover:text-slate-200"
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
