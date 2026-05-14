import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';
import { Download, Award, Shield, CheckCircle, Calendar, Hash, User } from 'lucide-react';
import { getFileUrl } from '../../utils/api';

// ── Field configs per document type ──────────────────────────────────────────
const FIELD_MAP = {
  'Birth Registration': [
    { label: "Child's Full Name", key: 'childFullName' },
    { label: 'Sex', key: 'childSex' },
    { label: 'Date of Birth', key: 'childDOB' },
    { label: 'Weight (kg)', key: 'childWeight' },
    { label: 'Birth Type', key: 'birthType' },
    { label: 'Place of Birth', key: 'birthPlaceType' },
    { label: 'Facility', key: 'birthFacilityName' },
    { label: "Mother's Name", key: 'motherFullName' },
    { label: "Mother's DOB", key: 'motherDOB' },
    { label: "Mother's Occupation", key: 'motherOccupation' },
    { label: "Father's Name", key: 'fatherFullName' },
    { label: "Father's DOB", key: 'fatherDOB' },
    { label: "Father's Occupation", key: 'fatherOccupation' },
  ],
  'Marriage Registration': [
    { label: "Groom's Name", key: 'groomFullName' },
    { label: "Groom's DOB", key: 'groomDOB' },
    { label: "Groom's Status", key: 'groomPreMaritalStatus' },
    { label: "Bride's Name", key: 'brideFullName' },
    { label: "Bride's DOB", key: 'brideDOB' },
    { label: "Bride's Status", key: 'bridePreMaritalStatus' },
    { label: 'Marriage Type', key: 'marriageType' },
    { label: 'Date of Marriage', key: 'marriageDate' },
    { label: 'Place', key: 'marriagePlace' },
    { label: 'Witness 1', key: 'witness1Name' },
    { label: 'Witness 2', key: 'witness2Name' },
  ],
  'Death Registration': [
    { label: 'Deceased Name', key: 'deceasedFullName' },
    { label: 'Sex', key: 'deceasedSex' },
    { label: 'Age', key: 'deceasedAge' },
    { label: 'Marital Status', key: 'deceasedMaritalStatus' },
    { label: 'Date of Death', key: 'dateOfDeath' },
    { label: 'Cause of Death', key: 'causeOfDeath' },
    { label: 'Place of Death', key: 'placeOfDeath' },
    { label: 'Burial Place', key: 'burialPlace' },
    { label: 'Informant', key: '_registrantName' },
  ],
  'Divorce Registration': [
    { label: 'Spouse 1', key: 'spouse1FullName' },
    { label: 'Spouse 2', key: 'spouse2FullName' },
    { label: 'Decree Date', key: 'divorceDecreeDate' },
    { label: 'Reason', key: 'divorceReason' },
    { label: 'Court', key: 'courtName' },
    { label: 'Case File No.', key: 'caseFileNumber' },
  ],
  'Construction Permit': [
    { label: 'Project Title', key: 'projectTitle' },
    { label: 'Type', key: 'projectType' },
    { label: 'Site Address', key: 'siteAddress' },
    { label: 'Estimated Cost (ETB)', key: 'estimatedCost' },
    { label: 'Start Date', key: 'startDate' },
    { label: 'Contractor', key: 'contractor' },
    { label: 'Description', key: 'projectDescription' },
  ],
  'Business Permit': [
    { label: 'Business Name', key: 'businessName' },
    { label: 'Type', key: 'businessType' },
    { label: 'Owner', key: 'ownerName' },
    { label: 'Address', key: 'businessAddress' },
    { label: 'TIN', key: 'tinNumber' },
    { label: 'Employees', key: 'employeeCount' },
    { label: 'Description', key: 'businessDescription' },
  ],
  'Event Permit': [
    { label: 'Event Name', key: 'eventName' },
    { label: 'Type', key: 'eventType' },
    { label: 'Date', key: 'eventDate' },
    { label: 'Location', key: 'eventLocation' },
    { label: 'Attendees', key: 'expectedAttendees' },
    { label: 'Description', key: 'eventDescription' },
  ],
};

function getFields(serviceType) {
  for (const [k, v] of Object.entries(FIELD_MAP)) {
    if (serviceType?.includes(k.split(' ')[0])) return v;
  }
  return FIELD_MAP[serviceType] || [];
}

function fmt(val) {
  if (!val) return '—';
  if (/^\d{4}-\d{2}-\d{2}/.test(String(val)))
    return new Date(val).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  return String(val);
}

function registrantName(s) {
  if (s?.regFirstName) return [s.regFirstName, s.regFatherName, s.regGrandfatherName].filter(Boolean).join(' ');
  return null;
}

