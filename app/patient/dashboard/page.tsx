'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Calendar, Activity, Pill, Plus, Video } from 'lucide-react';
import { Consultation, HealthReading } from '@/types';
import { format } from 'date-fns';

export default function PatientDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['patientDashboard'],
    queryFn: async () => {
      const res = await api.get('/dashboard');
      return res.data;
    }
  });

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Failed to load dashboard data.</div>;

  const upcomingConsultations: Consultation[] = data?.upcomingConsultations || [];
  const recentReadings: HealthReading[] = data?.recentReadings || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Patient Dashboard</h1>
        <Link 
          href="/patient/providers"
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Book Consultation
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Upcoming Consultations</p>
              <p className="text-2xl font-semibold text-gray-900">{upcomingConsultations.length}</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Recent Health Readings</p>
              <p className="text-2xl font-semibold text-gray-900">{recentReadings.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming Consultations */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Upcoming Consultations</h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {upcomingConsultations.length === 0 ? (
              <li className="px-6 py-4 text-sm text-gray-500">No upcoming consultations.</li>
            ) : (
              upcomingConsultations.map((consultation) => {
                const canJoin =
                  consultation.consultationStatus === 'scheduled' &&
                  consultation.patientVideoJoinAllowed === true &&
                  (consultation.consultationType === 'video' ||
                    consultation.consultationType === 'audio' ||
                    consultation.consultationType == null);
                return (
                <li key={consultation.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-indigo-600 truncate">
                        Dr. {consultation.provider?.user?.fullName || 'Unknown'}
                      </p>
                      <p className="flex items-center mt-2 text-sm text-gray-500">
                        <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        {format(new Date(consultation.consultationDate), 'MMM d, yyyy')} at {format(new Date(consultation.consultationTime), 'hh:mm a')}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
                      {consultation.consultationStatus === 'scheduled' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Scheduled
                        </span>
                      )}
                      {consultation.consultationStatus === 'pending' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                      {canJoin && (
                        <Link
                          href={`/video/${consultation.id}`}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                          <Video className="w-3.5 h-3.5 mr-1" />
                          Join visit
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              );
              })
            )}
          </ul>
        </div>

        {/* Recent Health Readings */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Health Readings</h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {recentReadings.length === 0 ? (
              <li className="px-6 py-4 text-sm text-gray-500">No recent readings. <Link href="/patient/health-tracker" className="text-blue-600 hover:underline">Add one</Link>.</li>
            ) : (
              recentReadings.slice(0, 5).map((reading) => (
                <li key={reading.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      {reading.bloodPressure && <p className="text-sm text-gray-900">BP: <strong>{reading.bloodPressure}</strong></p>}
                      {reading.heartRate && <p className="text-sm text-gray-900">HR: <strong>{reading.heartRate} bpm</strong></p>}
                      {reading.temperature && <p className="text-sm text-gray-900">Temp: <strong>{reading.temperature}°C</strong></p>}
                    </div>
                    <p className="text-sm text-gray-500">
                      {format(new Date(reading.timestamp), 'MMM d, p')}
                    </p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
