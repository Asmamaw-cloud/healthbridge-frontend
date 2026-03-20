'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Calendar as CalendarIcon, Clock, Check, X, Video } from 'lucide-react';
import { format } from 'date-fns';
import { Consultation } from '@/types';
import Link from 'next/link';

export default function ProviderSchedule() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all'); // all, pending, scheduled

  const { data: consultations = [], isLoading } = useQuery<Consultation[]>({
    queryKey: ['provider-consultations'],
    queryFn: async () => {
      const res = await api.get('/consultations');
      return res.data;
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await api.put(`/consultations/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-consultations'] });
      queryClient.invalidateQueries({ queryKey: ['providerDashboard'] });
    }
  });

  const filteredConsultations = consultations.filter(c => {
    if (filter === 'all') return true;
    return c.consultationStatus === filter;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Schedule & Appointments</h1>
        </div>
        <div className="mt-4 md:mt-0">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="block w-full py-2 pl-3 pr-10 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Appointments</option>
            <option value="pending">Pending Requests</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading schedule...</div>
        ) : filteredConsultations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No appointments found matching your filter.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredConsultations.map((consultation) => (
              <li key={consultation.id} className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                        {consultation.patient?.fullName?.charAt(0) || 'P'}
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">{consultation.patient?.fullName}</h3>
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center"><CalendarIcon className="w-4 h-4 mr-1"/> {format(new Date(consultation.consultationDate), 'MMM d, yyyy')}</span>
                        <span className="flex items-center"><Clock className="w-4 h-4 mr-1"/> {format(new Date(consultation.consultationTime), 'hh:mm a')}</span>
                      </div>
                      {consultation.consultationNotes && (
                        <p className="mt-2 text-sm text-gray-600 italic">Notes: "{consultation.consultationNotes}"</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 md:mt-0 flex items-center space-x-3">
                    {consultation.consultationStatus === 'pending' && (
                      <>
                        <button
                          onClick={() => updateStatusMutation.mutate({ id: consultation.id, status: 'rejected' })}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <X className="w-4 h-4 mr-1" /> Reject
                        </button>
                        <button
                          onClick={() => updateStatusMutation.mutate({ id: consultation.id, status: 'scheduled' })}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <Check className="w-4 h-4 mr-1" /> Approve
                        </button>
                      </>
                    )}
                    
                    {consultation.consultationStatus === 'scheduled' && (
                      <Link
                        href={`/video/${consultation.id}`}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <Video className="w-4 h-4 mr-2" /> Start Call
                      </Link>
                    )}

                    {consultation.consultationStatus === 'completed' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                        Completed
                      </span>
                    )}

                    {
                      consultation.consultationStatus === "cancelled" && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          Cancelled
                        </span>
                      )
                    }

                    {
                      consultation.consultationStatus === "rejected" && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          Rejected
                        </span>
                      )
                    }

                    {
                      consultation.consultationStatus === "expired" && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          Expired
                        </span>
                      )
                    }
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
