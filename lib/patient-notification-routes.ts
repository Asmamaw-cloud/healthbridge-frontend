/**
 * In-app targets for patient notifications (keep in sync with Navbar mobile bell).
 */
export function patientNonMessageNotificationPath(type: string): string {
  if (type === 'abnormal_reading') return '/patient/health-tracker';
  if (type === 'prescription_added') return '/patient/prescriptions';
  return '/patient/consultations';
}

export function patientMessagesInboxPath(senderId: string): string {
  return `/patient/messages?with=${encodeURIComponent(senderId)}`;
}
