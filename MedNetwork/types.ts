// E:\MedicalNetworkApp\MedNetwork\app\types.ts
export interface Doctor {
    id: number;
    full_name: string;
    specialization: string;
    profile_picture: string | null;
  }
  
  export interface DoctorDetails extends Doctor {
    working_hours: string;
    working_days_of_week: string;
    weekend_days: string;
    online_appointment_fee: number;
    physical_appointment_fee: number;
  }