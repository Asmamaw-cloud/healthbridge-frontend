export type UserRole = 'patient' | 'provider' | 'pharmacy' | 'admin';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type ConsultationStatus = 'pending' | 'scheduled' | 'completed' | 'cancelled' | 'rejected' | 'expired';

export interface User {
  id: string;
  fullName: string;
  email?: string | null;
  phoneNumber?: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Provider {
  id: string;
  userId: string;
  specialization?: string | null;
  yearsExperience?: number | null;
  consultationFee?: number | null;
  profileDescription?: string | null;
  availabilitySchedule?: any | null;
  licenseUrl?: string | null;
  verificationStatus: VerificationStatus;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface Pharmacy {
  id: string;
  userId: string;
  pharmacyName: string;
  location?: string | null;
  contactInfo?: string | null;
  licenseUrl?: string | null;
  verificationStatus: VerificationStatus;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface PharmacyMedicine {
  id: string;
  pharmacyId: string;
  medicineName: string;
  genericName?: string | null;
  quantity: number;
  availabilityStatus: boolean;
  updatedAt: string;
  pharmacy?: Pharmacy;
}

export interface Consultation {
  id: string;
  patientId: string;
  providerId: string;
  consultationDate: string;
  consultationTime: string;
  consultationStatus: ConsultationStatus;
  meetingLink?: string | null;
  consultationNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  patient?: User;
  provider?: Provider;
  prescriptions?: Prescription[];
}

export interface Prescription {
  id: string;
  consultationId?: string | null;
  medicineName: string;
  dosage?: string | null;
  frequency?: string | null;
  duration?: string | null;
  instructions?: string | null;
  consultation?: Consultation;
}

export interface HealthReading {
  id: string;
  patientId: string;
  bloodPressure?: string | null;
  heartRate?: number | null;
  temperature?: number | null;
  bloodGlucose?: number | null;
  weight?: number | null;
  timestamp: string;
  patient?: User;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  messageText?: string | null;
  fileUrl?: string | null;
  timestamp: string;
  sender?: User;
  receiver?: User;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  message: string;
  senderId?: string | null;
  isRead: boolean;
  createdAt: string;
  user?: User;
}
