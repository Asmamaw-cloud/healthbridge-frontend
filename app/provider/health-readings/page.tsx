'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Search, Activity, Heart, Thermometer, Droplets, Scale } from 'lucide-react';
import { format } from 'date-fns';
import { HealthReading, User } from '@/types';

export default function PatientHealthReadings() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
 
  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Ideally there would be an endpoint /health-readings/patients that groups by patient,
  // but let's fetch all readings (the backend filter them by provider's patients if needed)
  const { data: readings = [], isLoading, error } = useQuery<HealthReading[]>({
    queryKey: ['provider-health-readings', debouncedSearch],
    queryFn: async () => {
      const res = await api.get(`/health-readings?search=${debouncedSearch}`);
      return res.data;
    }
  });

  const filteredReadings = readings; // Backend handles filtering now

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Patient Health Readings</h1>
        <div className="mt-4 md:mt-0 relative w-full md:w-64">
           <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
             <Search className="w-4 h-4 text-gray-400" />
           </div>
           <input
             type="text"
             placeholder="Search patient..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="block w-full py-2 pl-10 pr-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
           />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading patient readings...</div>
        ) : error ? (
           <div className="p-8 text-center text-red-500">Failed to load readings.</div>
        ) : filteredReadings.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No health readings found.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredReadings.map((reading) => (
              <li key={reading.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{reading.patient?.fullName}</h3>
                    <p className="text-sm text-gray-500 font-medium">
                      Recorded on: {format(new Date(reading.timestamp), 'MMM d, yyyy • h:mm a')}
                    </p>
                  </div>
                  {/* Highlight abnormal readings based on prompt logic: BP>160/100, HR>120, Temp>38 */}
                  {((reading.heartRate && reading.heartRate > 120) || 
                    (reading.temperature && reading.temperature > 38) || 
                    (reading.bloodPressure && reading.bloodPressure.includes('/') && parseInt(reading.bloodPressure.split('/')[0]) > 160)) && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Abnormal Reading Alert
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                  {reading.bloodPressure && (
                    <div className="bg-gray-50 p-3 rounded border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1 flex items-center"><Activity className="w-3 h-3 mr-1" /> BP</p>
                      <p className={`font-semibold ${reading.bloodPressure.includes('/') && parseInt(reading.bloodPressure.split('/')[0]) > 160 ? 'text-red-600' : 'text-gray-900'}`}>{reading.bloodPressure}</p>
                    </div>
                  )}
                  {reading.heartRate != null && (
                    <div className="bg-gray-50 p-3 rounded border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1 flex items-center"><Heart className="w-3 h-3 mr-1" /> Heart Rate</p>
                      <p className={`font-semibold ${reading.heartRate > 120 ? 'text-red-600' : 'text-gray-900'}`}>{reading.heartRate} <span className="text-xs font-normal">bpm</span></p>
                    </div>
                  )}
                  {reading.temperature != null && (
                    <div className="bg-gray-50 p-3 rounded border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1 flex items-center"><Thermometer className="w-3 h-3 mr-1" /> Temp</p>
                      <p className={`font-semibold ${reading.temperature > 38 ? 'text-red-600' : 'text-gray-900'}`}>{reading.temperature} <span className="text-xs font-normal">°C</span></p>
                    </div>
                  )}
                  {reading.bloodGlucose != null && (
                    <div className="bg-gray-50 p-3 rounded border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1 flex items-center"><Droplets className="w-3 h-3 mr-1" /> Glucose</p>
                      <p className="font-semibold text-gray-900">{reading.bloodGlucose} <span className="text-xs font-normal">mg/dL</span></p>
                    </div>
                  )}
                  {reading.weight != null && (
                    <div className="bg-gray-50 p-3 rounded border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1 flex items-center"><Scale className="w-3 h-3 mr-1" /> Weight</p>
                      <p className="font-semibold text-gray-900">{reading.weight} <span className="text-xs font-normal">kg</span></p>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
