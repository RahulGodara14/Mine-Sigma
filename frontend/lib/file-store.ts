// File store for managing uploaded files with coordinates
// Using localStorage for persistence

export interface UploadedFileData {
    id: string
    name: string
    type: string
    size: number
    uploadedAt: string
    uploadedBy: string
    category: string
    latitude?: number
    longitude?: number
    description?: string
    preview?: string
    dataUrl?: string // Base64 encoded file data for small files
}

const STORAGE_KEY = "mine-sigma-uploaded-files"

// Get all uploaded files from storage
export function getUploadedFiles(): UploadedFileData[] {
    if (typeof window === "undefined") return []

    try {
        const data = localStorage.getItem(STORAGE_KEY)
        return data ? JSON.parse(data) : []
    } catch (error) {
        console.error("Error reading uploaded files:", error)
        return []
    }
}

// Save a new file to storage
export function saveUploadedFile(file: UploadedFileData): void {
    if (typeof window === "undefined") return

    try {
        const files = getUploadedFiles()
        files.push(file)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(files))
    } catch (error) {
        console.error("Error saving uploaded file:", error)
    }
}

// Update an existing file
export function updateUploadedFile(id: string, updates: Partial<UploadedFileData>): void {
    if (typeof window === "undefined") return

    try {
        const files = getUploadedFiles()
        const index = files.findIndex((f) => f.id === id)
        if (index !== -1) {
            files[index] = { ...files[index], ...updates }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(files))
        }
    } catch (error) {
        console.error("Error updating uploaded file:", error)
    }
}

// Delete a file from storage
export function deleteUploadedFile(id: string): void {
    if (typeof window === "undefined") return

    try {
        const files = getUploadedFiles()
        const filtered = files.filter((f) => f.id !== id)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    } catch (error) {
        console.error("Error deleting uploaded file:", error)
    }
}

// Get files with coordinates only
export function getFilesWithCoordinates(): UploadedFileData[] {
    return getUploadedFiles().filter((file) =>
        file.latitude !== undefined && file.longitude !== undefined
    )
}

// Get file by ID
export function getFileById(id: string): UploadedFileData | undefined {
    return getUploadedFiles().find((f) => f.id === id)
}

// Convert File to base64 (for small files)
export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = (error) => reject(error)
    })
}
