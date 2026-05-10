import React, { createContext, useContext, useState, useCallback } from 'react';

// ── Shared initial request list ──────────────────────────────────────────────
// status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'rejected'
// assignedEmployee → set by Admin when assigning (Employee name)
// dueDate          → set when assigning
// idNumber         → set when completed

const initialRequests = [
  {
    id: 1, resident: 'Samson Tadesse',      unit: 'A-101', email: 'samson.tadesse@email.com',
    requestDate: '2026-02-27', status: 'pending',
    note: 'First-time ID request (new resident)',
    assignedEmployee: '', dueDate: '', idNumber: '',
  },
  {
    id: 2, resident: 'Olyad Amanuel',    unit: 'B-205', email: 'olyad.amanuel@email.com',
    requestDate: '2026-02-25', status: 'approved',
    note: 'Renewal request',
    assignedEmployee: '', dueDate: '', idNumber: '',
  },
  {
    id: 3, resident: 'Mulugeta Haile',   unit: 'C-312', email: 'mulugeta.haile@email.com',
    requestDate: '2026-02-24', status: 'pending',
    note: 'Lost ID replacement',
    assignedEmployee: '', dueDate: '', idNumber: '',
  },
  {
    id: 4, resident: 'Fasil Girma',      unit: 'C-105', email: 'fasil.g@email.com',
    requestDate: '2026-02-23', status: 'in_progress',
    note: 'New resident onboarding',
    assignedEmployee: 'Samson Tadesse', dueDate: '2026-03-03', idNumber: '',
  },
  {
    id: 5, resident: 'Ramadan Oumer',    unit: 'B-108', email: 'ramadan.oumer@email.com',
    requestDate: '2026-02-22', status: 'completed',
    note: 'ID issued successfully',
    assignedEmployee: 'Samson Tadesse', dueDate: '2026-02-27', idNumber: 'RES-2026-0108',
  },
  {
    id: 6, resident: 'Hana Bekele',      unit: 'D-201', email: 'hana.bekele@email.com',
    requestDate: '2026-02-21', status: 'rejected',
    note: 'Missing documents',
    assignedEmployee: '', dueDate: '', idNumber: '',
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Maps the shared status to the simplified view a resident sees.
 * 'pending'     → { view: 'pending' }
 * 'approved'    → { view: 'approved' }
 * 'in_progress' → { view: 'in-progress' }
 * 'completed'   → { view: 'ready' }
 * 'rejected'    → { view: 'rejected' }
 * no record     → { view: 'none' }
 */
export function deriveResidentView(request) {
  if (!request) return { view: 'none' };
  switch (request.status) {
    case 'pending':     return { view: 'pending' };
    case 'approved':    return { view: 'approved' };
    case 'in_progress': return { view: 'in-progress' };
    case 'completed':   return { view: 'ready' };
    case 'rejected':    return { view: 'rejected' };
    default:            return { view: 'none' };
  }
}

// ── Context ──────────────────────────────────────────────────────────────────

export const DigitalIDContext = createContext({});

export function DigitalIDProvider({ children }) {
  const [requests, setRequests] = useState(initialRequests);

  /** Update fields on an existing request */
  const updateRequest = useCallback((id, updates) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  }, []);

  /** Add a brand-new request from the Resident's submission */
  const addRequest = useCallback((data) => {
    const newReq = {
      id: Date.now(),
      resident: data.resident,
      unit: data.unit,
      email: data.email,
      requestDate: '2026-03-01',
      status: 'pending',
      note: data.note || '',
      assignedEmployee: '',
      dueDate: '',
      idNumber: '',
    };
    setRequests((prev) => [newReq, ...prev]);
    return newReq;
  }, []);

  /** Get the request for a specific resident unit */
  const getRequestByUnit = useCallback(
    (unit) => requests.find((r) => r.unit === unit) ?? null,
    [requests]
  );

  /** Derived resident view (what the resident sees on their ID page) */
  const getResidentView = useCallback(
    (unit) => {
      const req = getRequestByUnit(unit);
      return { ...deriveResidentView(req), request: req };
    },
    [getRequestByUnit]
  );

  return (
    <DigitalIDContext.Provider value={{ requests, updateRequest, addRequest, getRequestByUnit, getResidentView }}>
      {children}
    </DigitalIDContext.Provider>
  );
}

export function useDigitalID() {
  return useContext(DigitalIDContext);
}
