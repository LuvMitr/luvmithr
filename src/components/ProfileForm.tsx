import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types/UserProfile';

interface Props {
  userId: string;
}

export default function ProfileForm({ userId }: Props) {
  const [profile, setProfile] = useState<UserProfile>({
    id: userId,
    name: '',
    age: 18,
    gender: 'male',
    marital_status: 'single',
    interests: '',
    photo_url: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (data) setProfile(data);
    }
    fetchProfile();
  }, [userId]);

  async function handleSave() {
    setLoading(true);
    const { error } = await supabase.from('profiles').upsert(profile);
    setLoading(false);
    if (!error) alert('Profile saved!');
  }

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Profile</h2>
      <input
        className="border p-2 w-full mb-2"
        value={profile.name}
        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
        placeholder="Name"
      />
      <input
        className="border p-2 w-full mb-2"
        type="number"
        value={profile.age}
        onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })}
        placeholder="Age"
      />
      <select
        className="border p-2 w-full mb-2"
        value={profile.gender}
        onChange={(e) => setProfile({ ...profile, gender: e.target.value as any })}
      >
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
      </select>
      <select
        className="border p-2 w-full mb-2"
        value={profile.marital_status}
        onChange={(e) => setProfile({ ...profile, marital_status: e.target.value as any })}
      >
        <option value="single">Single</option>
        <option value="divorced">Divorced</option>
        <option value="widowed">Widowed</option>
      </select>
      <textarea
        className="border p-2 w-full mb-2"
        value={profile.interests}
        onChange={(e) => setProfile({ ...profile, interests: e.target.value })}
        placeholder="Interests"
      />
      <input
        className="border p-2 w-full mb-2"
        value={profile.photo_url}
        onChange={(e) => setProfile({ ...profile, photo_url: e.target.value })}
        placeholder="Photo URL"
      />
      <button
        className="bg-primary text-white px-4 py-2 rounded"
        onClick={handleSave}
        disabled={loading}
      >
        {loading ? 'Saving...' : 'Save Profile'}
      </button>
    </div>
  );
}
