import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, CheckCircle, XCircle, AlertTriangle, Clock, Loader2, MapPin, Calendar, User } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function VerifyDigitalID() {
  const { idNumber } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!idNumber) return;
    setLoading(true);
    fetch(`${API_BASE}/digital-id/verify/${encodeURIComponent(idNumber)}`)
      .then(r => r.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not reach the verification server. Please try again.');
        setLoading(false);
      });
  }, [idNumber]);

  const statusConfig = {
    VALID:     { icon: CheckCircle,   bg: 'from-emerald-900 to-emerald-800', badge: 'bg-emerald-500/20 border-emerald-400 text-emerald-300', label: 'VALID — Document Authentic', color: 'text-emerald-400' },
    REVOKED:   { icon: XCircle,       bg: 'from-red-950 to-red-900',         badge: 'bg-red-500/20 border-red-400 text-red-300',             label: 'REVOKED — Document Invalid',  color: 'text-red-400' },
    EXPIRED:   { icon: AlertTriangle, bg: 'from-amber-950 to-amber-900',     badge: 'bg-amber-500/20 border-amber-400 text-amber-300',       label: 'EXPIRED — Document Expired',  color: 'text-amber-400' },
    PENDING:   { icon: Clock,         bg: 'from-blue-950 to-blue-900',       badge: 'bg-blue-500/20 border-blue-400 text-blue-300',          label: 'PENDING — Not Yet Issued',    color: 'text-blue-400' },
    NOT_FOUND: { icon: XCircle,       bg: 'from-gray-900 to-gray-800',       badge: 'bg-gray-500/20 border-gray-400 text-gray-300',          label: 'NOT FOUND — No Record',       color: 'text-gray-400' },
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

  const config = data ? (statusConfig[data.status] || statusConfig.NOT_FOUND) : statusConfig.VALID;
  const StatusIcon = config.icon;

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-900/30 border border-blue-700/40 mb-4">
            <Shield className="w-8 h-8 text-blue-400"/>
          </div>
          <h1 className="text-white text-xl font-bold">ID Verification</h1>
          <p className="text-gray-400 text-sm mt-1">Hermata Merkato Kebele · Civil Registration Office</p>
          <p className="text-gray-500 text-xs mt-1">Proclamation No. 1284/2023 · Federal Democratic Republic of Ethiopia</p>
          <Link to="/" className="inline-block mt-4 text-sm text-blue-400 hover:text-blue-300 transition-colors">
            ← Return to Homepage
          </Link>
        </div>

        {/* Card */}
        <div className={`rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-gradient-to-br ${loading ? 'from-gray-900 to-gray-800' : config.bg}`}>
          {loading ? (
            <div className="p-10 flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-blue-400 animate-spin"/>
              <p className="text-gray-300 text-sm">Verifying ID: <strong className="text-white">{idNumber}</strong></p>
            </div>
          ) : error ? (
            <div className="p-8 flex flex-col items-center gap-3 text-center">
              <XCircle className="w-12 h-12 text-red-400"/>
              <p className="text-white font-bold">Connection Error</p>
              <p className="text-gray-300 text-sm">{error}</p>
            </div>
          ) : (
            <div className="p-6 space-y-5">
              {/* Status banner */}
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${config.badge}`}>
                <StatusIcon className="w-6 h-6 shrink-0"/>
                <div>
                  <p className="font-bold text-sm">{config.label}</p>
                  <p className="text-xs opacity-75">ID: {idNumber}</p>
                </div>
              </div>

              {/* Details grid */}
              {data && data.status !== 'NOT_FOUND' && (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <User className="w-4 h-4 text-white/40 mt-0.5 shrink-0"/>
                    <div>
                      <p className="text-white/50 text-xs uppercase tracking-wider">Full Name / ሙሉ ስም</p>
                      <p className="text-white font-semibold text-sm">{data.fullName}</p>
                      {data.fullNameAmharic && (
                        <p className="text-white/70 text-sm">{data.fullNameAmharic}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-white/40 mt-0.5 shrink-0"/>
                      <div>
                        <p className="text-white/50 text-xs uppercase tracking-wider">Gender</p>
                        <p className="text-white text-sm font-medium">{data.gender || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-white/40 mt-0.5 shrink-0"/>
                      <div>
                        <p className="text-white/50 text-xs uppercase tracking-wider">Nationality</p>
                        <p className="text-white text-sm font-medium">{data.nationality || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-white/40 mt-0.5 shrink-0"/>
                      <div>
                        <p className="text-white/50 text-xs uppercase tracking-wider">Issued</p>
                        <p className="text-white text-sm font-medium">{fmt(data.issuedAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-white/40 mt-0.5 shrink-0"/>
                      <div>
                        <p className="text-white/50 text-xs uppercase tracking-wider">Expires</p>
                        <p className="text-white text-sm font-medium">{fmt(data.expiresAt)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-white/40 mt-0.5 shrink-0"/>
                    <div>
                      <p className="text-white/50 text-xs uppercase tracking-wider">Issuing Authority</p>
                      <p className="text-white text-sm font-medium">{data.issuingAuthority}</p>
                    </div>
                  </div>

                  {data.revokeReason && (
                    <div className="bg-red-500/20 border border-red-400/40 rounded-xl p-3">
                      <p className="text-red-300 text-xs font-semibold uppercase tracking-wider mb-1">Revocation Reason</p>
                      <p className="text-red-200 text-sm">{data.revokeReason}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-white/10 pt-3">
                <p className="text-white/30 text-xs text-center">
                  Verified by Civil Registration & Residency Service Agency<br/>
                  Proc. No. 1284/2023 · Proc. No. 760/2012
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Watermark */}
        <p className="text-center text-gray-600 text-xs mt-6">
          This verification is provided by the Kebele Resident Management System.<br/>
          Unauthorized use is prohibited by law.
        </p>
      </div>
    </div>
  );
}
