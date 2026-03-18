'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Pill, AlertTriangle, Plus } from 'lucide-react';
import { PharmacyMedicine } from '@/types';

export default function PharmacyDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['pharmacyDashboard'],
    queryFn: async () => {
      const res = await api.get('/dashboard');
      return res.data;
    }
  });

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Failed to load dashboard data.</div>;

  const totalMedicines = data?.totalMedicines || 0;
  const lowStockMedicines: PharmacyMedicine[] = data?.lowStockMedicines || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Pharmacy Dashboard</h1>
        <Link 
          href="/pharmacy/medicines"
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Manage Inventory
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <Pill className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Listed Medicines</p>
              <p className="text-2xl font-semibold text-gray-900">{totalMedicines}</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Low Stock / Unavailable</p>
              <p className="text-2xl font-semibold text-gray-900">{lowStockMedicines.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Action Required (Low Stock)</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {lowStockMedicines.length === 0 ? (
            <li className="px-6 py-4 text-sm text-gray-500">All inventory levels look good.</li>
          ) : (
            lowStockMedicines.map((medicine) => (
              <li key={medicine.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600 truncate">
                      {medicine.medicineName}
                    </p>
                    <p className="text-sm text-gray-500">
                      Quantity: {medicine.quantity}
                    </p>
                  </div>
                  <div>
                    <Link href="/pharmacy/medicines" className="text-sm text-blue-600 hover:underline">Restock</Link>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
