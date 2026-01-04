import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  Wifi, MapPin, Phone, HelpCircle, 
  Smartphone, Laptop, Radio, Download,
  Settings, Zap, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';
import GraceChatWidget from '@/components/chat/GraceChatWidget';

const publicWifiLocations = [
  { name: 'Public Libraries', icon: '📚', description: 'Free WiFi and computer access at all Iowa public libraries' },
  { name: 'Community Centers', icon: '🏢', description: 'Many community centers offer free WiFi access' },
  { name: 'Coffee Shops', icon: '☕', description: 'Starbucks, Caribou, and local cafes often provide free WiFi' },
  { name: 'Fast Food Restaurants', icon: '🍔', description: 'McDonalds, Subway, and others offer free WiFi' },
  { name: 'Recovery Centers', icon: '💚', description: 'Peer drop-in centers often have free WiFi and computers' }
];

const lowBandwidthTips = [
  { tip: 'Disable auto-playing videos', icon: Settings },
  { tip: 'Use text-only mode when available', icon: Settings },
  { tip: 'Download resources for offline use', icon: Download },
  { tip: 'Connect during off-peak hours', icon: Zap }
];

export default function DigitalEquity() {
  const [zipCode, setZipCode] = useState('');
  const [lowBandwidthMode, setLowBandwidthMode] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleToggleLowBandwidth = (enabled) => {
    setLowBandwidthMode(enabled);
    if (enabled) {
      document.body.classList.add('low-bandwidth-mode');
      localStorage.setItem('lowBandwidthMode', 'true');
    } else {
      document.body.classList.remove('low-bandwidth-mode');
      localStorage.setItem('lowBandwidthMode', 'false');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <GraceHeader 
          title="Digital Equity & Access"
          subtitle="Free WiFi access points, internet assistance, and low-bandwidth options. Everyone deserves to connect."
          icon={Wifi}
        />

        {/* Low Bandwidth Mode Toggle */}
        <GraceCard gradient className="mb-8">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                <Zap className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Low-Bandwidth Mode</h3>
                <p className="text-gray-600 text-sm">
                  Optimize the platform for slower internet connections. Reduces data usage and improves loading times.
                </p>
              </div>
            </div>
            <Switch 
              checked={lowBandwidthMode}
              onCheckedChange={handleToggleLowBandwidth}
              className="flex-shrink-0"
            />
          </div>

          {lowBandwidthMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 pt-4 border-t border-teal-200"
            >
              <p className="text-sm text-teal-700 font-medium mb-3">✓ Low-bandwidth mode active</p>
              <div className="grid grid-cols-2 gap-3">
                {lowBandwidthTips.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    {item.tip}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </GraceCard>

        {/* Internet Assistance Request */}
        <GraceCard className="mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Phone className="w-6 h-6 text-purple-600" />
            Need Internet Access?
          </h3>
          <p className="text-gray-600 mb-6">
            We can help you find resources for internet access, including subsidized programs and mobile hotspot assistance.
          </p>
          <Button asChild className="bg-purple-600 hover:bg-purple-700">
            <a href="/GraceChat">
              Chat with Grace About Internet Access
            </a>
          </Button>
        </GraceCard>

        {/* Public WiFi Finder */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Find Free WiFi Near You</h3>
          
          <GraceCard className="mb-6">
            <div className="flex gap-4">
              <Input
                placeholder="Enter your ZIP code..."
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                className="flex-1"
              />
              <Button onClick={() => setShowResults(true)} disabled={!zipCode}>
                <MapPin className="w-4 h-4 mr-2" />
                Find Locations
              </Button>
            </div>
          </GraceCard>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {publicWifiLocations.map((location, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <GraceCard hover>
                  <div className="text-center">
                    <div className="text-4xl mb-3">{location.icon}</div>
                    <h4 className="font-semibold text-gray-900 mb-2">{location.name}</h4>
                    <p className="text-sm text-gray-600">{location.description}</p>
                  </div>
                </GraceCard>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Resources */}
        <GraceCard>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Internet Assistance Programs</h3>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Affordable Connectivity Program (ACP)</h4>
              <p className="text-sm text-blue-800 mb-3">
                Up to $30/month discount on internet service for eligible households.
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="https://www.fcc.gov/acp" target="_blank" rel="noopener noreferrer">
                  Learn More
                </a>
              </Button>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2">Lifeline Program</h4>
              <p className="text-sm text-purple-800 mb-3">
                Discounted phone and internet service for qualifying low-income consumers.
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="https://www.fcc.gov/lifeline-consumers" target="_blank" rel="noopener noreferrer">
                  Learn More
                </a>
              </Button>
            </div>

            <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
              <h4 className="font-semibold text-teal-900 mb-2">Mobile Hotspot Assistance</h4>
              <p className="text-sm text-teal-800">
                Contact Grace to learn about mobile hotspot programs available in your area.
              </p>
            </div>
          </div>
        </GraceCard>
      </div>

      <GraceChatWidget />

      <style>{`
        .low-bandwidth-mode img,
        .low-bandwidth-mode video {
          display: none !important;
        }
        .low-bandwidth-mode * {
          animation: none !important;
          transition: none !important;
        }
      `}</style>
    </div>
  );
}