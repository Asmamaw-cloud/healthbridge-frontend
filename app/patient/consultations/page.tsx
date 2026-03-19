'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Calendar as CalendarIcon, Clock, Video, User } from 'lucide-react';
import { format } from 'date-fns';
import { Consultation } from '@/types';
import Link from 'next/link';

export default function PatientConsultations() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');

  const { data: consultations = [], isLoading } = useQuery<Consultation[]>({
    queryKey: ['patient-consultations'],
    queryFn: async () => {
      const res = await api.get('/consultations');
      return res.data;
    }
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.put(`/consultations/${id}/cancel`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Consultation cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['patient-consultations'] });
      queryClient.invalidateQueries({ queryKey: ['patientDashboard'] });
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
          <h1 className="text-2xl font-semibold text-gray-900">My Consultations</h1>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="block w-full py-2 pl-3 pr-10 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Consultations</option>
            <option value="pending">Pending Approval</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
          <Link
            href="/patient/providers"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Book New
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading consultations...</div>
        ) : filteredConsultations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No consultations found.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredConsultations.map((consultation) => (
              <li key={consultation.id} className="p-6 hover:bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-700">
                        <User className="w-6 h-6" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Dr. {consultation.provider?.user?.fullName || 'Unknown'}
                      </h3>
                      {consultation.provider?.specialization && (
                        <p className="text-sm text-gray-500">{consultation.provider.specialization}</p>
                      )}
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-1"/> 
                          {format(new Date(consultation.consultationDate), 'MMM d, yyyy')}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1"/> 
                          {consultation.consultationTime}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 md:mt-0 flex flex-col md:items-end space-y-2">
                    {consultation.consultationStatus === 'pending' && (
                      <div className="flex flex-col space-y-2 items-end">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                          Pending Provider Approval
                        </span>
                        <button
                          onClick={() => cancelMutation.mutate(consultation.id)}
                          disabled={cancelMutation.isPending}
                          className="inline-flex items-center px-3 py-1 text-xs font-medium text-red-600 border border-red-200 rounded hover:bg-red-50 disabled:opacity-50"
                        >
                          Cancel Request
                        </button>
                      </div>
                    )}
                    
                    {consultation.consultationStatus === 'scheduled' && (
                      <>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          Scheduled
                        </span>
                        <Link
                          href={`/video/${consultation.id}`}
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                          <Video className="w-4 h-4 mr-2" /> Join Video Call
                        </Link>
                      </>
                    )}

                    {consultation.consultationStatus === 'completed' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                        Completed
                      </span>
                    )}

                    {consultation.consultationStatus === 'rejected' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        Declined
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
