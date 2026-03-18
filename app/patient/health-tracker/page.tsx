'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Activity, Plus, Heart, Thermometer, Droplets, Scale } from 'lucide-react';
import { format } from 'date-fns';
import { HealthReading } from '@/types';

const readingSchema = z.object({
  bloodPressure: z.string().optional(),
  heartRate: z.number().optional().or(z.nan()),
  temperature: z.number().optional().or(z.nan()),
  bloodGlucose: z.number().optional().or(z.nan()),
  weight: z.number().optional().or(z.nan()),
});

// Since inputs return strings, we need a refined schema to parse numbers or keep them optional
type ReadingFormValues = {
  bloodPressure?: string;
  heartRate?: string;
  temperature?: string;
  bloodGlucose?: string;
  weight?: string;
};

export default function HealthTracker() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: readings = [], isLoading } = useQuery<HealthReading[]>({
    queryKey: ['health-readings'],
    queryFn: async () => {
      const res = await api.get('/health-readings');
      return res.data;
    }
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ReadingFormValues>();

  const mutation = useMutation({
    mutationFn: async (data: ReadingFormValues) => {
      const payload: any = {};
      if (data.bloodPressure) payload.bloodPressure = data.bloodPressure;
      if (data.heartRate) payload.heartRate = parseInt(data.heartRate, 10);
      if (data.temperature) payload.temperature = parseFloat(data.temperature);
      if (data.bloodGlucose) payload.bloodGlucose = parseFloat(data.bloodGlucose);
      if (data.weight) payload.weight = parseFloat(data.weight);
      
      const res = await api.post('/health-readings', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-readings'] });
      setShowForm(false);
      reset();
    }
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Health Tracker</h1>
          <p className="mt-1 text-sm text-gray-500">Record and monitor your health indicators for follow-up care.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="mt-4 md:mt-0 flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {showForm ? 'Cancel' : <><Plus className="w-4 h-4 mr-2" /> Record Reading</>}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">New Health Reading</h2>
          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  <Activity className="w-4 h-4 mr-2 text-red-500" /> Blood Pressure
                </label>
                <input
                  type="text"
                  placeholder="e.g. 120/80"
                  {...register('bloodPressure')}
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  <Heart className="w-4 h-4 mr-2 text-pink-500" /> Heart Rate (bpm)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 72"
                  {...register('heartRate')}
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  <Thermometer className="w-4 h-4 mr-2 text-orange-500" /> Temperature (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 36.6"
                  {...register('temperature')}
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  <Droplets className="w-4 h-4 mr-2 text-blue-500" /> Blood Glucose (mg/dL)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 95"
                  {...register('bloodGlucose')}
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  <Scale className="w-4 h-4 mr-2 text-green-500" /> Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 70.5"
                  {...register('weight')}
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={mutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {mutation.isPending ? 'Saving...' : 'Save Reading'}
              </button>
            </div>
            {mutation.isError && <p className="text-sm text-red-500">Failed to save reading. Please check your inputs.</p>}
          </form>
        </div>
      )}

      {/* History Log */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Reading History</h3>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading history...</div>
        ) : readings.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No health readings recorded yet.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {readings.map((reading) => (
              <li key={reading.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-500 font-medium">
                    {format(new Date(reading.timestamp), 'EEEE, MMMM d, yyyy • h:mm a')}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {reading.bloodPressure && (
                    <div className="bg-gray-50 p-3 rounded border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide flex items-center"><Activity className="w-3 h-3 mr-1" /> BP</p>
                      <p className="font-semibold text-gray-900">{reading.bloodPressure}</p>
                    </div>
                  )}
                  {reading.heartRate !== null && (
                    <div className="bg-gray-50 p-3 rounded border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide flex items-center"><Heart className="w-3 h-3 mr-1" /> HR</p>
                      <p className="font-semibold text-gray-900">{reading.heartRate} <span className="text-xs font-normal">bpm</span></p>
                    </div>
                  )}
                  {reading.temperature !== null && (
                    <div className="bg-gray-50 p-3 rounded border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide flex items-center"><Thermometer className="w-3 h-3 mr-1" /> Temp</p>
                      <p className="font-semibold text-gray-900">{reading.temperature} <span className="text-xs font-normal">°C</span></p>
                    </div>
                  )}
                  {reading.bloodGlucose !== null && (
                    <div className="bg-gray-50 p-3 rounded border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide flex items-center"><Droplets className="w-3 h-3 mr-1" /> Glucose</p>
                      <p className="font-semibold text-gray-900">{reading.bloodGlucose} <span className="text-xs font-normal">mg/dL</span></p>
                    </div>
                  )}
                  {reading.weight !== null && (
                    <div className="bg-gray-50 p-3 rounded border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide flex items-center"><Scale className="w-3 h-3 mr-1" /> Weight</p>
                      <p className="font-semibold text-gray-900">{reading.weight} <span className="text-xs font-normal">kg</span></p>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
}
