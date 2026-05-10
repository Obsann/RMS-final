/**
 * Profile Auto-Fill — maps user profile data to service form field names.
 * 
 * When a resident opens a service form, their profile data (name, phone, DOB, etc.)
 * is automatically filled into matching form fields so they don't re-type it.
 *
 * The mapping covers both flat forms (ServiceForm) and multi-step forms (StepperForm).
 */

/**
 * Map of form field names → function that extracts the value from user profile.
 * Each key is a field name used in serviceConfig.js.
 */
const FIELD_MAP = {
  // ── Identity & Registration (flat forms) ──
  fullName:       (u) => u.username || '',
  phone:          (u) => u.phone || '',
  dateOfBirth:    (u) => u.dateOfBirth ? u.dateOfBirth.slice(0, 10) : '',
  gender:         (u) => u.sex || '',
  nationality:    (u) => u.nationality || 'Ethiopian',
  address:        (u) => u.address || '',

  // ── Certificate registrant fields (multi-step) ──
  regFirstName:       (u) => getNamePart(u.username, 0),
  regFatherName:      (u) => getNamePart(u.username, 1),
  regGrandfatherName: (u) => getNamePart(u.username, 2),
  regHouseNo:         (u) => u.unit || '',
  regCitizenship:     (u) => u.nationality || 'Ethiopian',

  // ── Permit fields ──
  ownerName:      (u) => u.username || '',
  siteAddress:    (u) => u.address || '',
};

/**
 * Split username by spaces and return the Nth part, or ''.
 * E.g., "Ramadan Oumer Hambisa" → part 0 = "Ramadan", part 1 = "Oumer", part 2 = "Hambisa"
 */
function getNamePart(username, index) {
  if (!username) return '';
  const parts = username.trim().split(/\s+/);
  return parts[index] || '';
}

/**
 * Build default values for a react-hook-form, pre-filling from the user's profile
 * wherever a field name matches the FIELD_MAP.
 *
 * @param {Array} fields - The service's field definitions from serviceConfig
 * @param {Object} user  - The user profile object from getMeAPI()
 * @returns {Object}     - { fieldName: value } defaults for useForm.reset()
 */
export function buildProfileDefaults(fields, user) {
  if (!fields || !user) {
    return (fields || []).reduce((acc, f) => { acc[f.name] = ''; return acc; }, {});
  }

  return fields.reduce((acc, f) => {
    const mapper = FIELD_MAP[f.name];
    acc[f.name] = mapper ? mapper(user) : '';
    return acc;
  }, {});
}
