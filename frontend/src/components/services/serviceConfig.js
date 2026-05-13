/**
 * Service Hub Configuration
 * Single source of truth for all resident services.
 * Each service defines its form fields, request type mapping, and employee category routing.
 * Vital event services use multi-step forms with `steps` and `step` field property.
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
        description: 'Apply for a new Kebele resident identification card (per Proclamation No. 1284/2023)',
        icon: 'UserPlus',
        requestType: 'identity',
        categoryTag: 'ID_REGISTRATION',
        employeeCategory: 'ID & Registration',
        fields: [
          // ── Triple Name (English) — Legally mandatory ──
          { name: 'firstName', label: 'First Name / የመጀመሪያ ስም', type: 'text', required: true, placeholder: 'Your given name' },
          { name: 'fatherName', label: "Father's Name / የአባት ስም", type: 'text', required: true, placeholder: "Father's name" },
          { name: 'grandfatherName', label: "Grandfather's Name / የአያት ስም", type: 'text', required: true, placeholder: "Grandfather's name" },
          // ── Triple Name (Amharic) — Bilingual requirement ──
          { name: 'firstNameAmharic', label: 'First Name (Amharic) / የመጀመሪያ ስም (አማርኛ)', type: 'text', required: true, placeholder: 'በአማርኛ ይጻፉ' },
          { name: 'fatherNameAmharic', label: "Father's Name (Amharic) / የአባት ስም (አማርኛ)", type: 'text', required: true, placeholder: 'በአማርኛ ይጻፉ' },
          { name: 'grandfatherNameAmharic', label: "Grandfather's Name (Amharic) / የአያት ስም (አማርኛ)", type: 'text', required: true, placeholder: 'በአማርኛ ይጻፉ' },
          // ── Core biographic data ──
          { name: 'dateOfBirth', label: 'Date of Birth / የልደት ቀን', type: 'date', required: true },
          { name: 'gender', label: 'Gender / ጾታ', type: 'select', required: true, options: ['Male', 'Female'] },
          { name: 'nationality', label: 'Nationality / ዜግነት', type: 'text', required: true, placeholder: 'e.g. Ethiopian' },
          { name: 'placeOfBirth', label: 'Place of Birth / የትውልድ ቦታ', type: 'text', required: true, placeholder: 'Region, Zone, Woreda (e.g. Oromia, Jimma Zone, Jimma City)' },
          { name: 'bloodType', label: 'Blood Type / የደም ዓይነት', type: 'select', required: false, options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
          // ── Family & personal data ──
          { name: 'motherName', label: "Mother's Full Name / የእናት ሙሉ ስም", type: 'text', required: true },
          { name: 'maritalStatus', label: 'Marital Status / የጋብቻ ሁኔታ', type: 'select', required: true, options: ['Single', 'Married', 'Divorced', 'Widowed'] },
          { name: 'occupation', label: 'Occupation / ሙያ', type: 'text', required: false, placeholder: 'Current occupation' },
          { name: 'educationLevel', label: 'Education Level / የትምህርት ደረጃ', type: 'select', required: false, options: ['No Formal Education', 'Primary (1-8)', 'Secondary (9-12)', 'Certificate', 'Diploma', "Bachelor's Degree", "Master's Degree", 'PhD'] },
          // ── Address within Hermata Merkato ──
          { name: 'houseNumber', label: 'House Number / የቤት ቁጥር', type: 'text', required: true, placeholder: 'Your house number within Hermata Merkato Kebele' },
          { name: 'phone', label: 'Phone Number / ስልክ ቁጥር', type: 'phone', required: true, placeholder: '+251...' },
          // ── Emergency contact (for back of card) ──
          { name: 'emergencyContactName', label: 'Emergency Contact Name / የአደጋ ጊዜ ተጠሪ ስም', type: 'text', required: true, placeholder: 'Full name of emergency contact' },
          { name: 'emergencyContactPhone', label: 'Emergency Contact Phone / የአደጋ ጊዜ ተጠሪ ስልክ', type: 'phone', required: true, placeholder: '+251...' },
          // ── Passport photo (optional — updates profile photo if uploaded) ──
          { name: 'passportPhoto', label: 'Passport-Size Photo (Optional) / የፓስፖርት ፎቶ', type: 'file', required: false, accept: 'image/*', helperText: 'White background, front-facing. If uploaded, this will also update your profile photo.' },
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
    description: 'Birth, marriage, death, and divorce certificates',
    services: [
      // ── Birth Registration (Proclamation 760/2012) ──
      {
        id: 'birth_certificate',
        label: 'Birth Registration',
        description: 'Register a birth per Proclamation No. 760/2012',
        icon: 'Baby',
        requestType: 'certificate',
        categoryTag: 'CERTIFICATES',
        employeeCategory: 'Certificates',
        steps: [
          { id: 'identity', label: 'Registrant Identity', icon: '🪪' },
          { id: 'details', label: 'Child & Parents', icon: '👶' },
          { id: 'evidence', label: 'Evidence', icon: '📎' },
        ],
        fields: [
          // Step 1: Registrant Identity
          { name: 'regFirstName', label: 'First Name', type: 'text', required: true, step: 'identity' },
          { name: 'regFatherName', label: "Father's Name", type: 'text', required: true, step: 'identity' },
          { name: 'regGrandfatherName', label: "Grandfather's Name", type: 'text', required: true, step: 'identity' },
          { name: 'regResidentId', label: 'Residence ID Number', type: 'text', required: true, step: 'identity', placeholder: 'Kebele/Woreda ID' },
          { name: 'regRegion', label: 'Region', type: 'text', required: true, step: 'identity' },
          { name: 'regZone', label: 'Zone', type: 'text', required: true, step: 'identity' },
          { name: 'regWoreda', label: 'Woreda', type: 'text', required: true, step: 'identity' },
          { name: 'regKebele', label: 'Kebele', type: 'text', required: true, step: 'identity' },
          { name: 'regHouseNo', label: 'House Number', type: 'text', required: false, step: 'identity' },
          { name: 'regCitizenship', label: 'Citizenship', type: 'text', required: true, step: 'identity', placeholder: 'e.g. Ethiopian' },
          { name: 'regEthnicity', label: 'Ethnicity', type: 'text', required: true, step: 'identity' },
          // Step 2: Child & Parents
          { name: 'childPhoto', label: "Child's Photo", type: 'photo', required: false, step: 'details', helperText: 'Upload a clear photo of the child for the certificate' },
          { name: 'childFullName', label: "Child's Full Name", type: 'text', required: true, step: 'details' },
          { name: 'childSex', label: 'Sex', type: 'select', required: true, options: ['Male', 'Female'], step: 'details' },
          { name: 'childDOB', label: 'Date of Birth', type: 'date', required: true, step: 'details' },
          { name: 'childWeight', label: 'Weight at Birth (kg)', type: 'number', required: true, step: 'details', placeholder: 'e.g. 3.2' },
          { name: 'birthType', label: 'Type of Birth', type: 'select', required: true, options: ['Single', 'Twin', 'Triplet', 'Other'], step: 'details' },
          { name: 'birthPlaceType', label: 'Type of Place', type: 'select', required: true, options: ['Hospital', 'Health Center', 'Home', 'Other'], step: 'details' },
          { name: 'birthFacilityName', label: 'Name of Health Facility', type: 'text', required: false, step: 'details', placeholder: 'If applicable' },
          { name: 'motherFullName', label: "Mother's Full Name", type: 'text', required: true, step: 'details' },
          { name: 'motherDOB', label: "Mother's Date of Birth", type: 'date', required: true, step: 'details' },
          { name: 'motherOccupation', label: "Mother's Occupation", type: 'text', required: false, step: 'details' },
          { name: 'motherEducation', label: "Mother's Education", type: 'select', required: true, options: ['None', 'Primary', 'Secondary', 'Diploma', 'Degree+'], step: 'details' },
          { name: 'fatherFullName', label: "Father's Full Name", type: 'text', required: true, step: 'details' },
          { name: 'fatherDOB', label: "Father's Date of Birth", type: 'date', required: true, step: 'details' },
          { name: 'fatherOccupation', label: "Father's Occupation", type: 'text', required: false, step: 'details' },
          { name: 'fatherEducation', label: "Father's Education", type: 'select', required: true, options: ['None', 'Primary', 'Secondary', 'Diploma', 'Degree+'], step: 'details' },
          // Step 3: Evidence (no extra fields — upload only)
        ],
      },
      // ── Marriage Registration ──
      {
        id: 'marriage_certificate',
        label: 'Marriage Registration',
        description: 'Register a marriage per Proclamation No. 760/2012',
        icon: 'Heart',
        requestType: 'certificate',
        categoryTag: 'CERTIFICATES',
        employeeCategory: 'Certificates',
        steps: [
          { id: 'identity', label: 'Registrant Identity', icon: '🪪' },
          { id: 'details', label: 'Spouses & Ceremony', icon: '💍' },
          { id: 'witnesses', label: 'Witnesses & Evidence', icon: '📎' },
        ],
        fields: [
          // Step 1: Registrant
          { name: 'regFirstName', label: 'First Name', type: 'text', required: true, step: 'identity' },
          { name: 'regFatherName', label: "Father's Name", type: 'text', required: true, step: 'identity' },
          { name: 'regGrandfatherName', label: "Grandfather's Name", type: 'text', required: true, step: 'identity' },
          { name: 'regResidentId', label: 'Residence ID Number', type: 'text', required: true, step: 'identity' },
          { name: 'regRegion', label: 'Region', type: 'text', required: true, step: 'identity' },
          { name: 'regZone', label: 'Zone', type: 'text', required: true, step: 'identity' },
          { name: 'regWoreda', label: 'Woreda', type: 'text', required: true, step: 'identity' },
          { name: 'regKebele', label: 'Kebele', type: 'text', required: true, step: 'identity' },
          { name: 'regHouseNo', label: 'House Number', type: 'text', required: false, step: 'identity' },
          { name: 'regCitizenship', label: 'Citizenship', type: 'text', required: true, step: 'identity' },
          { name: 'regEthnicity', label: 'Ethnicity', type: 'text', required: true, step: 'identity' },
          // Step 2: Spouses & Ceremony
          { name: 'groomPhoto', label: "Groom's Photo", type: 'photo', required: false, step: 'details', helperText: 'Upload a clear photo of the groom for the certificate' },
          { name: 'groomFullName', label: "Groom's Full Name", type: 'text', required: true, step: 'details' },
          { name: 'groomDOB', label: "Groom's Date of Birth", type: 'date', required: true, step: 'details' },
          { name: 'groomPreMaritalStatus', label: "Groom's Pre-marriage Status", type: 'select', required: true, options: ['Single', 'Divorced', 'Widowed'], step: 'details' },
          { name: 'groomReligion', label: "Groom's Religion", type: 'text', required: false, step: 'details' },
          { name: 'bridePhoto', label: "Bride's Photo", type: 'photo', required: false, step: 'details', helperText: 'Upload a clear photo of the bride for the certificate' },
          { name: 'brideFullName', label: "Bride's Full Name", type: 'text', required: true, step: 'details' },
          { name: 'brideDOB', label: "Bride's Date of Birth", type: 'date', required: true, step: 'details' },
          { name: 'bridePreMaritalStatus', label: "Bride's Pre-marriage Status", type: 'select', required: true, options: ['Single', 'Divorced', 'Widowed'], step: 'details' },
          { name: 'brideReligion', label: "Bride's Religion", type: 'text', required: false, step: 'details' },
          { name: 'marriageType', label: 'Type of Marriage', type: 'select', required: true, options: ['Civil', 'Religious', 'Customary'], step: 'details' },
          { name: 'marriageDate', label: 'Date of Marriage', type: 'date', required: true, step: 'details' },
          { name: 'marriagePlace', label: 'Place of Marriage', type: 'text', required: true, step: 'details' },
          // Step 3: Witnesses
          { name: 'witness1Name', label: "Groom's Witness 1 — Full Name", type: 'text', required: true, step: 'witnesses' },
          { name: 'witness1Id', label: "Groom's Witness 1 — Resident ID", type: 'text', required: true, step: 'witnesses' },
          { name: 'witness2Name', label: "Groom's Witness 2 — Full Name", type: 'text', required: true, step: 'witnesses' },
          { name: 'witness2Id', label: "Groom's Witness 2 — Resident ID", type: 'text', required: true, step: 'witnesses' },
          { name: 'witness3Name', label: "Bride's Witness 1 — Full Name", type: 'text', required: true, step: 'witnesses' },
          { name: 'witness3Id', label: "Bride's Witness 1 — Resident ID", type: 'text', required: true, step: 'witnesses' },
          { name: 'witness4Name', label: "Bride's Witness 2 — Full Name", type: 'text', required: true, step: 'witnesses' },
          { name: 'witness4Id', label: "Bride's Witness 2 — Resident ID", type: 'text', required: true, step: 'witnesses' },
        ],
      },
      // ── Death Registration ──
      {
        id: 'death_certificate',
        label: 'Death Registration',
        description: 'Register a death per Proclamation No. 760/2012',
        icon: 'FileText',
        requestType: 'certificate',
        categoryTag: 'CERTIFICATES',
        employeeCategory: 'Certificates',
        steps: [
          { id: 'identity', label: 'Informant Identity', icon: '🪪' },
          { id: 'details', label: 'Deceased & Occurrence', icon: '📋' },
          { id: 'evidence', label: 'Evidence', icon: '📎' },
        ],
        fields: [
          // Step 1: Informant
          { name: 'regFirstName', label: 'First Name', type: 'text', required: true, step: 'identity' },
          { name: 'regFatherName', label: "Father's Name", type: 'text', required: true, step: 'identity' },
          { name: 'regGrandfatherName', label: "Grandfather's Name", type: 'text', required: true, step: 'identity' },
          { name: 'regResidentId', label: 'Residence ID Number', type: 'text', required: true, step: 'identity' },
          { name: 'regRegion', label: 'Region', type: 'text', required: true, step: 'identity' },
          { name: 'regZone', label: 'Zone', type: 'text', required: true, step: 'identity' },
          { name: 'regWoreda', label: 'Woreda', type: 'text', required: true, step: 'identity' },
          { name: 'regKebele', label: 'Kebele', type: 'text', required: true, step: 'identity' },
          { name: 'regHouseNo', label: 'House Number', type: 'text', required: false, step: 'identity' },
          { name: 'regCitizenship', label: 'Citizenship', type: 'text', required: true, step: 'identity' },
          { name: 'regEthnicity', label: 'Ethnicity', type: 'text', required: true, step: 'identity' },
          { name: 'informantRelation', label: 'Relationship to Deceased', type: 'select', required: true, options: ['Spouse', 'Child', 'Parent', 'Sibling', 'Neighbor', 'Other'], step: 'identity' },
          // Step 2: Deceased & Occurrence
          { name: 'deceasedPhoto', label: 'Photo of Deceased', type: 'photo', required: false, step: 'details', helperText: 'Upload a photo of the deceased for the certificate' },
          { name: 'deceasedFullName', label: 'Full Name of Deceased', type: 'text', required: true, step: 'details' },
          { name: 'deceasedSex', label: 'Sex', type: 'select', required: true, options: ['Male', 'Female'], step: 'details' },
          { name: 'deceasedAge', label: 'Age at Death', type: 'number', required: true, step: 'details' },
          { name: 'deceasedMaritalStatus', label: 'Marital Status', type: 'select', required: true, options: ['Single', 'Married', 'Divorced', 'Widowed'], step: 'details' },
          { name: 'dateOfDeath', label: 'Date of Death', type: 'date', required: true, step: 'details' },
          { name: 'timeOfDeath', label: 'Time of Death', type: 'text', required: false, step: 'details', placeholder: 'e.g. 14:30 (if known)' },
          { name: 'causeOfDeath', label: 'Cause of Death', type: 'select', required: true, options: ['Natural', 'Medical (Specify)', 'Accident', 'Unknown'], step: 'details' },
          { name: 'causeDetails', label: 'Cause Details (if medical)', type: 'text', required: false, step: 'details' },
          { name: 'placeOfDeath', label: 'Place of Death', type: 'text', required: true, step: 'details' },
          { name: 'burialPlace', label: 'Place of Burial / Cemetery Name', type: 'text', required: true, step: 'details' },
        ],
      },
      // ── Divorce Registration ──
      {
        id: 'divorce_certificate',
        label: 'Divorce Registration',
        description: 'Register a divorce per Proclamation No. 760/2012',
        icon: 'Scale',
        requestType: 'certificate',
        categoryTag: 'CERTIFICATES',
        employeeCategory: 'Certificates',
        steps: [
          { id: 'identity', label: 'Registrant Identity', icon: '🪪' },
          { id: 'details', label: 'Divorce Details', icon: '⚖️' },
          { id: 'evidence', label: 'Evidence', icon: '📎' },
        ],
        fields: [
          // Step 1: Registrant
          { name: 'regFirstName', label: 'First Name', type: 'text', required: true, step: 'identity' },
          { name: 'regFatherName', label: "Father's Name", type: 'text', required: true, step: 'identity' },
          { name: 'regGrandfatherName', label: "Grandfather's Name", type: 'text', required: true, step: 'identity' },
          { name: 'regResidentId', label: 'Residence ID Number', type: 'text', required: true, step: 'identity' },
          { name: 'regRegion', label: 'Region', type: 'text', required: true, step: 'identity' },
          { name: 'regZone', label: 'Zone', type: 'text', required: true, step: 'identity' },
          { name: 'regWoreda', label: 'Woreda', type: 'text', required: true, step: 'identity' },
          { name: 'regKebele', label: 'Kebele', type: 'text', required: true, step: 'identity' },
          { name: 'regHouseNo', label: 'House Number', type: 'text', required: false, step: 'identity' },
          { name: 'regCitizenship', label: 'Citizenship', type: 'text', required: true, step: 'identity' },
          { name: 'regEthnicity', label: 'Ethnicity', type: 'text', required: true, step: 'identity' },
          // Step 2: Divorce Details
          { name: 'spouse1Photo', label: 'Spouse 1 Photo', type: 'photo', required: false, step: 'details', helperText: 'Upload a photo of spouse 1 for the certificate' },
          { name: 'spouse1FullName', label: 'Spouse 1 Full Name', type: 'text', required: true, step: 'details' },
          { name: 'spouse2Photo', label: 'Spouse 2 Photo', type: 'photo', required: false, step: 'details', helperText: 'Upload a photo of spouse 2 for the certificate' },
          { name: 'spouse2FullName', label: 'Spouse 2 Full Name', type: 'text', required: true, step: 'details' },
          { name: 'divorceDecreeDate', label: 'Date of Divorce Decree', type: 'date', required: true, step: 'details' },
          { name: 'divorceReason', label: 'Reason for Divorce', type: 'select', required: true, options: ['Mutual Consent', 'Fault', 'Abandonment', 'Irreconcilable Differences', 'Other'], step: 'details' },
          { name: 'courtName', label: 'Name of the Court', type: 'select', required: true, options: ['Federal First Instance Court', 'Regional High Court', 'Woreda Court', 'Other'], step: 'details' },
          { name: 'courtOther', label: 'Court Name (if Other)', type: 'text', required: false, step: 'details' },
          { name: 'caseFileNumber', label: 'Case File Number', type: 'text', required: true, step: 'details' },
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
        categoryTag: 'PERMITS',
        employeeCategory: 'Permits',
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
        categoryTag: 'PERMITS',
        employeeCategory: 'Permits',
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
        categoryTag: 'PERMITS',
        employeeCategory: 'Permits',
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
        categoryTag: 'FEEDBACK_SUPPORT',
        employeeCategory: 'Feedback & Support',
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
  'CERTIFICATES': 'Certificates',
  'PERMITS': 'Permits',
  'FEEDBACK_SUPPORT': 'Feedback & Support',
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