const CERT_TYPES = ['Birth', 'Marriage', 'Death', 'Divorce'];

// ── Signature watermark style ────────────────────────────────────────────────
const sigStyle = {
  fontFamily: "'Brush Script MT', 'Segoe Script', 'Comic Sans MS', cursive",
  fontSize: '32px',
  color: '#1a3a5c',
  opacity: 0.7,
  transform: 'rotate(-4deg)',
  display: 'inline-block',
};

// ── Photo Component (shows actual image or placeholder) ──────────────────────
const CertPhoto = ({ src, label }) => {
  const imgSrc = getFileUrl(src);
  return (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
    <div style={{
      width: '110px', height: '140px', border: imgSrc ? '2px solid #0d6e3e' : '2px dashed #aaa', borderRadius: '4px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9f9f9',
      overflow: 'hidden',
    }}>
      {imgSrc ? (
        <img src={imgSrc} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
      ) : (
        <User size={36} color="#ccc" />
      )}
    </div>
    <span style={{ fontSize: '10px', color: '#555', fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>
  </div>
)};

// ── Ethiopian Flag Component ─────────────────────────────────────────────────
const EthiopianFlag = () => (
  <div style={{
    width: '90px', height: '45px', display: 'flex', flexDirection: 'column',
    border: '1px solid #ccc', margin: '0 auto 12px', borderRadius: '2px', overflow: 'hidden'
  }}>
    <div style={{ flex: 1, backgroundColor: '#078930' }} />
    <div style={{ flex: 1, backgroundColor: '#FCDD09', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#0F47AF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
         <span style={{ color: '#FCDD09', fontSize: '12px', lineHeight: 1 }}>★</span>
      </div>
    </div>
    <div style={{ flex: 1, backgroundColor: '#DA121A' }} />
  </div>
);

// ── Document Card ────────────────────────────────────────────────────────────
function DocumentCard({ issuedDocument }) {
  const { documentNumber, documentType, issuedAt, expiresAt, signatoryName, signatoryTitle, registrationNumber, formSnapshot } = issuedDocument;
  const snap = { ...formSnapshot };
  const rn = registrantName(snap);
  if (rn) snap._registrantName = rn;
  const fields = getFields(documentType);
  const isCert = CERT_TYPES.some(t => documentType?.includes(t));
  const accent = isCert ? '#0d6e3e' : '#1a3a5c';

  return (
    <div id="issued-document-card" style={{
      width: '780px', minHeight: '1050px', background: '#fff',
      border: `3px solid ${accent}`, position: 'relative', fontFamily: "'Georgia', 'Times New Roman', serif",
      overflow: 'hidden',
    }}>
      {/* Top decorative bar */}
      <div style={{ height: '6px', background: `linear-gradient(90deg, ${accent}, #d4a843, ${accent})` }} />

      {/* Inner border */}
      <div style={{ margin: '14px', border: `1.5px solid ${accent}33`, minHeight: '1000px', padding: '36px 40px 30px', position: 'relative' }}>

        {/* Kebele watermark */}
        <div style={{
          position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%,-50%) rotate(-28deg)',
          fontSize: '72px', fontWeight: 900, color: 'rgba(0,0,0,0.025)', whiteSpace: 'nowrap',
          letterSpacing: '8px', pointerEvents: 'none', userSelect: 'none',
        }}>HERMATA MERKATO</div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <EthiopianFlag />
          <p style={{ fontSize: '10px', color: '#888', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '4px' }}>
            Federal Democratic Republic of Ethiopia
          </p>
          <p style={{ fontSize: '9px', color: '#aaa', letterSpacing: '2px', textTransform: 'uppercase' }}>
            Hermata Merkato Kebele Administration
          </p>
          <div style={{ width: '80px', height: '2px', background: '#d4a843', margin: '12px auto' }} />
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: accent, letterSpacing: '3px', textTransform: 'uppercase', margin: 0 }}>
            {documentType || 'Official Document'}
          </h1>
          <div style={{ width: '80px', height: '2px', background: '#d4a843', margin: '12px auto' }} />
        </div>

        {/* Photos for Certificates */}
        {isCert && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '24px' }}>
            {documentType?.includes('Birth') && <CertPhoto src={snap.childPhoto} label="Child Photo" />}
            {documentType?.includes('Death') && <CertPhoto src={snap.deceasedPhoto} label="Deceased Photo" />}
            {documentType?.includes('Marriage') && (
              <>
                <CertPhoto src={snap.groomPhoto} label="Groom Photo" />
                <CertPhoto src={snap.bridePhoto} label="Bride Photo" />
              </>
            )}
            {documentType?.includes('Divorce') && (
              <>
                <CertPhoto src={snap.spouse1Photo} label="Spouse 1 Photo" />
                <CertPhoto src={snap.spouse2Photo} label="Spouse 2 Photo" />
              </>
            )}
          </div>
        )}

        {/* Doc / Reg numbers */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#666', marginBottom: '20px', padding: '8px 14px', background: '#f8f9fa', borderRadius: '6px', border: '1px solid #eee' }}>
          <span>Document No: <b style={{ color: '#333' }}>{documentNumber}</b></span>
          {registrationNumber && <span>Registration No: <b style={{ color: '#333' }}>{registrationNumber}</b></span>}
          {expiresAt && <span>Expires: <b style={{ color: '#c0392b' }}>{new Date(expiresAt).toLocaleDateString()}</b></span>}
        </div>

        {/* Data table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', marginBottom: '24px' }}>
          <tbody>
            {fields.map((f, i) => {
              const val = snap[f.key];
              if (!val && f.key !== '_registrantName') return null;
              return (
                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '9px 14px', fontWeight: 600, color: '#555', width: '38%', background: i % 2 === 0 ? '#fafbfc' : '#fff' }}>
                    {f.label}
                  </td>
                  <td style={{ padding: '9px 14px', color: '#111', fontWeight: 500, background: i % 2 === 0 ? '#fafbfc' : '#fff' }}>
                    {fmt(val)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Validity banner for permits */}
        {expiresAt && (
          <div style={{ padding: '12px 16px', borderRadius: '8px', background: '#e8f5e9', border: '1px solid #a5d6a7', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', fontSize: '12px' }}>
            <span style={{ color: '#2e7d32', fontWeight: 700 }}>✓ PERMIT APPROVED & LEGALIZED</span>
            <span style={{ color: '#388e3c' }}>
              Valid: {issuedAt ? new Date(issuedAt).toLocaleDateString() : '—'} → {new Date(expiresAt).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* Footer: Date + Dual Signatures */}
        <div style={{ marginTop: '40px' }}>
          {/* Date row */}
          <div style={{ textAlign: 'center', fontSize: '11px', color: '#555', marginBottom: '30px' }}>
            <p style={{ margin: '0 0 4px' }}>Date of Issuance:</p>
            <p style={{ fontWeight: 700, color: '#111', margin: 0, fontSize: '13px' }}>
              {issuedAt ? new Date(issuedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
            </p>
            <p style={{ fontSize: '9px', color: '#999', marginTop: '4px' }}>Jimma, Oromia Region, Ethiopia</p>
          </div>

          {/* Two signature blocks side by side */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            {/* LEFT: Issuing Employee */}
            <div style={{ textAlign: 'center', width: '45%' }}>
              <div style={{ minHeight: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={sigStyle}>{signatoryName}</span>
              </div>
              <div style={{ borderTop: '2px solid #333', paddingTop: '6px' }}>
                <p style={{ fontSize: '9px', color: '#666', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '1px' }}>Issued By</p>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#111', margin: 0 }}>{signatoryName}</p>
                <p style={{ fontSize: '9px', color: '#666', margin: '2px 0 0' }}>{signatoryTitle}</p>
              </div>
              {/* Employee stamp */}
              <div style={{
                marginTop: '10px', width: '70px', height: '70px', borderRadius: '50%',
                border: '3px double #1a3a5c55', margin: '10px auto 0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', transform: 'rotate(-5deg)',
              }}>
                <span style={{ fontSize: '6px', color: '#1a3a5c88', fontWeight: 700, textTransform: 'uppercase' }}>Official</span>
                <span style={{ fontSize: '7px', color: '#1a3a5c88', fontWeight: 900 }}>STAMP</span>
                <span style={{ fontSize: '5px', color: '#1a3a5c55' }}>HMK</span>
              </div>
            </div>

            {/* RIGHT: Kebele Manager */}
            <div style={{ textAlign: 'center', width: '45%' }}>
              <div style={{ minHeight: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{...sigStyle, color: '#0d6e3e'}}>Obsan Habtamu</span>
              </div>
              <div style={{ borderTop: '2px solid #333', paddingTop: '6px' }}>
                <p style={{ fontSize: '9px', color: '#666', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '1px' }}>Approved By</p>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#111', margin: 0 }}>Obsan Habtamu</p>
                <p style={{ fontSize: '9px', color: '#666', margin: '2px 0 0' }}>Kebele Manager — Hermata Merkato</p>
              </div>
              {/* Manager stamp */}
              <div style={{
                marginTop: '10px', width: '70px', height: '70px', borderRadius: '50%',
                border: '3px double #0d6e3e55', margin: '10px auto 0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', transform: 'rotate(5deg)',
              }}>
                <span style={{ fontSize: '5px', color: '#0d6e3e88', fontWeight: 700, textTransform: 'uppercase' }}>Kebele Manager</span>
                <span style={{ fontSize: '7px', color: '#0d6e3e88', fontWeight: 900 }}>SEAL</span>
                <span style={{ fontSize: '5px', color: '#0d6e3e55' }}>HMK</span>
              </div>
            </div>
          </div>
        </div>

        {/* LEGALIZED stamp */}
        <div style={{
          position: 'absolute', bottom: '100px', right: '60px', transform: 'rotate(-18deg)',
          border: `4px double ${accent}55`, borderRadius: '10px', padding: '6px 22px',
          color: `${accent}55`, fontSize: '22px', fontWeight: 900, letterSpacing: '5px',
          textTransform: 'uppercase', pointerEvents: 'none',
        }}>LEGALIZED</div>
      </div>

      {/* Bottom bar */}
      <div style={{ height: '6px', background: `linear-gradient(90deg, ${accent}, #d4a843, ${accent})` }} />
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function IssuedDocument({ issuedDocument, compact = false }) {
  const [downloading, setDownloading] = useState(false);
  if (!issuedDocument?.documentNumber) return null;

  const isCert = CERT_TYPES.some(t => issuedDocument.documentType?.includes(t));

  const handleDownload = async () => {
    const el = document.getElementById('issued-document-card');
    if (!el) { toast.error('Document not found'); return; }
    setDownloading(true);
    try {
      const dataUrl = await toPng(el, { cacheBust: true, pixelRatio: 3 });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${issuedDocument.documentNumber.replace(/\//g, '-')}.png`;
      a.click();
      toast.success('Downloaded!');
    } catch { toast.error('Export failed'); }
    finally { setDownloading(false); }
  };

  if (compact) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
        <div className={`p-4 ${isCert ? 'bg-gradient-to-r from-emerald-600 to-teal-500' : 'bg-gradient-to-r from-blue-700 to-indigo-600'} text-white`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              {isCert ? <Award className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{issuedDocument.documentType}</p>
              <p className="text-xs opacity-80 font-mono">{issuedDocument.documentNumber}</p>
            </div>
            <CheckCircle className="w-5 h-5 text-green-200" />
          </div>
        </div>
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="w-3.5 h-3.5" />
            Issued: {issuedDocument.issuedAt ? new Date(issuedDocument.issuedAt).toLocaleDateString() : '—'}
          </div>
          {issuedDocument.expiresAt && (
            <div className="flex items-center gap-2 text-xs text-amber-600">
              <Calendar className="w-3.5 h-3.5" />
              Expires: {new Date(issuedDocument.expiresAt).toLocaleDateString()}
            </div>
          )}
          {issuedDocument.registrationNumber && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Hash className="w-3.5 h-3.5" />{issuedDocument.registrationNumber}
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-green-600 font-semibold">
            <CheckCircle className="w-3.5 h-3.5" />Legalized
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={`flex items-center gap-3 p-4 rounded-xl border ${isCert ? 'bg-emerald-50 border-emerald-200' : 'bg-blue-50 border-blue-200'}`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCert ? 'bg-emerald-100' : 'bg-blue-100'}`}>
          {isCert ? <Award className="w-5 h-5 text-emerald-600" /> : <Shield className="w-5 h-5 text-blue-600" />}
        </div>
        <div className="flex-1">
          <p className={`text-sm font-bold ${isCert ? 'text-emerald-900' : 'text-blue-900'}`}>
            📜 Your {isCert ? 'Certificate' : 'Permit'} is Ready!
          </p>
          <p className={`text-xs ${isCert ? 'text-emerald-700' : 'text-blue-700'}`}>
            {issuedDocument.documentType} — {issuedDocument.documentNumber}
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">
          <CheckCircle className="w-3.5 h-3.5" />Legalized
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-300 shadow-lg">
        <div style={{ minWidth: '780px' }}>
          <DocumentCard issuedDocument={issuedDocument} />
        </div>
      </div>

      <div className="flex justify-center">
        <button onClick={handleDownload} disabled={downloading}
          className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50">
          <Download className="w-5 h-5" />
          {downloading ? 'Exporting...' : `Download ${isCert ? 'Certificate' : 'Permit'}`}
        </button>
      </div>
    </div>
  );
}
