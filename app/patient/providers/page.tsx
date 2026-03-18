'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Search, User, Briefcase, DollarSign } from 'lucide-react';
import { Provider } from '@/types';

export default function ProviderDirectory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [specialization, setSpecialization] = useState('');

  const { data: providers = [], isLoading, error } = useQuery({
    queryKey: ['providers', searchTerm, specialization],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('q', searchTerm);
      if (specialization) params.append('specialization', specialization);
      params.append('available', 'true');
      
      const res = await api.get(`/providers?${params.toString()}`);
      return res.data;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Find a Healthcare Provider</h1>
      </div>

      <div className="flex flex-col p-4 bg-white rounded-lg shadow sm:flex-row sm:items-center sm:space-x-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name, clinic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full py-2 pl-10 pr-3 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div className="mt-4 sm:mt-0 sm:w-64">
          <select
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            className="block w-full py-2 pl-3 pr-10 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">All Specializations</option>
            <option value="Cardiology">Cardiology</option>
            <option value="Dermatology">Dermatology</option>
            <option value="General Practice">General Practice</option>
            <option value="Pediatrics">Pediatrics</option>
            <option value="Psychiatry">Psychiatry</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-gray-500">Loading providers...</div>
      ) : error ? (
        <div className="py-12 text-center text-red-500">Failed to load providers. Please try again.</div>
      ) : providers.length === 0 ? (
        <div className="py-12 text-center text-gray-500">No providers found matching your search.</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider: Provider) => (
            <div key={provider.id} className="flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex flex-col items-center p-6 text-center">
                <div className="flex items-center justify-center w-16 h-16 text-xl font-medium text-white bg-blue-100 text-blue-800 rounded-full">
                  {provider.user?.fullName?.charAt(0) || 'D'}
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Dr. {provider.user?.fullName}</h3>
                <p className="mt-1 text-sm text-gray-500">{provider.specialization || 'General Practitioner'}</p>
              </div>
              
              <div className="flex flex-col px-6 py-4 space-y-3 bg-gray-50 rounded-b-lg">
                <div className="flex items-center text-sm text-gray-500">
                  <Briefcase className="flex-shrink-0 w-4 h-4 mr-2 text-gray-400" />
                  {provider.yearsExperience || 0} Years Experience
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <DollarSign className="flex-shrink-0 w-4 h-4 mr-2 text-gray-400" />
                  {provider.consultationFee ? `${provider.consultationFee} ETB/consultation` : 'Free'}
                </div>
                
                <div className="pt-2">
                  <Link
                    href={`/patient/book/${provider.id}`}
                    className="flex justify-center w-full px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-transparent rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Book Consultation
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
