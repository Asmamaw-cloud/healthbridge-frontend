'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Users, Clock, CheckCircle } from 'lucide-react';
import { Consultation } from '@/types';
import { format } from 'date-fns';

export default function ProviderDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['providerDashboard'],
    queryFn: async () => {
      const res = await api.get('/dashboard');
      return res.data;
    }
  });

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Failed to load dashboard data.</div>;


  console.log('data: ', data);
  const todayConsultations: Consultation[] = data?.todayConsultations || [];
  const pendingRequests: Consultation[] = data?.pendingRequests || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Provider Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-indigo-100 rounded-full">
              <Clock className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Today&apos;s Appointments</p>
              <p className="text-2xl font-semibold text-gray-900">{todayConsultations.length}</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Users className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Requests</p>
              <p className="text-2xl font-semibold text-gray-900">{pendingRequests.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Today's Schedule */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Today&apos;s Schedule</h3>
            <Link href="/provider/schedule" className="text-sm text-blue-600 hover:text-blue-500">View all</Link>
          </div>
          <ul className="divide-y divide-gray-200">
            {todayConsultations.length === 0 ? (
              <li className="px-6 py-4 text-sm text-gray-500">No appointments scheduled for today.</li>
            ) : (
              todayConsultations.map((consultation) => (
                <li key={consultation.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {consultation.patient?.fullName || 'Unknown Patient'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {consultation.consultationTime}
                      </p>
                    </div>
                    {consultation.consultationStatus === 'scheduled' && (
                      <Link 
                        href={`/video/${consultation.id}`}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        Join Call
                      </Link>
                    )}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Pending Requests */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Pending Requests</h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {pendingRequests.length === 0 ? (
              <li className="px-6 py-4 text-sm text-gray-500">No pending consultation requests.</li>
            ) : (
              pendingRequests.map((request) => (
                <li key={request.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {request.patient?.fullName || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(request.consultationDate), 'MMM d, yyyy')} at {format(new Date(request.consultationTime), 'hh:mm a')}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                       <Link href="/provider/consultations" className="text-sm text-blue-600 hover:underline">Review</Link>
                    </div>
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
