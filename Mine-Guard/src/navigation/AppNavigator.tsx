import React, { useEffect } from 'react';
import { Text, ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAxios, authService } from '../services/api/authService';

// Auth Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';
import { WalletLoginScreen } from '../screens/auth/WalletLoginScreen';

// Citizen Screens
import { UploadReportScreen } from '../screens/citizen/UploadReportScreen';
import { HomeScreen } from '../screens/citizen/HomeScreen';
import { ReportHistoryScreen } from '../screens/citizen/ReportHistoryScreen';
import { RewardsScreen } from '../screens/citizen/RewardsScreen';
import { ProfileScreen } from '../screens/citizen/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const CitizenTabNavigator = () => {
    const { theme: appTheme } = useThemeStore();
    
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarStyle: {
                    backgroundColor: appTheme.cardBg,
                    borderTopColor: appTheme.borderColor,
                    borderTopWidth: 1,
                    height: 70,
                    paddingBottom: 10,
                    paddingTop: 10,
                },
                tabBarActiveTintColor: appTheme.primary,
                tabBarInactiveTintColor: appTheme.textSecondary,
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                    marginTop: 4,
                    color: appTheme.text,
                },
                headerStyle: {
                    backgroundColor: appTheme.cardBg,
                    borderBottomColor: appTheme.borderColor,
                    borderBottomWidth: 1,
                },
                headerTintColor: appTheme.text,
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => <Text style={{ fontSize: 24 }}>🏠</Text>,
                    tabBarLabel: 'Home',
                }}
            />
            <Tab.Screen
                name="Upload"
                component={UploadReportScreen}
                options={{
                    title: 'Report',
                    tabBarIcon: ({ color, size }) => <Text style={{ fontSize: 24 }}>📸</Text>,
                    tabBarLabel: 'Report',
                }}
            />
            <Tab.Screen
                name="Reports"
                component={ReportHistoryScreen}
                options={{
                    title: 'My Reports',
                    tabBarIcon: ({ color, size }) => <Text style={{ fontSize: 24 }}>📋</Text>,
                    tabBarLabel: 'Reports',
                }}
            />
            <Tab.Screen
                name="Rewards"
                component={RewardsScreen}
                options={{
                    title: 'Rewards',
                    tabBarIcon: ({ color, size }) => <Text style={{ fontSize: 24 }}>🪙</Text>,
                    tabBarLabel: 'Rewards',
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => <Text style={{ fontSize: 24 }}>👤</Text>,
                    tabBarLabel: 'Profile',
                }}
            />
        </Tab.Navigator>
    );
};

export const AppNavigator = () => {
    const { isConnected, setJwtToken, setUserId, setWalletAddress, setRole, setEmail: setStoreEmail, disconnect } = useAuthStore();
    const { theme: appTheme } = useThemeStore();
    const [loading, setLoading] = React.useState(true);

    useEffect(() => {
        const restoreToken = async () => {
            try {
                const token = await AsyncStorage.getItem('jwtToken');
                if (token) {
                    authService.setAuthHeader(token);
                    // Validate token against backend; if invalid, force logout so Sign In shows.
                    try {
                        await authAxios.get('/profile');
                        setJwtToken(token);

                        const userId = await AsyncStorage.getItem('userId');
                        const walletAddress = await AsyncStorage.getItem('walletAddress');
                        const userRole = await AsyncStorage.getItem('userRole');
                        const email = await AsyncStorage.getItem('email');

                        if (userId) setUserId(userId);
                        if (walletAddress) setWalletAddress(walletAddress);
                        if (userRole) setRole(userRole as 'citizen' | 'admin');
                        if (email) setStoreEmail(email);
                    } catch {
                        disconnect();
                    }
                }
            } catch (error) {
                console.error('Error restoring token:', error);
            } finally {
                setLoading(false);
            }
        };

        restoreToken();
    }, []);

    if (loading) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: appTheme.background }}>
                <ActivityIndicator size="large" color={appTheme.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    cardStyle: { backgroundColor: appTheme.background },
                }}
            >
                {!isConnected ? (
                    <Stack.Group>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Signup" component={SignupScreen} />
                        <Stack.Screen name="WalletLogin" component={WalletLoginScreen} />
                    </Stack.Group>
                ) : (
                    <Stack.Screen name="MainApp" component={CitizenTabNavigator} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};
