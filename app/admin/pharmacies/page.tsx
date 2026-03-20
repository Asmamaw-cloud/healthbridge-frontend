'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Check, X, Building } from 'lucide-react';
import { Pharmacy } from '@/types';

export default function AdminPharmacies() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('pending');

  const { data: pharmacies = [], isLoading } = useQuery<Pharmacy[]>({
    queryKey: ['admin-pharmacies'],
    queryFn: async () => {
      const res = await api.get('/admin/pharmacies');
      return res.data;
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await api.patch(`/admin/pharmacies/${id}/approve`, { verificationStatus: status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pharmacies'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
    }
  });

  const filteredPharmacies = pharmacies.filter((p) => filter === 'all' || p.verificationStatus === filter);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Manage Pharmacies</h1>
        <div className="mt-4 md:mt-0">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="block w-full py-2 pl-3 pr-10 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Pharmacies</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading pharmacies...</div>
        ) : filteredPharmacies.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <Building className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-900">No pharmacies found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pharmacy Details</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location & Contact</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPharmacies.map((pharmacy) => (
                  <tr key={pharmacy.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-green-100 text-green-700 font-bold">
                          {pharmacy.pharmacyName.charAt(0) || 'P'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{pharmacy.pharmacyName}</div>
                          <div className="text-sm text-gray-500">Registered by: {pharmacy.user?.fullName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{pharmacy.location || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{pharmacy.contactInfo || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${pharmacy.verificationStatus === 'approved' ? 'bg-green-100 text-green-800' : 
                          pharmacy.verificationStatus === 'rejected' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'}`}>
                        {pharmacy.verificationStatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                      {pharmacy.licenseUrl ? (
                        <a
                          href={pharmacy.licenseUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline text-xs"
                        >
                          View License
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                      {pharmacy.verificationStatus === 'pending' && (
                        <div className="flex justify-start space-x-2">
                          <button
                            onClick={() => updateStatusMutation.mutate({ id: pharmacy.id, status: 'approved' })}
                            disabled={updateStatusMutation.isPending}
                            className="bg-green-600 text-white rounded-md px-3 py-1 hover:bg-green-700 flex items-center text-xs"
                          >
                            <Check className="w-3 h-3 mr-1" /> Approve
                          </button>
                          <button
                            onClick={() => updateStatusMutation.mutate({ id: pharmacy.id, status: 'rejected' })}
                            disabled={updateStatusMutation.isPending}
                            className="bg-red-600 text-white rounded-md px-3 py-1 hover:bg-red-700 flex items-center text-xs"
                          >
                            <X className="w-3 h-3 mr-1" /> Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
