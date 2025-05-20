import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function UserMenu() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="p-2 text-right">
      <button onClick={handleLogout} className="text-sm text-red-600 underline">
        Logout
      </button>
    </div>
  );
}
