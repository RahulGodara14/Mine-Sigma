import { create } from 'zustand';
import { Report, MediaFile } from '../types';

interface ReportState {
    // Draft report data
    draftReport: Partial<Report> | null;
    uploadedMedia: MediaFile[];
    isSubmitting: boolean;

    // Report history
    myReports: Report[];
    isLoadingReports: boolean;

    // Actions
    setDraftReport: (report: Partial<Report>) => void;
    addMediaFile: (file: MediaFile) => void;
    removeMediaFile: (fileName: string) => void;
    clearDraft: () => void;
    setSubmitting: (submitting: boolean) => void;

    setMyReports: (reports: Report[]) => void;
    addReport: (report: Report) => void;
    updateReportStatus: (reportId: string, status: Report['status']) => void;
    setLoadingReports: (loading: boolean) => void;
}

export const useReportStore = create<ReportState>((set) => ({
    draftReport: null,
    uploadedMedia: [],
    isSubmitting: false,
    myReports: [],
    isLoadingReports: false,

    setDraftReport: (report) => set({ draftReport: report }),

    addMediaFile: (file) =>
        set((state) => ({
            uploadedMedia: [...state.uploadedMedia, file],
        })),

    removeMediaFile: (fileName) =>
        set((state) => ({
            uploadedMedia: state.uploadedMedia.filter((f) => f.fileName !== fileName),
        })),

    clearDraft: () =>
        set({
            draftReport: null,
            uploadedMedia: [],
            isSubmitting: false,
        }),

    setSubmitting: (submitting) => set({ isSubmitting: submitting }),

    setMyReports: (reports) => set({ myReports: reports }),

    addReport: (report) =>
        set((state) => ({
            myReports: [report, ...state.myReports],
        })),

    updateReportStatus: (reportId, status) =>
        set((state) => ({
            myReports: state.myReports.map((r) =>
                r.id === reportId ? { ...r, status } : r
            ),
        })),

    setLoadingReports: (loading) => set({ isLoadingReports: loading }),
}));
