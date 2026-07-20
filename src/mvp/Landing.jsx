import React from 'react';
import { Button } from '@/components/ui/button';
import { Heart, ArrowRight, Users, MessageCircle, ClipboardCheck } from 'lucide-react';

export default function Landing({ onGetStarted }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-amber-50">
      {/* Header */}
      <header className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-md">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div className="leading-tight">
            <div className="font-bold text-gray-900">Grace For Addictions</div>
            <div className="text-xs text-teal-600">Virtual Recovery Community Center</div>
          </div>
        </div>
        <Button onClick={onGetStarted} variant="ghost" className="text-teal-700 hover:bg-teal-50">
          Sign in
        </Button>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-10 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-teal-100/70 text-teal-800 text-xs font-medium px-3 py-1 mb-6">
          Connection Prevents Crisis
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
          Recovery is a place<br className="hidden sm:block" /> you can walk into.
        </h1>
        <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto">
          A warm, judgment-free community where you are met exactly where you are — and
          matched with a peer recovery coach who will walk with you.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={onGetStarted}
            className="bg-teal-600 hover:bg-teal-700 h-12 px-8 text-base"
          >
            Get started <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
        <p className="mt-4 text-sm text-gray-400">No fees. No stigma. Just grace.</p>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { icon: ClipboardCheck, title: 'Get to know you', body: 'A short welcome intake and a recovery-capital check-in — no wrong answers.' },
            { icon: Users, title: 'Meet your coach', body: 'A peer who has lived it claims your corner and walks with you.' },
            { icon: MessageCircle, title: 'Stay connected', body: 'Message anytime, request sessions, and see what’s coming next.' },
          ].map((c) => (
            <div key={c.title} className="bg-white rounded-2xl border border-teal-100/60 shadow-sm p-6">
              <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center mb-4">
                <c.icon className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{c.title}</h3>
              <p className="text-sm text-gray-600">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-teal-100/60 py-8 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} Grace For Addictions · Connection Prevents Crisis
      </footer>
    </div>
  );
}
