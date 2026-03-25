import * as Location from 'expo-location';
import { MediaFile } from '../types';

export const getCurrentLocation = async (): Promise<{
    latitude: number;
    longitude: number;
    accuracy: number | null;
} | null> => {
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
            console.error('Location permission denied');
            return null;
        }

        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });

        return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
        };
    } catch (error) {
        console.error('Error getting location:', error);
        return null;
    }
};

export const reverseGeocode = async (
    latitude: number,
    longitude: number
): Promise<string | null> => {
    try {
        const addresses = await Location.reverseGeocodeAsync({
            latitude,
            longitude,
        });

        if (addresses.length > 0) {
            const address = addresses[0];
            const parts = [
                address.street,
                address.city,
                address.region,
                address.postalCode,
                address.country,
            ].filter(Boolean);

            return parts.join(', ');
        }

        return null;
    } catch (error) {
        console.error('Error reverse geocoding:', error);
        return null;
    }
};

export const extractGPSFromExif = (exifData: any): {
    latitude?: number;
    longitude?: number;
} => {
    // Extract GPS coordinates from EXIF data
    // This is a simplified version - actual implementation would need more robust parsing
    try {
        if (exifData?.GPS) {
            return {
                latitude: exifData.GPS.Latitude,
                longitude: exifData.GPS.Longitude,
            };
        }
    } catch (error) {
        console.error('Error extracting GPS from EXIF:', error);
    }

    return {};
};

export const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number => {
    // Calculate distance between two points using Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
};

const toRad = (value: number): number => {
    return (value * Math.PI) / 180;
};
