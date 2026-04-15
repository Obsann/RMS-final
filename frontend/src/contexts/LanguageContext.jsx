import React, { createContext, useContext, useState } from 'react';

export const translations = {
  en: {
    // Sidebar / Navigation
    dashboard: 'Dashboard',
    residents: 'Residents',
    employees: 'Employees',
    specialEmployees: 'Special Employees',
    taskManagement: 'Task Management',
    requestsComplaints: 'Requests & Complaints',
    digitalIdSystem: 'Digital ID System',
    notifications: 'Notifications',
    reports: 'Reports',
    settings: 'Settings',
    logout: 'Logout',
    myTasks: 'My Tasks',
    myRequests: 'My Requests',
    digitalId: 'Digital ID',
    profile: 'Profile',
    // App-wide
    propertyManagement: 'Resident Management',
    searchPlaceholder: 'Search residents, employees, tasks...',
    // Welcome
    welcomeTitle: 'Resident Management System',
    welcomeSubtitle: 'Comprehensive resident management solution for modern living',
    getStarted: 'Get Started',
    loginButton: 'Login to Your Account',
    registerButton: 'Register as Resident',
    residentMgmt: 'Resident Management',
    residentMgmtDesc: 'Manage residents, dependents, and digital IDs efficiently',
    taskTracking: 'Task Tracking',
    taskTrackingDesc: 'Track maintenance tasks and employee assignments in real-time',
    requestSystem: 'Request System',
    requestSystemDesc: 'Handle maintenance requests and complaints seamlessly',
    // Login
    signIn: 'Sign In',
    signInSubtitle: 'Sign in to your account',
    emailAddress: 'Email Address',
    password: 'Password',
    loginAs: 'Login As',
    noAccount: "Don't have an account? Register as Resident",
    backToHome: 'Back to Home',
    // Register
    createAccount: 'Create Account',
    createAccountSubtitle: 'Create your resident account',
    fullName: 'Full Name',
    phone: 'Phone Number',
    unitNumber: 'Unit Number',
    confirmPassword: 'Confirm Password',
    alreadyHaveAccount: 'Already have an account? Sign in',
    // Actions
    addResident: 'Add Resident',
    addEmployee: 'Add Employee',
    addSpecialEmployee: 'Add Special Employee',
    createTask: 'Create Task',
    cancel: 'Cancel',
    save: 'Save Changes',
    close: 'Close',
    submit: 'Submit',
    submitRequest: 'Submit Request',
    submitComplaint: 'Submit Complaint',
    // Digital ID
    requestDigitalId: 'Request Digital ID',
    idStatus: 'ID Status',
    idWorkflow: 'Digital ID Workflow',
    // Reports
    generateReport: 'Generate Report',
    exportPdf: 'Export PDF',
    exportExcel: 'Export Excel',
    // Language toggle label shown on button
    switchLanguage: 'አማርኛ',
  },
  am: {
    // Sidebar / Navigation
    dashboard: 'ዳሽቦርድ',
    residents: 'ነዋሪዎች',
    employees: 'ሠራተኞች',
    specialEmployees: 'ልዩ ሠራተኞች',
    taskManagement: 'የሥራ አስተዳደር',
    requestsComplaints: 'ጥያቄዎች እና ቅሬታዎች',
    digitalIdSystem: 'ዲጂታል መታወቂያ ስርዓት',
    notifications: 'ማሳወቂያዎች',
    reports: 'ሪፖርቶች',
    settings: 'ቅንብሮች',
    logout: 'ውጣ',
    myTasks: 'የእኔ ሥራዎች',
    myRequests: 'የእኔ ጥያቄዎች',
    digitalId: 'ዲጂታል መታወቂያ',
    profile: 'መገለጫ',
    // App-wide
    propertyManagement: 'ነዋሪ አስተዳደር',
    searchPlaceholder: 'ነዋሪዎችን፣ ሠራተኞችን ወይም ሥራዎችን ፈልግ...',
    // Welcome
    welcomeTitle: 'የነዋሪ አስተዳደር ስርዓት',
    welcomeSubtitle: 'ለዘመናዊ ኑሮ ሁሉን አቀፍ የነዋሪ አስተዳደር መፍትሄ',
    getStarted: 'ጀምር',
    loginButton: 'ወደ መለያዎ ይግቡ',
    registerButton: 'እንደ ነዋሪ ይመዝገቡ',
    residentMgmt: 'ነዋሪ አስተዳደር',
    residentMgmtDesc: 'ነዋሪዎችን፣ ጥገኞችን እና ዲጂታል መታወቂያዎችን ያስተዳድሩ',
    taskTracking: 'የሥራ ክትትል',
    taskTrackingDesc: 'የጥገና ሥራዎችን እና የሠራተኛ ምደባዎችን በቀጥታ ይከታተሉ',
    requestSystem: 'የጥያቄ ስርዓት',
    requestSystemDesc: 'የጥገና ጥያቄዎችን እና ቅሬታዎችን ያስተናግዱ',
    // Login
    signIn: 'ግባ',
    signInSubtitle: 'ወደ መለያዎ ይግቡ',
    emailAddress: 'ኢሜይል አድራሻ',
    password: 'የምስጢር ቃል',
    loginAs: 'እንደ ምን ይግቡ',
    noAccount: 'መለያ የለዎትም? እንደ ነዋሪ ይመዝገቡ',
    backToHome: 'ወደ መነሻ ተመለስ',
    // Register
    createAccount: 'መለያ ፍጠር',
    createAccountSubtitle: 'የነዋሪ መለያ ይፍጠሩ',
    fullName: 'ሙሉ ስም',
    phone: 'ስልክ ቁጥር',
    unitNumber: 'የቤት ቁጥር',
    confirmPassword: 'የምስጢር ቃልዎን ያረጋግጡ',
    alreadyHaveAccount: 'መለያ አለዎት? ይግቡ',
    // Actions
    addResident: 'ነዋሪ ጨምር',
    addEmployee: 'ሠራተኛ ጨምር',
    addSpecialEmployee: 'ልዩ ሠራተኛ ጨምር',
    createTask: 'ሥራ ፍጠር',
    cancel: 'ሰርዝ',
    save: 'ለውጦቹን አስቀምጥ',
    close: 'ዝጋ',
    submit: 'አስገባ',
    submitRequest: 'ጥያቄ አስገባ',
    submitComplaint: 'ቅሬታ አስገባ',
    // Digital ID
    requestDigitalId: 'ዲጂታል መታወቂያ ጠይቅ',
    idStatus: 'የመታወቂያ ሁኔታ',
    idWorkflow: 'የዲጂታል መታወቂያ ሂደት',
    // Reports
    generateReport: 'ሪፖርት ፍጠር',
    exportPdf: 'PDF ወደ ውጭ ላክ',
    exportExcel: 'Excel ወደ ውጭ ላክ',
    // Language toggle label shown on button
    switchLanguage: 'English',
  },
};

export const LanguageContext = createContext({
  lang: 'en',
  t: (key) => key,
  toggleLanguage: () => { },
});

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'en' ? 'am' : 'en'));
  };

  const t = (key) => translations[lang][key] || translations['en'][key] || key;

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}