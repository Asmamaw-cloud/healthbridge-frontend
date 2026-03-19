'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Search, MapPin, Phone } from 'lucide-react';

export default function DrugFinder() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  
  // debounced query logic implicitly handled through manual search trigger or continuous input
  // Since we want standard behavior, let's keep it responsive but maybe add a submit button
  const [query, setQuery] = useState({ q: '', location: '' });

  const { data: results = [], isLoading, error } = useQuery({
    queryKey: ['medicines', query],
    queryFn: async () => {
      if (!query.q) return [];
      const params = new URLSearchParams();
      params.append('q', query.q);
      if (query.location) params.append('location', query.location);
      
      const res = await api.get(`/medicines/search?${params.toString()}`);
      return res.data;
    },
    enabled: !!query.q,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery({ q: searchTerm, location: searchLocation });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Drug Finder</h1>
        <p className="mt-1 text-sm text-gray-500">Locate available medicines at nearby pharmacies.</p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search medicine name (e.g. Paracetamol)..."
            required
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full py-3 pl-10 pr-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="relative sm:w-64">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <MapPin className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Location (e.g. Bole)"
            value={searchLocation}
            onChange={(e) => setSearchLocation(e.target.value)}
            className="block w-full py-3 pl-10 pr-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          className="px-6 py-3 font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Search
        </button>
      </form>

      {query.q && (
        <div className="mt-8">
          {isLoading ? (
            <div className="py-12 text-center text-gray-500">Searching pharmacies...</div>
          ) : error ? (
            <div className="py-12 text-center text-red-500">Failed to search medicines.</div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No pharmacies found with this medicine in stock.</div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {results.map((item: any) => (
                  <li key={item.id} className="p-6 hover:bg-gray-50">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{item.medicineName}</h3>
                        {item.genericName && (
                          <p className="text-xs text-gray-400 -mt-0.5 mb-1 italic">
                            Generic: {item.genericName}
                          </p>
                        )}
                        <p className="mt-1 flex items-center text-sm text-gray-500">
                          <MapPin className="mr-1.5 h-4 w-4 text-gray-400" />
                          {item.pharmacy?.pharmacyName} — {item.pharmacy?.location || 'Location not specified'}
                        </p>
                      </div>
                      <div className="mt-4 sm:mt-0 sm:text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.availabilityStatus ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {item.availabilityStatus ? 'In Stock' : 'Out of Stock'}
                        </span>
                        <div className="mt-2 text-sm text-gray-500 flex items-center sm:justify-end">
                           <Phone className="mr-1.5 h-4 w-4 text-gray-400" />
                           {item.pharmacy?.contactInfo || 'No contact provided'}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
