// Multilingual translations - English, Hindi, and Hinglish

export type Language = 'en' | 'hi' | 'hinglish';

export interface Translations {
  // Common
  common: {
    ok: string;
    cancel: string;
    back: string;
    next: string;
    submit: string;
    loading: string;
    error: string;
    success: string;
  };
  // Auth
  auth: {
    login: string;
    signup: string;
    logout: string;
    email: string;
    password: string;
    confirmPassword: string;
    enterEmail: string;
    enterPassword: string;
    enterConfirmPassword: string;
    forgotPassword: string;
    createAccount: string;
    alreadyHaveAccount: string;
    dontHaveAccount: string;
    loginWithWallet: string;
    signupWithWallet: string;
    orContinueWith: string;
    emailRequired: string;
    passwordRequired: string;
    passwordMismatch: string;
    invalidEmail: string;
    loginSuccess: string;
    signupSuccess: string;
  };
  // Reports
  reports: {
    report: string;
    reports: string;
    uploadReport: string;
    reportHistory: string;
    category: string;
    description: string;
    location: string;
    severity: string;
    selectCategory: string;
    addLocation: string;
    uploadMedia: string;
    submitReport: string;
    reportSubmitted: string;
    pending: string;
    approved: string;
    rejected: string;
    underReview: string;
  };
  // Rewards
  rewards: {
    rewards: string;
    totalRewards: string;
    claimReward: string;
    claimed: string;
    pending: string;
    noRewards: string;
    rewardClaimed: string;
  };
  // Navigation
  navigation: {
    home: string;
    upload: string;
    history: string;
    rewards: string;
    profile: string;
  };
  // Profile
  profile: {
    profile: string;
    personalInfo: string;
    name: string;
    email: string;
    wallet: string;
    settings: string;
    language: string;
    darkMode: string;
    notifications: string;
    about: string;
    logout: string;
  };
  // Messages
  messages: {
    welcomeBack: string;
    reportedCases: string;
    totalRewards: string;
    pendingReview: string;
    noReportsYet: string;
    startReporting: string;
  };
}

const englishTranslations: Translations = {
  common: {
    ok: 'OK',
    cancel: 'Cancel',
    back: 'Back',
    next: 'Next',
    submit: 'Submit',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
  },
  auth: {
    login: 'Login',
    signup: 'Sign Up',
    logout: 'Logout',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    enterEmail: 'Enter your email',
    enterPassword: 'Enter your password',
    enterConfirmPassword: 'Confirm your password',
    forgotPassword: 'Forgot Password?',
    createAccount: 'Create Your Account',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
    loginWithWallet: 'Login with Wallet',
    signupWithWallet: 'Sign Up with Wallet',
    orContinueWith: 'OR',
    emailRequired: 'Email is required',
    passwordRequired: 'Password is required',
    passwordMismatch: 'Passwords do not match',
    invalidEmail: 'Invalid email address',
    loginSuccess: 'Login successful!',
    signupSuccess: 'Account created successfully!',
  },
  reports: {
    report: 'Report',
    reports: 'Reports',
    uploadReport: 'Upload Report',
    reportHistory: 'Report History',
    category: 'Category',
    description: 'Description',
    location: 'Location',
    severity: 'Severity',
    selectCategory: 'Select a category',
    addLocation: 'Add location',
    uploadMedia: 'Upload media',
    submitReport: 'Submit Report',
    reportSubmitted: 'Report submitted successfully',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    underReview: 'Under Review',
  },
  rewards: {
    rewards: 'Rewards',
    totalRewards: 'Total Rewards',
    claimReward: 'Claim Reward',
    claimed: 'Claimed',
    pending: 'Pending',
    noRewards: 'No rewards yet',
    rewardClaimed: 'Reward claimed successfully',
  },
  navigation: {
    home: 'Home',
    upload: 'Upload',
    history: 'History',
    rewards: 'Rewards',
    profile: 'Profile',
  },
  profile: {
    profile: 'Profile',
    personalInfo: 'Personal Information',
    name: 'Name',
    email: 'Email',
    wallet: 'Wallet Address',
    settings: 'Settings',
    language: 'Language',
    darkMode: 'Dark Mode',
    notifications: 'Notifications',
    about: 'About',
    logout: 'Logout',
  },
  messages: {
    welcomeBack: 'Welcome back!',
    reportedCases: 'Reported Cases',
    totalRewards: 'Total Rewards',
    pendingReview: 'Pending Review',
    noReportsYet: 'No reports yet',
    startReporting: 'Start reporting today',
  },
};

