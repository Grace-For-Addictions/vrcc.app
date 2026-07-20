import React, { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from './supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';

// A 1:1 participant<->coach thread. `me.role` is 'participant' or 'coach'.
export default function Messaging({ participantEmail, participantId, me, heightClass = 'h-80' }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  const load = useCallback(async () => {
    if (!participantEmail) return;
    const { data } = await supabase
      .from('mvp_messages')
      .select('*')
      .eq('participant_email', participantEmail)
      .order('created_date', { ascending: true });
    setMessages(data || []);
  }, [participantEmail]);

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setSending(true);
    setText('');
    // optimistic
    const optimistic = {
      id: `tmp-${Date.now()}`,
      participant_email: participantEmail,
      sender_role: me.role,
      sender_email: me.email,
      sender_name: me.name,
      body,
      created_date: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    await supabase.from('mvp_messages').insert({
      participant_id: participantId || null,
      participant_email: participantEmail,
      sender_role: me.role,
      sender_email: me.email,
      sender_name: me.name,
      body,
      read: false,
    });
    setSending(false);
    load();
  };

  return (
    <div className="flex flex-col">
      <div ref={scrollRef} className={`${heightClass} overflow-y-auto space-y-3 p-3 bg-gray-50 rounded-xl border border-gray-100`}>
        {messages.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-10">
            No messages yet. Say hello 👋
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_email === me.email;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[78%] rounded-2xl px-4 py-2 text-sm ${
                mine ? 'bg-teal-600 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
              }`}>
                {!mine && <div className="text-[11px] font-medium text-teal-600 mb-0.5">{m.sender_name || (m.sender_role === 'coach' ? 'Coach' : 'Participant')}</div>}
                <div className="whitespace-pre-wrap">{m.body}</div>
              </div>
            </div>
          );
        })}
      </div>
      <form onSubmit={send} className="flex gap-2 mt-3">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" />
        <Button type="submit" disabled={sending || !text.trim()} className="bg-teal-600 hover:bg-teal-700 shrink-0">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </form>
    </div>
  );
}
