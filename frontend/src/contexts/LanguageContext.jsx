import React, { createContext, useContext } from 'react';

// Google Translate natively handles all translations across the DOM.
// We keep this context to supply the base English strings so we don't break existing components
// that still import `useLanguage()` and call `t('some string')`.

export const translations = {
  en: {
    // Sidebar / Navigation
    dashboard: 'Dashboard',
    residents: 'Residents',
    employees: 'Employees',

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
    switchLanguage: 'Language',
  }
};

export const LanguageContext = createContext({
  lang: 'en',
  t: (key) => key,
  setLang: () => { },
  toggleLanguage: () => { },
});

export function LanguageProvider({ children }) {
  const t = (key) => translations['en'][key] || key;

  return (
    <LanguageContext.Provider value={{ lang: 'en', setLang: () => {}, t, toggleLanguage: () => {} }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}