import React, { useState, useEffect } from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import { gcToEc, ecToGc, EC_MONTHS, getEcDaysInMonth } from '../../utils/ethiopianCalendar';

export default function DualCalendarField({ id, value, onChange, required }) {
  const [isEc, setIsEc] = useState(true);
  
  const [ecYear, setEcYear] = useState('');
  const [ecMonth, setEcMonth] = useState('');
  const [ecDay, setEcDay] = useState('');

  // Sync external value to local EC state
  useEffect(() => {
    if (value) {
      const converted = gcToEc(value);
      if (converted) {
        setEcYear(converted.year);
        setEcMonth(converted.month);
        setEcDay(converted.day);
      }
    } else {
      setEcYear('');
      setEcMonth('');
      setEcDay('');
    }
  }, [value]);

  const handleEcChange = (y, m, d) => {
    setEcYear(y);
    setEcMonth(m);
    setEcDay(d);
    
    if (y && m && d) {
      const maxDays = getEcDaysInMonth(Number(y), Number(m));
      const validDay = Math.min(Number(d), maxDays);
      if (validDay !== Number(d)) {
        setEcDay(validDay);
        onChange(ecToGc(Number(y), Number(m), validDay));
      } else {
        onChange(ecToGc(Number(y), Number(m), Number(d)));
      }
    } else {
      onChange('');
    }
  };

  const handleGcChange = (e) => {
    onChange(e.target.value);
  };

  const currentEcYear = gcToEc(new Date().toISOString())?.year || 2016;
  const years = Array.from({ length: 105 }, (_, i) => currentEcYear + 5 - i);
  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-medium text-gray-500">
            {isEc ? 'Ethiopian Calendar (EC)' : 'Gregorian Calendar (GC)'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsEc(!isEc)}
          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Switch to {isEc ? 'GC' : 'EC'}
        </button>
      </div>

      {isEc ? (
        <div className="flex gap-2">
          <select
            value={ecDay}
            onChange={(e) => handleEcChange(ecYear, ecMonth, e.target.value)}
            className="flex-1 px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow bg-white"
            required={required}
          >
            <option value="">Day</option>
            {days.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select
            value={ecMonth}
            onChange={(e) => handleEcChange(ecYear, e.target.value, ecDay)}
            className="flex-[2] px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow bg-white"
            required={required}
          >
            <option value="">Month</option>
            {EC_MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={ecYear}
            onChange={(e) => handleEcChange(e.target.value, ecMonth, ecDay)}
            className="flex-[1.5] px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow bg-white"
            required={required}
          >
            <option value="">Year</option>
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      ) : (
        <input
          id={id}
          type="date"
          value={value || ''}
          onChange={handleGcChange}
          required={required}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow bg-white"
        />
      )}
    </div>
  );
}
