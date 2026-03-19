'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CustomLink } from 'lucide-react'; // placeholder
import { FileText, Plus, Trash2 } from 'lucide-react';
import { Consultation } from '@/types';
import { format } from 'date-fns';

const prescriptionItemSchema = z.object({
  medicineName: z.string().min(1, 'Required'),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  duration: z.string().optional(),
  instructions: z.string().optional(),
});

const formSchema = z.object({
  consultationNotes: z.string().optional(),
  prescriptions: z.array(prescriptionItemSchema),
});

type FormValues = z.infer<typeof formSchema>;

export default function ProviderPrescriptions() {
  const [selectedConsultationId, setSelectedConsultationId] = useState<string | null>(null);

  const { data: consultations = [], isLoading } = useQuery<Consultation[]>({
    queryKey: ['provider-completed-consultations'],
    queryFn: async () => {
      // In a real app we'd fetch only scheduled or completed to write prescriptions for
      const res = await api.get('/consultations');
      return res.data.filter((c: Consultation) => c.consultationStatus === 'scheduled' || c.consultationStatus === 'completed');
    }
  });

  console.log("Here are the consultations", consultations)

  const { register, control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prescriptions: [{ medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "prescriptions"
  });

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Endpoint specified in prompt: POST /consultations/:id/prescription
      // and PUT /consultations/:id/status? or maybe notes are also updated here?
      // Assuming a single call handles both notes & prescriptions based on typical monolithic endpoint,
      // or we make two calls.
      const payload = {
         notes: data.consultationNotes,
         prescriptions: data.prescriptions
      };
      const res = await api.post(`/consultations/${selectedConsultationId}/prescription`, payload);
      return res.data;
    },
    onSuccess: () => {
      setSelectedConsultationId(null);
      reset();
      alert('Prescription saved successfully');
    }
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto flex flex-col md:flex-row gap-6">
      
      {/* Sidebar: Patient List / Consultations */}
      <div className="w-full md:w-1/3 bg-white rounded-lg shadow min-h-[500px] border border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-indigo-600" /> Consultations
          </h2>
          <p className="text-xs text-gray-500 mt-1">Select a patient to write notes & prescriptions</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
          ) : consultations.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">No applicable consultations found.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {consultations.map((consultation) => (
                <li 
                  key={consultation.id} 
                  onClick={() => setSelectedConsultationId(consultation.id)}
                  className={`p-4 cursor-pointer transition-colors ${selectedConsultationId === consultation.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : 'hover:bg-gray-50'}`}
                >
                  <p className="text-sm font-medium text-gray-900">{consultation.patient?.fullName}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(new Date(consultation.consultationDate), 'MMM d')} • {consultation.consultationTime}
                  </p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium mt-2 ${consultation.consultationStatus === 'completed' ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'}`}>
                    {consultation.consultationStatus}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Main Area: Prescription Form */}
      <div className="w-full md:w-2/3">
        {selectedConsultationId ? (
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Consultation Notes & Prescriptions</h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-8">
                
                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Clinical Notes</label>
                  <textarea
                    {...register('consultationNotes')}
                    rows={4}
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Record patient presentation, diagnosis, and recommendations..."
                  />
                </div>

                {/* Prescriptions */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">Prescribed Medications</label>
                    <button
                      type="button"
                      onClick={() => append({ medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' })}
                      className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add Medication
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg relative">
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <label className="block flex text-xs font-medium text-gray-700 mb-1">Medication Name</label>
                            <input
                              {...register(`prescriptions.${index}.medicineName` as const)}
                              className="block w-full py-1.5 px-3 border border-gray-300 rounded shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="e.g. Amoxicillin 500mg"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Dosage</label>
                            <input
                              {...register(`prescriptions.${index}.dosage` as const)}
                              className="block w-full py-1.5 px-3 border border-gray-300 rounded shadow-sm text-sm"
                              placeholder="e.g. 1 Tablet"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Frequency</label>
                            <input
                              {...register(`prescriptions.${index}.frequency` as const)}
                              className="block w-full py-1.5 px-3 border border-gray-300 rounded shadow-sm text-sm"
                              placeholder="e.g. Twice a day"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Duration</label>
                            <input
                              {...register(`prescriptions.${index}.duration` as const)}
                              className="block w-full py-1.5 px-3 border border-gray-300 rounded shadow-sm text-sm"
                              placeholder="e.g. 7 days"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Special Instructions</label>
                            <input
                              {...register(`prescriptions.${index}.instructions` as const)}
                              className="block w-full py-1.5 px-3 border border-gray-300 rounded shadow-sm text-sm"
                              placeholder="e.g. Take after meals"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {mutation.isPending ? 'Saving...' : 'Save Notes & Prescriptions'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow border border-gray-200 flex flex-col items-center justify-center p-12 h-full text-center">
            <FileText className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No Patient Selected</h3>
            <p className="mt-2 text-gray-500">Select a consultation from the list to view and write prescriptions.</p>
          </div>
        )}
      </div>

    </div>
  );
}
