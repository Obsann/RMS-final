import React, { useState } from 'react';
import { Shield, CheckCircle, AlertTriangle, XCircle, Fingerprint, MapPin, Phone, Calendar, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { EthDateTime } from 'ethiopian-calendar-date-converter';
import { getFileUrl } from '../../utils/api';

// Ethiopian month names (Ge'ez)
const ETH_MONTHS = [
  '', 'መስከረም', 'ጥቅምት', 'ኅዳር', 'ታኅሣሥ', 'ጥር', 'የካቲት',
  'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜ'
];

function toEthiopianDate(gregorianDate) {
  try {
    if (!gregorianDate) return null;
    const d = new Date(gregorianDate);
    if (isNaN(d.getTime())) return null;
    const eth = EthDateTime.fromEuropeanDate(d);
    return `${eth.date} ${ETH_MONTHS[eth.month]} ${eth.year} ዓ.ም`;
  } catch {
    return null;
  }
}

/**
 * DigitalIDCard — Ethiopian Legal Standard (Proclamation No. 1284/2023)
 * Front: ID data with photo. Back: address, emergency contact, dates, QR code.
 * IDs for capture: #digital-id-card (front), #digital-id-card-back (back)
 */
export default function DigitalIDCard({ digitalId, resident, currentStatus }) {
  const [showBack, setShowBack] = useState(false);

  if (!digitalId || !resident) return null;

  const status = currentStatus || digitalId.status;

  // ── Names ──────────────────────────────────────────────────────────────
  const fullNameEn = [digitalId.firstName, digitalId.fatherName, digitalId.grandfatherName]
    .filter(Boolean).join(' ') || resident.username || 'Unknown';
  const fullNameAm = [digitalId.firstNameAmharic, digitalId.fatherNameAmharic, digitalId.grandfatherNameAmharic]
    .filter(Boolean).join(' ') || '';

  // ── Ethiopian date conversion ──────────────────────────────────────────
  const dobGregorian = digitalId.dateOfBirth
    ? new Date(digitalId.dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';
  const dobEthiopian = toEthiopianDate(digitalId.dateOfBirth);
  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const fmtEth = (d) => toEthiopianDate(d);

  // ── Status badge ───────────────────────────────────────────────────────
  const statusConfig = {
    issued:   { icon: CheckCircle,   bgColor:'rgba(16,185,129,0.2)', borderColor:'rgba(52,211,153,0.5)', textColor:'#6ee7b7', label:'VALID'    },
    approved: { icon: CheckCircle,   bgColor:'rgba(59,130,246,0.2)', borderColor:'rgba(96,165,250,0.5)', textColor:'#93c5fd', label:'APPROVED' },
    revoked:  { icon: XCircle,       bgColor:'rgba(239,68,68,0.2)',  borderColor:'rgba(252,165,165,0.5)',textColor:'#fca5a5', label:'REVOKED'  },
    expired:  { icon: AlertTriangle, bgColor:'rgba(245,158,11,0.2)', borderColor:'rgba(253,211,77,0.5)', textColor:'#fde68a', label:'EXPIRED'  },
  };
  const badge = statusConfig[status] || statusConfig.issued;
  const BadgeIcon = badge.icon;

  // ── Photo ──────────────────────────────────────────────────────────────
  const photoSrc = digitalId.passportPhoto
    ? getFileUrl(digitalId.passportPhoto)
    : resident.profilePhoto ? getFileUrl(resident.profilePhoto) : null;

  const qrValue = digitalId.qrCode || `HMK-${digitalId.idNumber}`;

  const cardBase = {
    background: 'linear-gradient(135deg, #0f2460 0%, #1a3a8f 40%, #0d1f4f 100%)',
    borderRadius: '16px',
    overflow: 'hidden',
    position: 'relative',
    boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
    width: '100%',
  };

  return (
    <div style={{ maxWidth: '440px', margin: '0 auto', userSelect: 'none' }}>
      {/* Flip toggle */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'12px', marginBottom:'12px' }}>
        {[
          { id:'front', label:'◀ Front', active: !showBack },
          { id:'back',  label:'Back ▶',  active: showBack  },
        ].map(btn => (
          <button
            key={btn.id}
            onClick={() => setShowBack(btn.id === 'back')}
            style={{
              display:'flex', alignItems:'center', gap:'6px',
              padding:'6px 16px', borderRadius:'999px', fontSize:'12px', fontWeight:'700',
              cursor:'pointer', transition:'all 0.2s',
              background: btn.active ? '#1d4ed8' : 'rgba(255,255,255,0.1)',
              color: btn.active ? '#ffffff' : '#93c5fd',
              border: btn.active ? 'none' : '1px solid rgba(29,78,216,0.4)',
              boxShadow: btn.active ? '0 4px 12px rgba(29,78,216,0.4)' : 'none',
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* ── FRONT ── */}
      <div
        id="digital-id-card"
        style={{ ...cardBase, display: showBack ? 'none' : 'block' }}
      >
        <div style={{ position:'absolute', top:0, left:0, right:0, height:'4px', background:'linear-gradient(90deg,#f59e0b,#fde68a,#f59e0b)' }}/>
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.04 }} viewBox="0 0 440 270" preserveAspectRatio="xMidYMid slice">
          <pattern id="gp" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="white" strokeWidth="0.5"/>
          </pattern>
          <rect width="440" height="270" fill="url(#gp)"/>
          <circle cx="390" cy="30" r="90" fill="none" stroke="white" strokeWidth="0.5"/>
        </svg>

        <div style={{ padding:'20px', position:'relative' }}>
          {/* Header */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'14px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'rgba(245,158,11,0.15)', border:'1px solid rgba(245,158,11,0.35)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Shield size={20} color="#fbbf24"/>
              </div>
              <div>
                <p style={{ color:'#fde68a', fontWeight:'700', fontSize:'9px', letterSpacing:'0.08em', textTransform:'uppercase', lineHeight:1.2 }}>Federal Democratic Republic of Ethiopia</p>
                <p style={{ color:'#93c5fd', fontSize:'8px', letterSpacing:'0.05em' }}>Hermata Merkato Kebele · Jimma City</p>
                <p style={{ color:'#a5b4fc', fontSize:'8px' }}>የሄርማታ መርካቶ ቀበሌ ነዋሪ መታወቂያ</p>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'4px', padding:'3px 8px', borderRadius:'999px', border:'1px solid', fontSize:'8px', fontWeight:'700', background:badge.bgColor, borderColor:badge.borderColor, color:badge.textColor }}>
              <BadgeIcon size={10}/><span>{badge.label}</span>
            </div>
          </div>

          {/* Photo + Info */}
          <div style={{ display:'flex', gap:'14px' }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'6px', flexShrink:0 }}>
              <div style={{ width:'80px', height:'96px', background:'rgba(255,255,255,0.1)', border:'2px solid rgba(255,255,255,0.3)', borderRadius:'10px', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {photoSrc
                  ? <img src={photoSrc} alt="ID Photo" crossOrigin="anonymous" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                  : <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}><User size={28} color="rgba(255,255,255,0.4)"/><span style={{ color:'rgba(255,255,255,0.4)', fontSize:'7px' }}>No Photo</span></div>
                }
              </div>
              {digitalId.bloodType && (
                <div style={{ background:'rgba(239,68,68,0.3)', border:'1px solid rgba(252,165,165,0.4)', borderRadius:'6px', padding:'2px 8px', color:'#fca5a5', fontSize:'9px', fontWeight:'700' }}>{digitalId.bloodType}</div>
              )}
            </div>

            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'8px' }}>
              <div>
                <p style={{ color:'#93c5fd', fontSize:'7px', textTransform:'uppercase', letterSpacing:'0.08em' }}>Full Name / ሙሉ ስም</p>
                <p style={{ color:'#ffffff', fontWeight:'700', fontSize:'13px', lineHeight:1.2 }}>{fullNameEn}</p>
                {fullNameAm && <p style={{ color:'#bfdbfe', fontSize:'10px', fontWeight:'500' }}>{fullNameAm}</p>}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 12px' }}>
                <div>
                  <p style={{ color:'#93c5fd', fontSize:'7px', textTransform:'uppercase' }}>ID Number</p>
                  <p style={{ color:'#fde68a', fontWeight:'700', fontSize:'10px', letterSpacing:'0.06em' }}>{digitalId.idNumber || '—'}</p>
                </div>
                <div>
                  <p style={{ color:'#93c5fd', fontSize:'7px', textTransform:'uppercase' }}>Nationality / ዜግነት</p>
                  <p style={{ color:'#ffffff', fontSize:'10px', fontWeight:'500' }}>{digitalId.nationality || 'Ethiopian'}</p>
                </div>
                <div>
                  <p style={{ color:'#93c5fd', fontSize:'7px', textTransform:'uppercase' }}>Date of Birth / ልደት</p>
                  <p style={{ color:'#ffffff', fontSize:'9px', fontWeight:'500' }}>{dobGregorian}</p>
                  {dobEthiopian && <p style={{ color:'#a5b4fc', fontSize:'8px' }}>{dobEthiopian}</p>}
                </div>
                <div>
                  <p style={{ color:'#93c5fd', fontSize:'7px', textTransform:'uppercase' }}>Gender / ጾታ</p>
                  <p style={{ color:'#ffffff', fontSize:'10px', fontWeight:'500' }}>{digitalId.gender || '—'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop:'12px', paddingTop:'8px', borderTop:'1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'4px', color:'rgba(147,197,253,0.7)', fontSize:'7px' }}>
              <Fingerprint size={11}/><span>Civil Registration &amp; Residency Service Agency</span>
            </div>
            <p style={{ color:'rgba(147,197,253,0.7)', fontSize:'7px' }}>Proc. No. 1284/2023</p>
          </div>
        </div>
      </div>

      {/* ── BACK ── */}
      <div
        id="digital-id-card-back"
        style={{ ...cardBase, display: showBack ? 'block' : 'none' }}
      >
        <div style={{ position:'absolute', top:0, left:0, right:0, height:'4px', background:'linear-gradient(90deg,#f59e0b,#fde68a,#f59e0b)' }}/>
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.04 }} viewBox="0 0 440 270" preserveAspectRatio="xMidYMid slice">
          <pattern id="gp2" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="white" strokeWidth="0.5"/>
          </pattern>
          <rect width="440" height="270" fill="url(#gp2)"/>
        </svg>

        <div style={{ padding:'20px', position:'relative' }}>
          {/* Header */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid rgba(255,255,255,0.1)', paddingBottom:'8px', marginBottom:'12px' }}>
            <div>
              <p style={{ color:'#fde68a', fontSize:'9px', fontWeight:'700', letterSpacing:'0.08em', textTransform:'uppercase' }}>Resident Identification Card — Back</p>
              <p style={{ color:'#93c5fd', fontSize:'8px' }}>ነዋሪ መታወቂያ ካርድ — ኋላ</p>
            </div>
            <p style={{ color:'#fde68a', fontWeight:'700', fontSize:'10px' }}>{digitalId.idNumber || '—'}</p>
          </div>

          <div style={{ display:'flex', gap:'14px' }}>
            {/* Info blocks */}
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'10px' }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:'6px' }}>
                <MapPin size={13} color="#fbbf24" style={{ marginTop:'1px', flexShrink:0 }}/>
                <div>
                  <p style={{ color:'#93c5fd', fontSize:'7px', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'2px' }}>Residential Address / አድራሻ</p>
                  <p style={{ color:'#ffffff', fontSize:'10px', fontWeight:'600' }}>Hermata Merkato Kebele, Jimma City</p>
                  <p style={{ color:'#bfdbfe', fontSize:'8px' }}>Jimma Zone · Oromia · Ethiopia</p>
                  {digitalId.houseNumber && <p style={{ color:'#bfdbfe', fontSize:'8px' }}>House No: <span style={{ color:'#ffffff', fontWeight:'700' }}>{digitalId.houseNumber}</span></p>}
                </div>
              </div>

              {(digitalId.emergencyContact?.name || digitalId.emergencyContact?.phone) && (
                <div style={{ display:'flex', alignItems:'flex-start', gap:'6px' }}>
                  <Phone size={13} color="#fbbf24" style={{ marginTop:'1px', flexShrink:0 }}/>
                  <div>
                    <p style={{ color:'#93c5fd', fontSize:'7px', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'2px' }}>Emergency Contact / አደጋ ጊዜ ተጠሪ</p>
                    <p style={{ color:'#ffffff', fontSize:'10px', fontWeight:'600' }}>{digitalId.emergencyContact.name || '—'}</p>
                    <p style={{ color:'#bfdbfe', fontSize:'8px' }}>{digitalId.emergencyContact.phone || '—'}</p>
                  </div>
                </div>
              )}

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:'5px' }}>
                  <Calendar size={11} color="#fbbf24" style={{ marginTop:'1px', flexShrink:0 }}/>
                  <div>
                    <p style={{ color:'#93c5fd', fontSize:'7px', textTransform:'uppercase' }}>Date of Issue</p>
                    <p style={{ color:'#ffffff', fontSize:'9px', fontWeight:'600' }}>{fmt(digitalId.issuedAt)}</p>
                    {fmtEth(digitalId.issuedAt) && <p style={{ color:'#a5b4fc', fontSize:'7px' }}>{fmtEth(digitalId.issuedAt)}</p>}
                    <p style={{ color:'#93c5fd', fontSize:'7px' }}>Jimma City</p>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'flex-start', gap:'5px' }}>
                  <Calendar size={11} color="#f59e0b" style={{ marginTop:'1px', flexShrink:0 }}/>
                  <div>
                    <p style={{ color:'#93c5fd', fontSize:'7px', textTransform:'uppercase' }}>Expiry Date</p>
                    <p style={{ color:'#fcd34d', fontSize:'9px', fontWeight:'600' }}>{fmt(digitalId.expiresAt)}</p>
                    {fmtEth(digitalId.expiresAt) && <p style={{ color:'#a5b4fc', fontSize:'7px' }}>{fmtEth(digitalId.expiresAt)}</p>}
                    <p style={{ color:'#93c5fd', fontSize:'7px' }}>Valid 10 Years</p>
                  </div>
                </div>
              </div>

              <div style={{ marginTop:'4px', paddingTop:'8px', borderTop:'1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ width:'80px', height:'1px', background:'rgba(255,255,255,0.4)', marginBottom:'3px' }}/>
                <p style={{ color:'#93c5fd', fontSize:'7px' }}>Authorized Registrar</p>
                <p style={{ color:'#bfdbfe', fontSize:'7px' }}>Hermata Merkato Kebele Office</p>
              </div>
            </div>

            {/* QR code — back only */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'6px', flexShrink:0 }}>
              <div style={{ background:'#ffffff', borderRadius:'10px', padding:'6px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <QRCodeCanvas value={qrValue} size={100} bgColor="#ffffff" fgColor="#0f2460" level="Q"/>
              </div>
              <p style={{ color:'#93c5fd', fontSize:'7px', textAlign:'center', lineHeight:1.3 }}>Scan to verify<br/>ለማረጋገጥ ቅኡ</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notice */}
      <div style={{ marginTop:'8px', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', color:'rgba(156,163,175,0.8)', fontSize:'11px' }}>
        <Shield size={13} color="#60a5fa"/>
        <span>Property of Kebele Administration · Proc. No. 1284/2023</span>
      </div>
    </div>
  );
}
