import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Wifi, MapPin, Phone, HelpCircle, 
  Smartphone, Laptop, Radio, Download,
  Settings, Zap, CheckCircle2, Sparkles, Loader2
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
  const [showAssistanceForm, setShowAssistanceForm] = useState(false);
  const [selectedNeeds, setSelectedNeeds] = useState([]);
  const [aiRecommendations, setAiRecommendations] = useState(null);
  const [isGeneratingMatches, setIsGeneratingMatches] = useState(false);
  const [assistanceData, setAssistanceData] = useState({
    name: '',
    email: '',
    phone: '',
    zip: '',
    assistance_type: 'ACP',
    description: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('lowBandwidthMode');
    if (saved === 'true') {
      setLowBandwidthMode(true);
      document.body.classList.add('low-bandwidth-mode');
    }
  }, []);

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

  const generateResourceMatches = async () => {
    if (!zipCode || selectedNeeds.length === 0) return;
    
    setIsGeneratingMatches(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are AI Grace powered by GPT-5.2 on Wix/Base44, helping find digital equity and community resources in Iowa.

ZIP Code: ${zipCode}
Needs: ${selectedNeeds.join(', ')}

Provide specific Iowa resources for each need with: name, contact info, eligibility criteria, application link/process. Include ACP (Affordable Connectivity Program), Lifeline, local housing assistance, job training programs, reentry support.

Return as JSON array of resources.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            resources: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  contact: { type: "string" },
                  eligibility: { type: "string" },
                  application_link: { type: "string" }
                }
              }
            }
          }
        }
      });

      setAiRecommendations(response.resources || []);
    } catch (error) {
      alert('Error generating matches. Please try again.');
    } finally {
      setIsGeneratingMatches(false);
    }
  };

  const submitAssistance = useMutation({
    mutationFn: async (data) => {
      // Save to database for tracking
      await base44.entities.DigitalEquityRequest.create({
        request_type: data.assistance_type.toLowerCase(),
        full_name: data.name,
        contact_email: data.email,
        contact_phone: data.phone,
        zip_code: data.zip
      });

      return base44.integrations.Core.SendEmail({
        to: 'support@graceforaddictions.org',
        subject: `Digital Equity Assistance Request - ${data.assistance_type}`,
        body: `
New assistance request:

Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone}
ZIP Code: ${data.zip}
Assistance Type: ${data.assistance_type}

Description:
${data.description}
        `
      });
    },
    onSuccess: () => {
      setShowAssistanceForm(false);
      setAssistanceData({ name: '', email: '', phone: '', zip: '', assistance_type: 'ACP', description: '' });
      alert('Request submitted! We will contact you within 48 hours.');
    }
  });

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

        {/* AI Resource Matching */}
        <GraceCard className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Resource Matching (Powered by GPT-5.2)
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Tell us your ZIP code and what you need - Grace will find relevant local and state resources with application info and eligibility.
          </p>
          
          <div className="space-y-4">
            <Input
              placeholder="Enter ZIP code"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
            />

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">What do you need help with?</p>
              <div className="flex flex-wrap gap-2">
                {['ACP/Internet Subsidy', 'Lifeline Phone', 'Hotspot Device', 'Housing', 'Job Training', 'Food Assistance', 'Reentry Support'].map(need => (
                  <button
                    key={need}
                    onClick={() => {
                      setSelectedNeeds(prev => 
                        prev.includes(need) ? prev.filter(n => n !== need) : [...prev, need]
                      );
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedNeeds.includes(need)
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {need}
                  </button>
                ))}
              </div>
            </div>

            <Button 
              onClick={generateResourceMatches}
              disabled={!zipCode || selectedNeeds.length === 0 || isGeneratingMatches}
              className="w-full bg-teal-600"
            >
              {isGeneratingMatches ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Finding resources...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Find My Resources
                </>
              )}
            </Button>
          </div>

          {/* AI Recommendations */}
          {aiRecommendations && aiRecommendations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-4"
            >
              <h4 className="font-semibold text-gray-900">📍 Resources Found Near {zipCode}:</h4>
              {aiRecommendations.map((resource, idx) => (
                <div key={idx} className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
                  <h5 className="font-semibold text-teal-900">{resource.name}</h5>
                  <p className="text-sm text-teal-800 mt-1">{resource.description}</p>
                  <div className="mt-3 space-y-1 text-xs text-teal-700">
                    <p><strong>Contact:</strong> {resource.contact}</p>
                    <p><strong>Eligibility:</strong> {resource.eligibility}</p>
                    {resource.application_link && (
                      <a href={resource.application_link} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline block mt-2">
                        → Apply Here
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </GraceCard>

        {/* Internet Assistance Request */}
        <GraceCard className="mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Phone className="w-6 h-6 text-purple-600" />
            Request Direct Assistance
          </h3>
          <p className="text-gray-600 mb-6">
            Need help with ACP/Lifeline applications or mobile hotspot access? We're here to help.
          </p>
          <div className="flex gap-3">
            <Button 
              onClick={() => setShowAssistanceForm(!showAssistanceForm)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Request Assistance
            </Button>
            <Button asChild variant="outline">
              <a href="/GraceChat">
                Chat with Grace
              </a>
            </Button>
          </div>

          {showAssistanceForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg"
            >
              <h4 className="font-semibold text-purple-900 mb-4">Assistance Request Form</h4>
              <div className="space-y-3">
                <Input
                  placeholder="Your Name *"
                  value={assistanceData.name}
                  onChange={(e) => setAssistanceData({...assistanceData, name: e.target.value})}
                />
                <Input
                  type="email"
                  placeholder="Email *"
                  value={assistanceData.email}
                  onChange={(e) => setAssistanceData({...assistanceData, email: e.target.value})}
                />
                <Input
                  type="tel"
                  placeholder="Phone Number"
                  value={assistanceData.phone}
                  onChange={(e) => setAssistanceData({...assistanceData, phone: e.target.value})}
                />
                <Input
                  placeholder="ZIP Code *"
                  value={assistanceData.zip}
                  onChange={(e) => setAssistanceData({...assistanceData, zip: e.target.value})}
                />
                <select
                  value={assistanceData.assistance_type}
                  onChange={(e) => setAssistanceData({...assistanceData, assistance_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                >
                  <option value="ACP">ACP Application Help</option>
                  <option value="Lifeline">Lifeline Program Help</option>
                  <option value="Hotspot">Mobile Hotspot Request</option>
                  <option value="Other">Other</option>
                </select>
                <textarea
                  placeholder="Describe your needs..."
                  value={assistanceData.description}
                  onChange={(e) => setAssistanceData({...assistanceData, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
                <Button
                  onClick={() => submitAssistance.mutate(assistanceData)}
                  disabled={!assistanceData.name || !assistanceData.email || !assistanceData.zip || submitAssistance.isLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {submitAssistance.isLoading ? 'Submitting...' : 'Submit Request'}
                </Button>
              </div>
            </motion.div>
          )}
        </GraceCard>

        {/* Public WiFi Spots */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Common Free WiFi Spots</h3>

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