'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Pill, Calendar, User, Download, FileText } from 'lucide-react';
import { format } from 'date-fns';

export default function PatientPrescriptions() {
  const { data: prescriptions = [], isLoading } = useQuery<any[]>({
    queryKey: ['patient-prescriptions'],
    queryFn: async () => {
      const res = await api.get('/prescriptions');
      return res.data;
    }
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">My Prescriptions</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading prescriptions...</div>
        ) : prescriptions.length === 0 ? (
          <div className="p-12 text-center">
            <Pill className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No prescriptions found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medication</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dosage & Frequency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prescribed By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {prescriptions.map((p) => (
                  <li key={p.id} className="contents">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-50 rounded-lg mr-3">
                            <Pill className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="text-sm font-medium text-gray-900">{p.medicineName}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{p.dosage || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{p.frequency || ''} {p.duration ? `• ${p.duration}` : ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <User className="w-4 h-4 mr-2 text-gray-400" />
                          Dr. {p.consultation?.provider?.user?.fullName || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(p.consultation?.consultationDate), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 flex items-center justify-end ml-auto">
                          <Download className="w-4 h-4 mr-1" /> PDF
                        </button>
                      </td>
                    </tr>
                    {p.instructions && (
                      <tr>
                        <td colSpan={5} className="px-6 pb-4 pt-0">
                           <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-100 italic">
                             <strong>Instructions:</strong> {p.instructions}
                           </div>
                        </td>
                      </tr>
                    )}
                  </li>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
