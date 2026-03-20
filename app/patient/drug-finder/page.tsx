'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Search, MapPin, Phone } from 'lucide-react';

export default function DrugFinder() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  
  const [query, setQuery] = useState({ q: '', location: '' });
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Auto-apply filters while typing (debounced) to avoid spamming the API.
  useEffect(() => {
    const t = window.setTimeout(() => {
      setPage(1);
      setQuery({
        q: searchTerm.trim(),
        location: searchLocation.trim(),
      });
    }, 400);

    return () => window.clearTimeout(t);
  }, [searchTerm, searchLocation]);

  const { data: results = [], isLoading, error } = useQuery({
    queryKey: ['medicines', query, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query.q) params.append('q', query.q);
      if (query.location) params.append('location', query.location);
      params.append('page', String(page));
      params.append('pageSize', String(pageSize));
      
      const res = await api.get(`/medicines/search?${params.toString()}`);
      return res.data;
    },
  });


  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Drug Finder</h1>
        <p className="mt-1 text-sm text-gray-500">Locate available medicines at nearby pharmacies.</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search medicine name (e.g. Paracetamol)..."
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
      </div>

      {(() => {
        const hasAnyFilter = !!query.q || !!query.location;

        if (hasAnyFilter) {
          return (
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

              <div className="p-4 flex items-center justify-between border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || isLoading}
                  className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <div className="text-sm text-gray-600">
                  Page {page}
                </div>
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={results.length < pageSize || isLoading}
                  className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
          );
        }

        return (
          <div className="mt-8">
            {isLoading ? (
              <div className="py-12 text-center text-gray-500">Loading medicines...</div>
            ) : error ? (
              <div className="py-12 text-center text-red-500">Failed to load medicines.</div>
            ) : results.length === 0 ? (
              <div className="py-12 text-center text-gray-500">No medicines found.</div>
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

                <div className="p-4 flex items-center justify-between border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || isLoading}
                    className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Prev
                  </button>
                  <div className="text-sm text-gray-600">
                    Page {page}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={results.length < pageSize || isLoading}
                    className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })()}

    </div>
  );
}
