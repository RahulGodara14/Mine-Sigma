import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../theme';
import { MediaFile } from '../types';
import { validateMediaFile } from '../utils/validation';
import { Button } from './common/Button';
import { Card } from './common/Card';

interface MediaUploaderProps {
    onMediaAdded: (media: MediaFile) => void;
    onMediaRemoved: (fileName: string) => void;
    mediaFiles: MediaFile[];
    maxFiles?: number;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
    onMediaAdded,
    onMediaRemoved,
    mediaFiles,
    maxFiles = 5,
}) => {
    const [loading, setLoading] = useState(false);

    const requestPermissions = async () => {
        const { status: cameraStatus } =
            await ImagePicker.requestCameraPermissionsAsync();
        const { status: mediaStatus } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();

        return cameraStatus === 'granted' && mediaStatus === 'granted';
    };

    const pickImage = async () => {
        if (mediaFiles.length >= maxFiles) {
            Alert.alert('Limit reached', `Maximum ${maxFiles} files allowed`);
            return;
        }

        const hasPermission = await requestPermissions();
        if (!hasPermission) {
            Alert.alert('Permission required', 'Please grant camera and media permissions');
            return;
        }

        setLoading(true);

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.All,
                allowsEditing: false,
                quality: 0.8,
                videoMaxDuration: 60, // 1 minute max
            });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];

                const mediaFile: MediaFile = {
                    uri: asset.uri,
                    type: asset.type === 'video' ? 'video' : 'image',
                    fileName: asset.uri.split('/').pop() || `file-${Date.now()}`,
                    fileSize: asset.fileSize || 0,
                    mimeType: asset.mimeType || 'image/jpeg',
                    exifData: asset.exif,
                };

                const validation = validateMediaFile(mediaFile);
                if (!validation.valid) {
                    Alert.alert('Invalid File', validation.error);
                    return;
                }

                onMediaAdded(mediaFile);
            }
        } catch (error) {
            console.error('Error picking media:', error);
            Alert.alert('Error', 'Failed to pick media file');
        } finally {
            setLoading(false);
        }
    };

    const takePhoto = async () => {
        if (mediaFiles.length >= maxFiles) {
            Alert.alert('Limit reached', `Maximum ${maxFiles} files allowed`);
            return;
        }

        const hasPermission = await requestPermissions();
        if (!hasPermission) {
            Alert.alert('Permission required', 'Please grant camera permissions');
            return;
        }

        setLoading(true);

        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 0.8,
                exif: true, // Include GPS data
            });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];

                const mediaFile: MediaFile = {
                    uri: asset.uri,
                    type: 'image',
                    fileName: asset.uri.split('/').pop() || `photo-${Date.now()}`,
                    fileSize: asset.fileSize || 0,
                    mimeType: 'image/jpeg',
                    exifData: asset.exif,
                };

                onMediaAdded(mediaFile);
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            Alert.alert('Error', 'Failed to take photo');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <Text style={styles.title}>Upload Evidence</Text>
            <Text style={styles.subtitle}>
                Add photos or videos ({mediaFiles.length}/{maxFiles})
            </Text>

            <View style={styles.buttonRow}>
                <Button
                    title="Take Photo"
                    onPress={takePhoto}
                    loading={loading}
                    variant="primary"
                    style={styles.actionButton}
                />
                <Button
                    title="Choose from Gallery"
                    onPress={pickImage}
                    loading={loading}
                    variant="outline"
                    style={styles.actionButton}
                />
            </View>

            {mediaFiles.length > 0 && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.mediaPreview}
                >
                    {mediaFiles.map((file, index) => (
                        <View key={index} style={styles.mediaItem}>
                            <Image source={{ uri: file.uri }} style={styles.thumbnail} />
                            <TouchableOpacity
                                style={styles.removeButton}
                                onPress={() => onMediaRemoved(file.fileName)}
                            >
                                <Text style={styles.removeText}>×</Text>
                            </TouchableOpacity>
                            <Text style={styles.fileType}>{file.type}</Text>
                        </View>
                    ))}
                </ScrollView>
            )}

            <Text style={styles.hint}>
                💡 Photos with GPS data will be auto-tagged
            </Text>
        </Card>
    );
};

const styles = StyleSheet.create({
    title: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.md,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.md,
    },
    actionButton: {
        flex: 1,
    },
    mediaPreview: {
        marginTop: theme.spacing.md,
    },
    mediaItem: {
        marginRight: theme.spacing.sm,
        position: 'relative',
    },
    thumbnail: {
        width: 100,
        height: 100,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.backgroundLight,
    },
    removeButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: theme.colors.error,
        borderRadius: theme.borderRadius.full,
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeText: {
        color: theme.colors.textPrimary,
        fontSize: 18,
        fontWeight: theme.fontWeight.bold,
    },
    fileType: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textMuted,
        textAlign: 'center',
        marginTop: theme.spacing.xs,
    },
    hint: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textMuted,
        marginTop: theme.spacing.sm,
        fontStyle: 'italic',
    },
});