const hindiTranslations: Translations = {
  common: {
    ok: 'ठीक है',
    cancel: 'रद्द करें',
    back: 'वापस जाएं',
    next: 'अगला',
    submit: 'जमा करें',
    loading: 'लोड हो रहा है...',
    error: 'त्रुटि',
    success: 'सफल',
  },
  auth: {
    login: 'लॉगिन करें',
    signup: 'साइन अप करें',
    logout: 'लॉगआउट',
    email: 'ईमेल',
    password: 'पासवर्ड',
    confirmPassword: 'पासवर्ड की पुष्टि करें',
    enterEmail: 'अपना ईमेल दर्ज करें',
    enterPassword: 'अपना पासवर्ड दर्ज करें',
    enterConfirmPassword: 'पासवर्ड की पुष्टि करें',
    forgotPassword: 'पासवर्ड भूल गए?',
    createAccount: 'अपना खाता बनाएं',
    alreadyHaveAccount: 'पहले से खाता है?',
    dontHaveAccount: 'खाता नहीं है?',
    loginWithWallet: 'वॉलेट से लॉगिन करें',
    signupWithWallet: 'वॉलेट से साइन अप करें',
    orContinueWith: 'या',
    emailRequired: 'ईमेल आवश्यक है',
    passwordRequired: 'पासवर्ड आवश्यक है',
    passwordMismatch: 'पासवर्ड मेल नहीं खाते',
    invalidEmail: 'अमान्य ईमेल पता',
    loginSuccess: 'लॉगिन सफल!',
    signupSuccess: 'खाता सफलतापूर्वक बनाया गया!',
  },
  reports: {
    report: 'रिपोर्ट',
    reports: 'रिपोर्ट्स',
    uploadReport: 'रिपोर्ट अपलोड करें',
    reportHistory: 'रिपोर्ट हिस्ट्री',
    category: 'श्रेणी',
    description: 'विवरण',
    location: 'स्थान',
    severity: 'गंभीरता',
    selectCategory: 'श्रेणी चुनें',
    addLocation: 'स्थान जोड़ें',
    uploadMedia: 'मीडिया अपलोड करें',
    submitReport: 'रिपोर्ट जमा करें',
    reportSubmitted: 'रिपोर्ट सफलतापूर्वक जमा की गई',
    pending: 'लंबित',
    approved: 'अनुमोदित',
    rejected: 'अस्वीकृत',
    underReview: 'समीक्षा में',
  },
  rewards: {
    rewards: 'पुरस्कार',
    totalRewards: 'कुल पुरस्कार',
    claimReward: 'पुरस्कार दावा करें',
    claimed: 'दावा किया गया',
    pending: 'लंबित',
    noRewards: 'अभी तक कोई पुरस्कार नहीं',
    rewardClaimed: 'पुरस्कार सफलतापूर्वक दावा किया गया',
  },
  navigation: {
    home: 'होम',
    upload: 'अपलोड करें',
    history: 'हिस्ट्री',
    rewards: 'पुरस्कार',
    profile: 'प्रोफाइल',
  },
  profile: {
    profile: 'प्रोफाइल',
    personalInfo: 'व्यक्तिगत जानकारी',
    name: 'नाम',
    email: 'ईमेल',
    wallet: 'वॉलेट पता',
    settings: 'सेटिंग्स',
    language: 'भाषा',
    darkMode: 'डार्क मोड',
    notifications: 'सूचनाएं',
    about: 'बारे में',
    logout: 'लॉगआउट',
  },
  messages: {
    welcomeBack: 'वापस स्वागत है!',
    reportedCases: 'रिपोर्ट किए गए मामले',
    totalRewards: 'कुल पुरस्कार',
    pendingReview: 'समीक्षा लंबित',
    noReportsYet: 'अभी तक कोई रिपोर्ट नहीं',
    startReporting: 'आज ही रिपोर्ट करना शुरू करें',
  },
};

