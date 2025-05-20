import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useTypingStore } from '../store/typingStore';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

const ChatPage = () => {
  const { matchId } = useParams();
  const user = useAuthStore((state) => state.user);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [partnerTyping, setPartnerTyping] = useState(false);
  const { isTyping, setTyping } = useTypingStore();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingChannel = useRef<any>(null);

  useEffect(() => {
    if (!user || !matchId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${matchId}),and(sender_id.eq.${matchId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (data) {
        setMessages(data);

        // Mark messages sent by match as read
        const unreadIds = data
          .filter((msg) => msg.sender_id === matchId && !msg.read)
          .map((msg) => msg.id);

        if (unreadIds.length > 0) {
          await supabase
            .from('messages')
            .update({ read: true })
            .in('id', unreadIds);
        }
      }
    };

    fetchMessages();

    // Message real-time subscription
    const messageChannel = supabase
      .channel('chat-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const msg: Message = payload.new;

          const isRelevant =
            (msg.sender_id === user.id && msg.receiver_id === matchId) ||
            (msg.sender_id === matchId && msg.receiver_id === user.id);

          if (isRelevant) {
            setMessages((prev) => [...prev, msg]);

            if (msg.sender_id === matchId) {
              await supabase
                .from('messages')
                .update({ read: true })
                .eq('id', msg.id);
            }
          }
        }
      )
      .subscribe();

    // Typing subscription
    typingChannel.current = supabase
      .channel('typing')
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.sender === matchId) {
          setPartnerTyping(true);
          setTimeout(() => setPartnerTyping(false), 1500);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(typingChannel.current);
    };
  }, [user, matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !matchId) return;

    await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: matchId,
      content: newMessage.trim(),
    });

    setNewMessage('');
  };

  const handleTyping = async () => {
    if (!user || !matchId) return;

    await supabase.channel('typing').send({
      type: 'broadcast',
      event: 'typing',
      payload: { sender: user.id },
    });
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 flex flex-col h-[80vh] border rounded shadow p-4">
      <h2 className="text-xl font-bold mb-4 text-center">Chat</h2>
      <div className="flex-1 overflow-y-auto space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-2 rounded max-w-xs ${
              msg.sender_id === user?.id
                ? 'bg-primary text-white ml-auto'
                : 'bg-gray-200 text-black'
            }`}
          >
            {msg.content}
            {msg.sender_id === user.id && msg.read && (
              <span className="block text-xs text-right text-green-200">✓✓ Read</span>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
        {partnerTyping && (
          <div className="text-sm text-gray-500 italic">Typing...</div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          className="flex-1 border p-2 rounded"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button
          className="bg-primary text-white px-4 py-2 rounded"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatPage;
