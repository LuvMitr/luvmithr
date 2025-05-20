import { UserProfile } from '../types/UserProfile';

interface Props {
  profile: UserProfile;
  onLike: () => void;
}

export default function DiscoveryCard({ profile, onLike }: Props) {
  return (
    <div className="border rounded-xl p-4 shadow-md bg-white mb-4">
      <img src={profile.photo_url} alt="Profile" className="w-full h-48 object-cover rounded-md mb-2" />
      <h3 className="text-lg font-semibold">{profile.name}, {profile.age}</h3>
      <p className="text-sm">{profile.gender} · {profile.marital_status}</p>
      <p className="text-sm mt-1 italic">{profile.interests}</p>
      <button onClick={onLike} className="mt-2 bg-primary text-white px-4 py-1 rounded">
        ❤️ Like
      </button>
    </div>
  );
}
