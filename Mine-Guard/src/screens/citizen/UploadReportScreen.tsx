import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { getTranslations } from '../../services/i18n/translations';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { MediaFile, Report } from '../../types';
import { MediaUploader } from '../../components/MediaUploader';
import { LocationPicker } from '../../components/LocationPicker';
import { Button } from '../../components/common/Button';
import { useReportStore } from '../../store/reportStore';
import { useAuthStore } from '../../store/authStore';
import { backendIpfsService } from '../../services/api/backendIpfsService';
import { backendChainService } from '../../services/api/backendChainService';
import { validateReportDescription } from '../../utils/validation';
import { Picker } from '@react-native-picker/picker';

export const UploadReportScreen: React.FC = () => {
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<Report['category']>('illegal_mining');
    const [severity, setSeverity] = useState<Report['severity']>('medium');
    const [location, setLocation] = useState<any>(null);
    const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const { addReport } = useReportStore();
    const { walletAddress } = useAuthStore();
    const { theme, language } = useThemeStore();
    const t = getTranslations(language);

    const handleMediaAdded = (file: MediaFile) => {
        setMediaFiles([...mediaFiles, file]);
    };

    const handleMediaRemoved = (fileName: string) => {
        setMediaFiles(mediaFiles.filter((f) => f.fileName !== fileName));
    };

    const handleLocationSelected = (loc: any) => {
        setLocation(loc);
    };

    const validateForm = (): boolean => {
        if (!description.trim()) {
            Alert.alert('Missing Information', 'Please provide a description');
            return false;
        }

        const descValidation = validateReportDescription(description);
        if (!descValidation.valid) {
            Alert.alert('Invalid Description', descValidation.error);
            return false;
        }

        if (!location) {
            Alert.alert('Missing Location', 'Please set the location');
            return false;
        }

        if (mediaFiles.length === 0) {
            Alert.alert('Missing Evidence', 'Please upload at least one photo or video');
            return false;
        }

        if (!walletAddress) {
            Alert.alert('Not Connected', 'Please connect your wallet first');
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setSubmitting(true);

        try {
            // Step 1: Upload media files via backend proxy
            const mediaHashes = [] as any[];
            for (const file of mediaFiles) {
                try {
                    const ipfsHash = await backendIpfsService.uploadFile(file.uri, file.fileName);
                    mediaHashes.push({ ...file, ipfsHash });
                } catch (e: any) {
                    console.error('Single media upload failed:', file.fileName, e?.message);
                    throw new Error('Failed to upload one of the media files.');
                }
            }

            // Step 2: Create metadata object
            const reportMetadata = {
                description,
                category,
                severity,
                location,
                mediaFiles: mediaHashes,
                timestamp: Date.now(),
            };

            // Step 3: Upload metadata to IPFS
            const metadataHash = await backendIpfsService.uploadJSON(reportMetadata);

            // Step 3: Submit on-chain via backend (returns tx hash & report id)
            let tx_hash: string | undefined;
            let contract_report_id: number | undefined;
            let persisted_id: string | undefined;
            try {
                const res = await backendChainService.submitOnChain(
                    metadataHash,
                    severity as any,
                    category,
                    description,
                    {
                        latitude: location.latitude,
                        longitude: location.longitude,
                        address: location.address,
                    },
                    mediaHashes.map(m => ({
                        ipfsHash: m.ipfsHash,
                        type: m.type,
                        fileName: m.fileName,
                    }))
                );
                tx_hash = res.tx_hash;
                contract_report_id = res.contract_report_id;
                persisted_id = res.id;
                console.log('On-chain submit persisted:', res);
            } catch (e: any) {
                console.error('Backend on-chain submit failed:', e?.response?.data || e?.message);
                throw new Error('Failed to submit report to blockchain');
            }

            // Step 4: Add to local store
            const newReport: Report = {
                id: String(persisted_id ?? Date.now()),
                ipfsHash: metadataHash,
                location: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    address: location.address,
                },
                description,
                category,
                severity,
                mediaFiles,
                timestamp: Date.now(),
                reporterAddress: walletAddress!,
                status: 'pending',
            };

            addReport(newReport);

            Alert.alert(
                'Success!',
                `Report submitted successfully!${tx_hash ? `\nTransaction: ${tx_hash.substring(0, 10)}...` : ''}`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            // Reset form
                            setDescription('');
                            setMediaFiles([]);
                            setLocation(null);
                            setCategory('illegal_mining');
                            setSeverity('medium');
                        },
                    },
                ]
            );
        } catch (error) {
            console.error('Error submitting report:', error);
            Alert.alert('Submission Failed', 'Could not submit report. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <Header title={t.reports.uploadReport} />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
            >
                <Text style={[styles.header, { color: theme.text }]}>
                    {t.reports.uploadReport}
                </Text>
                <Text style={[styles.subheader, { color: theme.textSecondary }]}>
                    {t.reports.uploadReport}
                </Text>

                {/* Media Upload */}
                <MediaUploader
                    onMediaAdded={handleMediaAdded}
                    onMediaRemoved={handleMediaRemoved}
                    mediaFiles={mediaFiles}
                />

                {/* Location Picker */}
                <LocationPicker onLocationSelected={handleLocationSelected} />

                {/* Category Selection */}
                <View
                    style={[
                        styles.card,
                        {
                            backgroundColor: theme.cardBg,
                            borderColor: theme.borderColor,
                        },
                    ]}
                >
                    <Text style={[styles.label, { color: theme.text }]}>
                        {t.reports.category || 'Category'}
                    </Text>
                    <View style={[styles.pickerContainer, { backgroundColor: theme.inputBg }]}>
                        <Picker
                            selectedValue={category}
                            onValueChange={(value) => setCategory(value)}
                            style={{ color: theme.text }}
                        >
                            <Picker.Item label="🪨 Illegal Mining" value="illegal_mining" />
                            <Picker.Item label="🌳 Environmental Damage" value="environmental_damage" />
                            <Picker.Item label="⚠️ Safety Violation" value="safety_violation" />
                            <Picker.Item label="📋 Other" value="other" />
                        </Picker>
                    </View>
                </View>

                {/* Severity Selection */}
                <View
                    style={[
                        styles.card,
                        {
                            backgroundColor: theme.cardBg,
                            borderColor: theme.borderColor,
                        },
                    ]}
                >
                    <Text style={[styles.label, { color: theme.text }]}>
                        Severity Level
                    </Text>
                    <View style={styles.severityRow}>
                        {(['low', 'medium', 'high', 'critical'] as const).map((sev) => (
                            <Button
                                key={sev}
                                title={sev.toUpperCase()}
                                onPress={() => setSeverity(sev)}
                                variant={severity === sev ? 'primary' : 'outline'}
                                style={styles.severityButton}
                            />
                        ))}
                    </View>
                    <Text style={[styles.severityHint, { color: theme.textSecondary }]}>
                        Reward: {severity === 'low' ? '0.1' : severity === 'medium' ? '0.25' : severity === 'high' ? '0.5' : '1.0'} MATIC
                    </Text>
                </View>

                {/* Description */}
                <View
                    style={[
                        styles.card,
                        {
                            backgroundColor: theme.cardBg,
                            borderColor: theme.borderColor,
                        },
                    ]}
                >
                    <Text style={[styles.label, { color: theme.text }]}>
                        {t.reports.description || 'Description'}
                    </Text>
                    <TextInput
                        style={[
                            styles.textArea,
                            {
                                backgroundColor: theme.inputBg,
                                color: theme.text,
                                borderColor: theme.inputBorder,
                            },
                        ]}
                        placeholder={t.reports.description || 'Describe the illegal mining activity...'}
                        placeholderTextColor={theme.textSecondary}
                        multiline
                        numberOfLines={6}
                        value={description}
                        onChangeText={setDescription}
                        maxLength={1000}
                    />
                    <Text style={[styles.charCount, { color: theme.textSecondary }]}>
                        {description.length}/1000 characters
                    </Text>
                </View>

                {/* Submit Button */}
                <Button
                    title={t.reports.submitReport || 'Submit Report'}
                    onPress={handleSubmit}
                    loading={submitting}
                    disabled={submitting}
                    variant="success"
                    style={styles.submitButton}
                />

                <Text style={[styles.privacyNote, { color: theme.textSecondary }]}>
                    🔒 Your identity is protected. Only your wallet address is recorded on the blockchain.
                </Text>

                {/* Footer */}
                <Footer companyName="Gourav Kumar Ojha" />
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 20,
    },
    header: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subheader: {
        fontSize: 16,
        fontWeight: '400',
        marginBottom: 24,
        lineHeight: 22,
    },
    card: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
        letterSpacing: -0.2,
    },
    pickerContainer: {
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
    severityRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    severityButton: {
        flex: 1,
        minHeight: 40,
    },
    severityHint: {
        fontSize: 12,
        marginTop: 8,
        textAlign: 'center',
    },
    textArea: {
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        borderWidth: 1,
        minHeight: 120,
        textAlignVertical: 'top',
    },
    charCount: {
        fontSize: 12,
        marginTop: 8,
        textAlign: 'right',
    },
    submitButton: {
        marginTop: 16,
        marginBottom: 16,
    },
    privacyNote: {
        fontSize: 13,
        textAlign: 'center',
        fontStyle: 'italic',
        marginBottom: 16,
    },
});
