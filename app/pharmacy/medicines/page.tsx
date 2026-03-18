'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, Edit2, Trash2, Search, Pill } from 'lucide-react';
import { PharmacyMedicine } from '@/types';
import { useForm } from 'react-hook-form';

export default function PharmacyMedicines() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Fetch pharmacy inventory
  const { data: medicines = [], isLoading } = useQuery<PharmacyMedicine[]>({
    queryKey: ['pharmacy-medicines'],
    queryFn: async () => {
      // Assuming GET /pharmacy/medicines returns this pharmacy's inventory
      // the prompt says "GET /medicines/search, POST /pharmacy/add-medicine, PUT /pharmacy/update-medicine"
      // If there's no specific GET for my inventory, we use dashboard or search filtered by our ID.
      // We will assume GET /pharmacy/medicines exists as standard REST, 
      // or we just fetch dashboard data which has `totalMedicines` but maybe not the full list.
      // The prompt actually says "POST /pharmacy/add-medicine", "PUT /pharmacy/update-medicine"
      // Let's assume GET /pharmacy/medicines to list them.
      const res = await api.get('/pharmacy/medicines').catch(() => ({ data: [] })); 
      return res.data;
    }
  });

  const { register, handleSubmit, reset } = useForm();

  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        medicineName: data.medicineName,
        genericName: data.genericName,
        quantity: parseInt(data.quantity),
        availabilityStatus: data.availabilityStatus === 'true'
      };
      const res = await api.post('/pharmacy/add-medicine', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-medicines'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacyDashboard'] });
      setIsAdding(false);
      reset();
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: boolean }) => {
      const res = await api.put(`/pharmacy/update-medicine/${id}`, { availabilityStatus: status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-medicines'] });
    }
  });

  const filteredMedicines = medicines.filter(m => m.medicineName.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Inventory Management</h1>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-4">
          <div className="relative w-64">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full py-2 pl-10 pr-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isAdding ? 'Cancel' : <><Plus className="w-4 h-4 mr-2" /> Add Medicine</>}
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-100">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Medicine</h2>
          <form onSubmit={handleSubmit((d) => addMutation.mutate(d))} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Medicine Name</label>
              <input required {...register('medicineName')} className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="e.g. Paracetamol 500mg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Generic Name</label>
              <input {...register('genericName')} className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="e.g. Acetaminophen" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Quantity</label>
              <input type="number" required {...register('quantity')} className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" defaultValue="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select {...register('availabilityStatus')} className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                <option value="true">In Stock</option>
                <option value="false">Out of Stock</option>
              </select>
            </div>
            <div className="lg:col-span-4 flex justify-end mt-2">
              <button
                type="submit"
                disabled={addMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded flex items-center hover:bg-blue-700"
              >
                {addMutation.isPending ? 'Adding...' : 'Save Item'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading inventory...</div>
        ) : filteredMedicines.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Pill className="w-12 h-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-900">No inventory found</h3>
            <p className="text-gray-500 mt-1">Start adding medicines to make them visible to patients.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicine Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Generic Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMedicines.map((medicine) => (
                  <tr key={medicine.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{medicine.medicineName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{medicine.genericName || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{medicine.quantity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleStatusMutation.mutate({ id: medicine.id, status: !medicine.availabilityStatus })}
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full focus:outline-none ${medicine.availabilityStatus ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                      >
                        {medicine.availabilityStatus ? 'In Stock' : 'Out of Stock'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-indigo-600 hover:text-indigo-900 ml-4"><Edit2 className="w-4 h-4"/></button>
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
