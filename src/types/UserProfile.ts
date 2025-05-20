export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  marital_status: 'single' | 'divorced' | 'widowed';
  interests?: string;
  photo_url?: string;
}
