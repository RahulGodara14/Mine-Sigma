import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TextInput, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { theme } from '../theme';
import { getCurrentLocation, reverseGeocode } from '../utils/geolocation';
import { validateCoordinates } from '../utils/validation';
import { Button } from './common/Button';
import { Card } from './common/Card';

interface LocationPickerProps {
    onLocationSelected: (location: {
        latitude: number;
        longitude: number;
        address?: string;
    }) => void;
    initialLocation?: {
        latitude: number;
        longitude: number;
    };
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
    onLocationSelected,
    initialLocation,
}) => {
    const [location, setLocation] = useState(initialLocation || null);
    const [address, setAddress] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [manualMode, setManualMode] = useState(false);
    const [manualLat, setManualLat] = useState('');
    const [manualLng, setManualLng] = useState('');

    useEffect(() => {
        if (!initialLocation) {
            fetchCurrentLocation();
        }
    }, []);

    const fetchCurrentLocation = async () => {
        setLoading(true);
        try {
            const currentLoc = await getCurrentLocation();
            if (currentLoc) {
                const { latitude, longitude } = currentLoc;
                setLocation({ latitude, longitude });

                const addr = await reverseGeocode(latitude, longitude);
                setAddress(addr);

                onLocationSelected({ latitude, longitude, address: addr || undefined });
            } else {
                Alert.alert(
                    'Location Error',
                    'Could not get your location. Please enable location services or enter manually.'
                );
            }
        } catch (error) {
            console.error('Error fetching location:', error);
            Alert.alert('Error', 'Failed to fetch location');
        } finally {
            setLoading(false);
        }
    };

    const handleMapPress = async (event: any) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;
        setLocation({ latitude, longitude });

        const addr = await reverseGeocode(latitude, longitude);
        setAddress(addr);

        onLocationSelected({ latitude, longitude, address: addr || undefined });
    };

    const handleManualEntry = () => {
        const lat = parseFloat(manualLat);
        const lng = parseFloat(manualLng);

        if (isNaN(lat) || isNaN(lng)) {
            Alert.alert('Invalid Input', 'Please enter valid coordinates');
            return;
        }

        if (!validateCoordinates(lat, lng)) {
            Alert.alert('Invalid Coordinates', 'Latitude must be -90 to 90, Longitude -180 to 180');
            return;
        }

        setLocation({ latitude: lat, longitude: lng });
        setManualMode(false);
        onLocationSelected({ latitude: lat, longitude: lng });
    };

    return (
        <Card>
            <Text style={styles.title}>Location</Text>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={styles.loadingText}>Getting your location...</Text>
                </View>
            ) : location ? (
                <>
                    <View style={styles.mapContainer}>
                        {Platform.OS === 'web' ? (
                            <View style={[styles.map, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e293b', padding: 16 }]}>
                                <Text style={{ color: '#94a3b8', textAlign: 'center', fontSize: 13 }}>
                                    🗺️ Map view is optimized for Android & iOS (Expo Go). Coordinates and manual entry can be used below.
                                </Text>
                            </View>
                        ) : (
                            <MapView
                                style={styles.map}
                                provider={PROVIDER_DEFAULT}
                                initialRegion={{
                                    latitude: location.latitude,
                                    longitude: location.longitude,
                                    latitudeDelta: 0.01,
                                    longitudeDelta: 0.01,
                                }}
                                onPress={handleMapPress}
                            >
                                <Marker
                                    coordinate={location}
                                    title="Report Location"
                                    description={address || 'Selected location'}
                                />
                            </MapView>
                        )}
                    </View>

                    {address && (
                        <View style={styles.addressContainer}>
                            <Text style={styles.addressLabel}>Address:</Text>
                            <Text style={styles.addressText}>{address}</Text>
                        </View>
                    )}

                    <View style={styles.coordsContainer}>
                        <Text style={styles.coordsText}>
                            📍 {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                        </Text>
                    </View>

                    <View style={styles.buttonRow}>
                        <Button
                            title="Refresh Location"
                            onPress={fetchCurrentLocation}
                            variant="outline"
                            style={styles.smallButton}
                        />
                        <Button
                            title="Manual Entry"
                            onPress={() => setManualMode(!manualMode)}
                            variant="outline"
                            style={styles.smallButton}
                        />
                    </View>

                    {manualMode && (
                        <View style={styles.manualEntry}>
                            <TextInput
                                style={styles.input}
                                placeholder="Latitude"
                                placeholderTextColor={theme.colors.textMuted}
                                keyboardType="numeric"
                                value={manualLat}
                                onChangeText={setManualLat}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Longitude"
                                placeholderTextColor={theme.colors.textMuted}
                                keyboardType="numeric"
                                value={manualLng}
                                onChangeText={setManualLng}
                            />
                            <Button
                                title="Set Location"
                                onPress={handleManualEntry}
                                variant="success"
                            />
                        </View>
                    )}
                </>
            ) : (
                <Button
                    title="Get Current Location"
                    onPress={fetchCurrentLocation}
                    variant="primary"
                />
            )}
        </Card>
    );
};

const styles = StyleSheet.create({
    title: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.md,
    },
    loadingContainer: {
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    loadingText: {
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.sm,
    },
    mapContainer: {
        height: 200,
        borderRadius: theme.borderRadius.md,
        overflow: 'hidden',
        marginBottom: theme.spacing.md,
    },
    map: {
        flex: 1,
    },
    addressContainer: {
        backgroundColor: theme.colors.backgroundLight,
        padding: theme.spacing.sm,
        borderRadius: theme.borderRadius.sm,
        marginBottom: theme.spacing.sm,
    },
    addressLabel: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textMuted,
        marginBottom: 2,
    },
    addressText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textPrimary,
    },
    coordsContainer: {
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    coordsText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        fontFamily: 'monospace',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    smallButton: {
        flex: 1,
    },
    manualEntry: {
        marginTop: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    input: {
        backgroundColor: theme.colors.backgroundLight,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.md,
        borderWidth: 1,
        borderColor: theme.colors.glassBorder,
    },
});
