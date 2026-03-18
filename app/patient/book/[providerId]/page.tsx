'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Video, Phone, MessageSquare } from 'lucide-react';
import Link from 'next/link';

const bookingSchema = z.object({
  date: z.string().min(1, 'Please select a date'),
  time: z.string().min(1, 'Please select a time'),
  type: z.enum(['video', 'audio', 'chat']),
  notes: z.string().optional()
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export default function BookConsultation() {
  const { providerId } = useParams();
  const router = useRouter();
  const [success, setSuccess] = useState(false);

  // Fetch provider details
  const { data: provider, isLoading: loadingProvider } = useQuery({
    queryKey: ['provider', providerId],
    queryFn: async () => {
      const res = await api.get(`/providers/${providerId}`);
      return res.data;
    },
    enabled: !!providerId,
  });

  const { register, handleSubmit, formState: { errors }, watch } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { type: 'video' }
  });
  
  const selectedType = watch('type');

  const bookMutation = useMutation({
    mutationFn: async (data: BookingFormValues) => {
      const payload = {
        providerId,
        consultationDate: data.date,
        consultationTime: data.time,
        consultationType: data.type,
        notes: data.notes
      };
      const res = await api.post('/consultations/book', payload);
      return res.data;
    },
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => router.push('/patient/dashboard'), 3000);
    }
  });

  if (loadingProvider) return <div className="p-8 text-center text-gray-500">Loading provider details...</div>;
  if (!provider) return <div className="p-8 text-center text-red-500">Provider not found.</div>;

  if (success) {
    return (
      <div className="max-w-md p-8 mx-auto mt-12 text-center bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <h2 className="mt-4 text-2xl font-bold text-gray-900">Request Sent!</h2>
        <p className="mt-2 text-gray-600">Your consultation request has been sent to Dr. {provider.user?.fullName}. You will be notified when it's confirmed.</p>
        <p className="mt-4 text-sm text-gray-500">Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/patient/providers" className="p-2 text-gray-400 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Book Consultation</h1>
      </div>

      <div className="p-6 bg-white rounded-lg shadow-sm">
        <div className="flex items-center pb-6 space-x-4 border-b border-gray-100">
          <div className="flex items-center justify-center w-16 h-16 text-xl font-medium text-blue-800 bg-blue-100 rounded-full">
            {provider.user?.fullName?.charAt(0) || 'D'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Dr. {provider.user?.fullName}</h2>
            <p className="text-gray-500">{provider.specialization}</p>
            <p className="mt-1 text-sm font-medium text-blue-600">Fee: {provider.consultationFee ? `${provider.consultationFee} ETB` : 'Free'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit((d) => bookMutation.mutate(d))} className="pt-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                {...register('date')}
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Time</label>
              <input
                type="time"
                {...register('time')}
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.time && <p className="mt-1 text-xs text-red-500">{errors.time.message}</p>}
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Consultation Type</label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <label className={`relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none ${selectedType === 'video' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300'}`}>
                <input type="radio" value="video" {...register('type')} className="sr-only" />
                <span className="flex flex-1">
                  <span className="flex flex-col">
                    <span className="flex items-center text-sm font-medium text-gray-900"><Video className="w-4 h-4 mr-2 text-blue-500"/> Video Call</span>
                  </span>
                </span>
              </label>
              <label className={`relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none ${selectedType === 'audio' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300'}`}>
                <input type="radio" value="audio" {...register('type')} className="sr-only" />
                <span className="flex flex-1">
                  <span className="flex flex-col">
                    <span className="flex items-center text-sm font-medium text-gray-900"><Phone className="w-4 h-4 mr-2 text-blue-500"/> Audio Call</span>
                  </span>
                </span>
              </label>
              <label className={`relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none ${selectedType === 'chat' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300'}`}>
                <input type="radio" value="chat" {...register('type')} className="sr-only" />
                <span className="flex flex-1">
                  <span className="flex flex-col">
                    <span className="flex items-center text-sm font-medium text-gray-900"><MessageSquare className="w-4 h-4 mr-2 text-blue-500"/> Text Chat</span>
                  </span>
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Reason for visit / Notes (Optional)</label>
            <textarea
              {...register('notes')}
              rows={4}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Briefly describe your symptoms or reason for consultation..."
            />
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={bookMutation.isPending}
              className="w-full px-4 py-3 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {bookMutation.isPending ? 'Submitting Request...' : 'Confirm Request'}
            </button>
          </div>
          {bookMutation.isError && (
            <p className="text-sm text-center text-red-500">{(bookMutation.error as any)?.response?.data?.message || 'Failed to book consultation.'}</p>
          )}
        </form>
      </div>
    </div>
  );
}
