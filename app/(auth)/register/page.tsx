'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { UserRole } from '@/types';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  contact: z.string().min(1, 'Email or Phone is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['patient', 'provider', 'pharmacy']),
  
  // Provider fields
  specialization: z.string().optional(),
  yearsExperience: z.string().optional(),
  consultationFee: z.string().optional(),
  profileDescription: z.string().optional(),
  availabilitySchedule: z.string().optional(),
  
  // Pharmacy fields
  pharmacyName: z.string().optional(),
  location: z.string().optional(),
  contactInfo: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

type ScheduleState = Record<string, { enabled: boolean; start: string; end: string }>;

export default function RegisterPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [schedule, setSchedule] = useState<ScheduleState>(
    DAYS_OF_WEEK.reduce((acc, day) => ({
      ...acc,
      [day]: { enabled: false, start: '09:00', end: '17:00' }
    }), {})
  );

  const { register, handleSubmit, formState: { errors }, watch } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'patient'
    }
  });
  
  const selectedRole = watch('role');

  const toggleDay = (day: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled }
    }));
  };

  const updateTime = (day: string, field: 'start' | 'end', value: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const onSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    setError(null);
    try {
      const isEmail = data.contact.includes('@');
      
      const payload: any = {
        fullName: data.fullName,
        email: isEmail ? data.contact : undefined,
        phoneNumber: !isEmail ? data.contact : undefined,
        password: data.password,
        role: data.role
      };
      
      if (data.role === 'provider') {
        payload.specialization = data.specialization;
        payload.yearsExperience = data.yearsExperience ? parseInt(data.yearsExperience) : undefined;
        payload.consultationFee = data.consultationFee;
        payload.profileDescription = data.profileDescription;
        
        // Transform schedule state into the desired JSON format
        const formattedSchedule: Record<string, string[]> = {};
        Object.entries(schedule).forEach(([day, val]) => {
          if (val.enabled) {
            formattedSchedule[day] = [val.start, val.end];
          }
        });
        
        payload.availabilitySchedule = Object.keys(formattedSchedule).length > 0 
          ? formattedSchedule 
          : undefined;
          
      } else if (data.role === 'pharmacy') {
        payload.pharmacyName = data.pharmacyName;
        payload.location = data.location;
        payload.contactInfo = data.contactInfo;
      }
      
      const response = await api.post('/auth/register', payload);
      const { user, accessToken: token } = response.data;
      
      login(user, token);
      router.push(`/${user.role}/dashboard`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen py-12 bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">Create a HealthBridge Account</h2>
        
        {error && <div className="p-3 text-sm text-red-500 bg-red-100 rounded">{error}</div>}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
               {selectedRole === 'provider' ? 'Provider Name / Full Name' : 'Full Name'}
            </label>
            <input
              type="text"
              {...register('fullName')}
              className="w-full px-3 py-2 mt-1 border rounded shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email or Phone Number</label>
            <input
              type="text"
              {...register('contact')}
              className="w-full px-3 py-2 mt-1 border rounded shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.contact && <p className="mt-1 text-xs text-red-500">{errors.contact.message}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              {...register('password')}
              className="w-full px-3 py-2 mt-1 border rounded shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">I am a</label>
            <select
              {...register('role')}
              className="w-full px-3 py-2 mt-1 border rounded shadow-sm bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="patient">Patient</option>
              <option value="provider">Healthcare Provider</option>
              <option value="pharmacy">Pharmacy</option>
            </select>
            {errors.role && <p className="mt-1 text-xs text-red-500">{errors.role.message}</p>}
          </div>
          
          {selectedRole === 'provider' && (
            <div className="space-y-4 p-4 mt-4 bg-blue-50 rounded-md border border-blue-100">
               <h3 className="text-sm font-medium text-blue-800">Provider Details</h3>
               <div>
                 <label className="block text-xs font-medium text-gray-700">Specialization</label>
                 <input
                   type="text"
                   placeholder="e.g. Cardiologist"
                   {...register('specialization')}
                   className="w-full px-3 py-2 mt-1 border rounded shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                 />
               </div>
               <div className="flex space-x-4">
                 <div className="flex-1">
                   <label className="block text-xs font-medium text-gray-700">Years of Experience</label>
                   <input
                     type="number"
                     placeholder="e.g. 5"
                     {...register('yearsExperience')}
                     className="w-full px-3 py-2 mt-1 border rounded shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                   />
                 </div>
                 <div className="flex-1">
                   <label className="block text-xs font-medium text-gray-700">Consultation Fee (ETB)</label>
                   <input
                     type="number"
                     placeholder="e.g. 500"
                     {...register('consultationFee')}
                     className="w-full px-3 py-2 mt-1 border rounded shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                   />
                 </div>
               </div>
               <div>
                 <label className="block text-xs font-medium text-gray-700">Profile Description</label>
                 <textarea
                   rows={2}
                   placeholder="Brief overview of your medical background..."
                   {...register('profileDescription')}
                   className="w-full px-3 py-2 mt-1 border rounded shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                 />
               </div>
               
               <div className="space-y-2">
                 <label className="block text-xs font-medium text-gray-700">Availability Schedule</label>
                 <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
                   {DAYS_OF_WEEK.map(day => (
                     <div key={day} className="flex items-center space-x-2 bg-white p-2 rounded border border-blue-100 shadow-sm">
                       <input 
                         type="checkbox" 
                         checked={schedule[day].enabled} 
                         onChange={() => toggleDay(day)}
                         className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                       />
                       <span className="font-medium w-20 text-gray-700">{day}</span>
                       {schedule[day].enabled && (
                         <div className="flex items-center space-x-1 flex-1">
                           <input 
                             type="time" 
                             value={schedule[day].start}
                             onChange={(e) => updateTime(day, 'start', e.target.value)}
                             className="p-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-24"
                           />
                           <span className="text-gray-400">-</span>
                           <input 
                             type="time" 
                             value={schedule[day].end}
                             onChange={(e) => updateTime(day, 'end', e.target.value)}
                             className="p-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-24"
                           />
                         </div>
                       )}
                     </div>
                   ))}
                 </div>
               </div>
            </div>
          )}
          
          {selectedRole === 'pharmacy' && (
            <div className="space-y-4 p-4 mt-4 bg-green-50 rounded-md border border-green-100">
               <h3 className="text-sm font-medium text-green-800">Pharmacy Details</h3>
               <div>
                 <label className="block text-xs font-medium text-gray-700">Pharmacy Name</label>
                 <input
                   type="text"
                   placeholder="e.g. HealthCare Pharmacy"
                   {...register('pharmacyName')}
                   className="w-full px-3 py-2 mt-1 border rounded shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm"
                 />
               </div>
               <div>
                 <label className="block text-xs font-medium text-gray-700">Location</label>
                 <input
                   type="text"
                   placeholder="e.g. Bole, Addis Ababa"
                   {...register('location')}
                   className="w-full px-3 py-2 mt-1 border rounded shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm"
                 />
               </div>
               <div>
                 <label className="block text-xs font-medium text-gray-700">Contact Information</label>
                 <input
                   type="text"
                   placeholder="e.g. +251..."
                   {...register('contactInfo')}
                   className="w-full px-3 py-2 mt-1 border rounded shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm"
                 />
               </div>
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 mt-6"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        
        <div className="text-sm text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