const hinglishTranslations: Translations = {
  common: {
    ok: 'OK',
    cancel: 'Cancel Karo',
    back: 'Peeche Jao',
    next: 'Agle',
    submit: 'Submit Karo',
    loading: 'Load Ho Raha Hai...',
    error: 'Error',
    success: 'Success',
  },
  auth: {
    login: 'Login Karo',
    signup: 'Sign Up Karo',
    logout: 'Logout Karo',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Password Confirm Karo',
    enterEmail: 'Apna Email Dalo',
    enterPassword: 'Apna Password Dalo',
    enterConfirmPassword: 'Password Confirm Karo',
    forgotPassword: 'Password Bhul Gaye?',
    createAccount: 'Naya Account Banao',
    alreadyHaveAccount: 'Pehle Se Account Hai?',
    dontHaveAccount: 'Account Nahi Hai?',
    loginWithWallet: 'Wallet Se Login Karo',
    signupWithWallet: 'Wallet Se Sign Up Karo',
    orContinueWith: 'YA',
    emailRequired: 'Email Zaroori Hai',
    passwordRequired: 'Password Zaroori Hai',
    passwordMismatch: 'Password Match Nahi Ho Rahe',
    invalidEmail: 'Email Galat Hai',
    loginSuccess: 'Login Successful!',
    signupSuccess: 'Account Bann Gaya!',
  },
  reports: {
    report: 'Report',
    reports: 'Reports',
    uploadReport: 'Report Upload Karo',
    reportHistory: 'Report History',
    category: 'Category',
    description: 'Description',
    location: 'Location',
    severity: 'Severity',
    selectCategory: 'Category Select Karo',
    addLocation: 'Location Add Karo',
    uploadMedia: 'Media Upload Karo',
    submitReport: 'Report Submit Karo',
    reportSubmitted: 'Report Successfully Submit Ho Gaya',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    underReview: 'Under Review',
  },
  rewards: {
    rewards: 'Rewards',
    totalRewards: 'Total Rewards',
    claimReward: 'Reward Claim Karo',
    claimed: 'Claim Ho Gaya',
    pending: 'Pending',
    noRewards: 'Abhi Koi Reward Nahi Hai',
    rewardClaimed: 'Reward Successfully Claim Ho Gaya',
  },
  navigation: {
    home: 'Home',
    upload: 'Upload',
    history: 'History',
    rewards: 'Rewards',
    profile: 'Profile',
  },
  profile: {
    profile: 'Profile',
    personalInfo: 'Personal Info',
    name: 'Naam',
    email: 'Email',
    wallet: 'Wallet Address',
    settings: 'Settings',
    language: 'Language',
    darkMode: 'Dark Mode',
    notifications: 'Notifications',
    about: 'About',
    logout: 'Logout Karo',
  },
  messages: {
    welcomeBack: 'Welcome Back!',
    reportedCases: 'Reported Cases',
    totalRewards: 'Total Rewards',
    pendingReview: 'Review Mein Hai',
    noReportsYet: 'Abhi Report Nahi Hai',
    startReporting: 'Aaj Se Report Karna Shuru Karo',
  },
};

const translations: Record<Language, Translations> = {
  en: englishTranslations,
  hi: hindiTranslations,
  hinglish: hinglishTranslations,
};

export const getTranslations = (language: Language): Translations => {
  return translations[language] || englishTranslations;
};

export default translations;
