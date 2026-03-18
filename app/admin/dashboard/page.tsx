'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Users, Building, ShieldCheck, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: async () => {
      const res = await api.get('/admin/analytics');
      return res.data;
    }
  });

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Failed to load dashboard data.</div>;

  const { totalPatients, totalProviders, totalPharmacies, totalConsultations, pendingProviders, pendingPharmacies } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-white rounded-lg shadow border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Patients</p>
              <p className="text-2xl font-semibold text-gray-900">{totalPatients}</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-indigo-100 rounded-full">
              <ShieldCheck className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Verified Providers</p>
              <p className="text-2xl font-semibold text-gray-900">{totalProviders}</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <Building className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Registered Pharmacies</p>
              <p className="text-2xl font-semibold text-gray-900">{totalPharmacies}</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Consultations</p>
              <p className="text-2xl font-semibold text-gray-900">{totalConsultations}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pending Providers */}
        <div className="bg-white rounded-lg shadow border border-gray-100">
          <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Pending Provider Approvals</h3>
            {pendingProviders?.length > 0 && <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">{pendingProviders.length}</span>}
          </div>
          <div className="p-6">
            <Link href="/admin/providers" className="text-blue-600 hover:text-blue-500 font-medium">
              Review {pendingProviders?.length || 0} pending applications →
            </Link>
          </div>
        </div>

        {/* Pending Pharmacies */}
        <div className="bg-white rounded-lg shadow border border-gray-100">
          <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Pending Pharmacy Approvals</h3>
            {pendingPharmacies?.length > 0 && <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">{pendingPharmacies.length}</span>}
          </div>
          <div className="p-6">
            <Link href="/admin/pharmacies" className="text-blue-600 hover:text-blue-500 font-medium">
              Review {pendingPharmacies?.length || 0} pending applications →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
