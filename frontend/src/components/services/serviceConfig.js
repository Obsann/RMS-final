/**
 * Service Hub Configuration
 * Single source of truth for all resident services.
 * Each service defines its form fields, request type mapping, and employee category routing.
 */

export const SERVICE_GROUPS = [
  {
    id: 'identity',
    label: 'Identity & Registration',
    icon: 'IdCard',
    description: 'ID applications and renewals',
    services: [
      {
        id: 'new_id_application',
        label: 'New ID Application',
        description: 'Apply for a new resident identification card',
        icon: 'UserPlus',
        requestType: 'identity',
        categoryTag: 'ID_REGISTRATION',
        employeeCategory: 'ID & Registration',
        fields: [
          { name: 'fullName', label: 'Full Legal Name', type: 'text', required: true, placeholder: 'As it appears on official documents' },
          { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
          { name: 'gender', label: 'Gender', type: 'select', required: true, options: ['Male', 'Female'] },
          { name: 'nationality', label: 'Nationality', type: 'text', required: true, placeholder: 'e.g. Ethiopian' },
          { name: 'motherName', label: "Mother's Full Name", type: 'text', required: true },
          { name: 'fatherName', label: "Father's Full Name", type: 'text', required: true },
          { name: 'maritalStatus', label: 'Marital Status', type: 'select', required: true, options: ['Single', 'Married', 'Divorced', 'Widowed'] },
          { name: 'occupation', label: 'Occupation', type: 'text', required: false, placeholder: 'Current occupation' },
          { name: 'phone', label: 'Phone Number', type: 'phone', required: true, placeholder: '+251...' },
          { name: 'address', label: 'Residential Address', type: 'textarea', required: true, placeholder: 'Kebele, Woreda, Sub-city' },
        ],
      },
      {
        id: 'id_renewal',
        label: 'ID Renewal',
        description: 'Renew an existing or expired identification card',
        icon: 'RefreshCw',
        requestType: 'id_renewal',
        categoryTag: 'ID_REGISTRATION',
        employeeCategory: 'ID & Registration',
        fields: [
          { name: 'existingIdNumber', label: 'Existing ID Number', type: 'text', required: true, placeholder: 'Your current ID number' },
          { name: 'fullName', label: 'Full Legal Name', type: 'text', required: true },
          { name: 'renewalReason', label: 'Reason for Renewal', type: 'select', required: true, options: ['Expired', 'Lost', 'Damaged', 'Name Change', 'Address Change'] },
          { name: 'phone', label: 'Phone Number', type: 'phone', required: true },
          { name: 'additionalNotes', label: 'Additional Notes', type: 'textarea', required: false, placeholder: 'Any details the office should know' },
        ],
      },
    ],
  },
  {
    id: 'certificates',
    label: 'Certificates',
    icon: 'Award',
    description: 'Birth, marriage, and death certificates',
    services: [
      {
        id: 'birth_certificate',
        label: 'Birth Certificate',
        description: 'Request a new or replacement birth certificate',
        icon: 'Baby',
        requestType: 'certificate',
        categoryTag: 'DOCUMENT_PROCESSING',
        employeeCategory: 'Document Processing',
        fields: [
          { name: 'childFullName', label: "Child's Full Name", type: 'text', required: true },
          { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
          { name: 'placeOfBirth', label: 'Place of Birth', type: 'text', required: true, placeholder: 'Hospital or location name' },
          { name: 'motherName', label: "Mother's Full Name", type: 'text', required: true },
          { name: 'fatherName', label: "Father's Full Name", type: 'text', required: true },
          { name: 'gender', label: 'Gender', type: 'select', required: true, options: ['Male', 'Female'] },
          { name: 'requestReason', label: 'Reason for Request', type: 'select', required: true, options: ['First Time', 'Replacement', 'Correction'] },
        ],
      },
      {
        id: 'marriage_certificate',
        label: 'Marriage Certificate',
        description: 'Request a marriage certificate or certified copy',
        icon: 'Heart',
        requestType: 'certificate',
        categoryTag: 'DOCUMENT_PROCESSING',
        employeeCategory: 'Document Processing',
        fields: [
          { name: 'spouseName', label: 'Spouse Full Name', type: 'text', required: true },
          { name: 'applicantName', label: 'Applicant Full Name', type: 'text', required: true },
          { name: 'marriageDate', label: 'Date of Marriage', type: 'date', required: true },
          { name: 'marriageVenue', label: 'Venue / Location', type: 'text', required: false, placeholder: 'Church, mosque, court, etc.' },
          { name: 'witnesses', label: 'Witness Names (comma separated)', type: 'text', required: false },
          { name: 'requestReason', label: 'Reason for Request', type: 'select', required: true, options: ['First Time', 'Replacement', 'Certified Copy'] },
        ],
      },
      {
        id: 'death_certificate',
        label: 'Death Certificate',
        description: 'Request a death certificate for a deceased individual',
        icon: 'FileText',
        requestType: 'certificate',
        categoryTag: 'DOCUMENT_PROCESSING',
        employeeCategory: 'Document Processing',
        fields: [
          { name: 'deceasedName', label: 'Full Name of Deceased', type: 'text', required: true },
          { name: 'dateOfDeath', label: 'Date of Death', type: 'date', required: true },
          { name: 'placeOfDeath', label: 'Place of Death', type: 'text', required: true },
          { name: 'causeOfDeath', label: 'Cause of Death', type: 'text', required: false },
          { name: 'relationToDeceased', label: 'Your Relationship to Deceased', type: 'select', required: true, options: ['Spouse', 'Child', 'Parent', 'Sibling', 'Other'] },
          { name: 'applicantName', label: 'Applicant Full Name', type: 'text', required: true },
        ],
      },
    ],
  },
  {
    id: 'permits',
    label: 'Permits',
    icon: 'Shield',
    description: 'Construction, business, and event permits',
    services: [
      {
        id: 'construction_permit',
        label: 'Construction Permit',
        description: 'Apply for a construction or renovation permit',
        icon: 'Building2',
        requestType: 'permit',
        categoryTag: 'DOCUMENT_PROCESSING',
        employeeCategory: 'Document Processing',
        fields: [
          { name: 'projectTitle', label: 'Project Title', type: 'text', required: true, placeholder: 'e.g. Residential Extension' },
          { name: 'projectType', label: 'Type of Construction', type: 'select', required: true, options: ['New Building', 'Extension', 'Renovation', 'Demolition'] },
          { name: 'siteAddress', label: 'Site Address', type: 'textarea', required: true },
          { name: 'estimatedCost', label: 'Estimated Cost (ETB)', type: 'text', required: false },
          { name: 'startDate', label: 'Planned Start Date', type: 'date', required: true },
          { name: 'contractor', label: 'Contractor Name (if known)', type: 'text', required: false },
          { name: 'projectDescription', label: 'Project Description', type: 'textarea', required: true, placeholder: 'Describe the scope of the construction work' },
        ],
      },
      {
        id: 'business_permit',
        label: 'Business Permit',
        description: 'Apply for a new or renewed business license',
        icon: 'Briefcase',
        requestType: 'permit',
        categoryTag: 'DOCUMENT_PROCESSING',
        employeeCategory: 'Document Processing',
        fields: [
          { name: 'businessName', label: 'Business Name', type: 'text', required: true },
          { name: 'businessType', label: 'Type of Business', type: 'select', required: true, options: ['Retail', 'Restaurant/Café', 'Services', 'Manufacturing', 'Technology', 'Other'] },
          { name: 'ownerName', label: 'Owner Full Name', type: 'text', required: true },
          { name: 'businessAddress', label: 'Business Address', type: 'textarea', required: true },
          { name: 'tinNumber', label: 'TIN Number (if available)', type: 'text', required: false },
          { name: 'employeeCount', label: 'Number of Employees', type: 'text', required: false },
          { name: 'businessDescription', label: 'Business Description', type: 'textarea', required: true },
        ],
      },
      {
        id: 'event_permit',
        label: 'Event Permit',
        description: 'Request permission for a public or community event',
        icon: 'Calendar',
        requestType: 'permit',
        categoryTag: 'DOCUMENT_PROCESSING',
        employeeCategory: 'Document Processing',
        fields: [
          { name: 'eventName', label: 'Event Name', type: 'text', required: true },
          { name: 'eventType', label: 'Type of Event', type: 'select', required: true, options: ['Community Gathering', 'Wedding', 'Religious Event', 'Cultural Event', 'Protest/March', 'Other'] },
          { name: 'eventDate', label: 'Event Date', type: 'date', required: true },
          { name: 'eventTime', label: 'Start Time', type: 'text', required: true, placeholder: 'e.g. 10:00 AM' },
          { name: 'eventLocation', label: 'Event Location', type: 'textarea', required: true },
          { name: 'expectedAttendees', label: 'Expected Number of Attendees', type: 'text', required: true },
          { name: 'eventDescription', label: 'Event Description', type: 'textarea', required: true },
        ],
      },
    ],
  },
  {
    id: 'feedback',
    label: 'Feedback & Support',
    icon: 'MessageCircle',
    description: 'Complaints and community feedback',
    services: [
      {
        id: 'file_complaint',
        label: 'File a Complaint',
        description: 'Submit a formal complaint to the administration',
        icon: 'AlertTriangle',
        requestType: 'complaint',
        categoryTag: 'COMPLAINT_HANDLING',
        employeeCategory: 'Complaint Handling',
        fields: [
          { name: 'complaintType', label: 'Complaint Category', type: 'select', required: true, options: ['Noise', 'Sanitation', 'Infrastructure', 'Security', 'Neighbor Dispute', 'Public Service', 'Corruption', 'Other'] },
          { name: 'location', label: 'Location / Area', type: 'text', required: true, placeholder: 'Where the issue is occurring' },
          { name: 'dateOfIncident', label: 'Date of Incident', type: 'date', required: false },
          { name: 'involvedParties', label: 'Involved Parties (if any)', type: 'text', required: false },
          { name: 'description', label: 'Detailed Description', type: 'textarea', required: true, placeholder: 'Please describe the issue in detail...' },
          { name: 'desiredOutcome', label: 'Desired Outcome', type: 'textarea', required: false, placeholder: 'What resolution are you looking for?' },
        ],
      },
    ],
  },
];

/**
 * Flat list of all services for easy lookup
 */
export const ALL_SERVICES = SERVICE_GROUPS.flatMap(g =>
  g.services.map(s => ({ ...s, groupId: g.id, groupLabel: g.label }))
);

/**
 * Find a service by its id
 */
export const getServiceById = (id) => ALL_SERVICES.find(s => s.id === id);

/**
 * Maps categoryTag to a human-readable department name
 */
export const DEPARTMENT_MAP = {
  'ID_REGISTRATION': 'Identity & Registration',
  'DOCUMENT_PROCESSING': 'Document Processing',
  'COMPLAINT_HANDLING': 'Complaints & Feedback',
};

/**
 * Status flow for the request tracker stepper
 */
export const STATUS_STEPS = [
  { key: 'pending', label: 'Submitted' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
];

export const STATUS_TO_STEP_INDEX = {
  pending: 0,
  assigned: 0,
  'in-progress': 1,
  processing: 1,
  completed: 2,
  resolved: 2,
  approved: 2,
  cancelled: -1,
};
