const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Check if Cloudinary credentials are configured
const hasCloudinary = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

/**
 * Cloudinary folder structure:
 *
 * rms/
 * ├── profile-photos/          ← Resident & employee profile pictures
 * ├── identity-registration/   ← ID applications, renewals
 * ├── certificates/            ← Birth, marriage, death, divorce registrations
 * ├── permits/                 ← Construction, business, event permits
 * ├── feedback-support/        ← Complaint evidence / attachments
 * └── general/                 ← Uncategorized uploads
 */
const CATEGORY_FOLDERS = {
  'ID_REGISTRATION':  'rms/identity-registration',
  'CERTIFICATES':     'rms/certificates',
  'PERMITS':          'rms/permits',
  'FEEDBACK_SUPPORT': 'rms/feedback-support',
};

/**
 * Resolve the folder based on request context.
 */
function resolveFolder(req, file) {
  // 1. Check for explicit category tag from the upload request
  const categoryTag = req.headers['x-category-tag'] || req.body?.categoryTag;
  if (categoryTag && CATEGORY_FOLDERS[categoryTag]) {
    return CATEGORY_FOLDERS[categoryTag];
  }

  // 2. Profile photo uploads
  if (req.headers['x-upload-type'] === 'profile-photo' || file.fieldname === 'profilePhoto') {
    return 'rms/profile-photos';
  }

  // 3. Detect from MIME type as last resort
  if (file.mimetype.startsWith('image/')) {
    return 'rms/general/images';
  }

  return 'rms/general/documents';
}

let generalStorage;

if (hasCloudinary) {
  // ── Cloudinary storage (production) ──
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  generalStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
      const folder = resolveFolder(req, file);
      return {
        folder,
        resource_type: 'auto', // Required for non-image files like PDF
        public_id: `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
      };
    }
  });

  console.log('☁️  Using Cloudinary storage with organized folders');
} else {
  // ── Local disk storage (development fallback) ──
  const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  generalStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      // In local dev, we don't bother creating subfolders since it's just for testing
      cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = crypto.randomBytes(8).toString('hex');
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${uniqueSuffix}${ext}`);
    },
  });

  console.log('📁 Using local disk storage (no Cloudinary credentials found)');
}

module.exports = {
  cloudinary,
  generalStorage,
  hasCloudinary,
  CATEGORY_FOLDERS,
};
