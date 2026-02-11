import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Users, Heart, MessageCircle, 
  Check, X, Clock, Star, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';
import GraceChatWidget from '@/components/chat/GraceChatWidget';
import confetti from 'canvas-confetti';

const pathways = [
  { id: 'substance_use', label: 'Substance Use Recovery', icon: '🌱' },
  { id: 'mental_health', label: 'Mental Health', icon: '🧠' },
  { id: 'justice_involved', label: 'Justice-Involved', icon: '⚖️' },
  { id: 'family_ally', label: 'Family/Ally', icon: '👨‍👩‍👧' },
  { id: 'youth', label: 'Youth (18-25)', icon: '🌟' }
];

const topics = [
  { id: 'early_recovery', label: 'Early Recovery (0-1 year)' },
  { id: 'long_term', label: 'Long-Term Recovery' },
  { id: 'employment', label: 'Finding Work' },
  { id: 'housing', label: 'Housing Challenges' },
  { id: 'relationships', label: 'Rebuilding Relationships' },
  { id: 'parenting', label: 'Parenting in Recovery' },
  { id: 'grief', label: 'Grief & Loss' },
  { id: 'anxiety', label: 'Anxiety/Depression' }
];

function MatchRequestForm({ onSubmit, isSubmitting }) {
  const [matchType, setMatchType] = useState('peer_buddy');
  const [selectedPathways, setSelectedPathways] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handlePathwayToggle = (id) => {
    setSelectedPathways(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleTopicToggle = (id) => {
    setSelectedTopics(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    onSubmit({
      match_type: matchType,
      pathways: selectedPathways,
      topics: selectedTopics,
      is_anonymous: isAnonymous,
      status: 'pending'
    });
  };

  return (
    <GraceCard>
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Cultivate a Connection</h3>

      {/* Match Type */}
      <div className="mb-6">
        <label className="text-sm font-medium text-gray-700 mb-3 block">What kind of tending partnership?</label>
        <RadioGroup value={matchType} onValueChange={setMatchType}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Label
              htmlFor="peer_buddy"
              className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                matchType === 'peer_buddy' ? 'border-teal-500 bg-teal-50' : 'border-gray-100 hover:border-teal-200'
              }`}
            >
              <RadioGroupItem value="peer_buddy" id="peer_buddy" />
              <div>
                <div className="font-medium">A fellow gardener</div>
                <div className="text-sm text-gray-500">Tending a similar plot</div>
              </div>
            </Label>
            <Label
              htmlFor="anonymous_grace"
              className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                matchType === 'anonymous_grace' ? 'border-teal-500 bg-teal-50' : 'border-gray-100 hover:border-teal-200'
              }`}
            >
              <RadioGroupItem value="anonymous_grace" id="anonymous_grace" />
              <div>
                <div className="font-medium">Grace Match</div>
                <div className="text-sm text-gray-500">Nurturing one-on-one connections in your garden</div>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Pathways */}
      <div className="mb-6">
        <label className="text-sm font-medium text-gray-700 mb-3 block">Your recovery pathway(s)</label>
        <div className="flex flex-wrap gap-2">
          {pathways.map((pathway) => (
            <motion.button
              key={pathway.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePathwayToggle(pathway.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
                selectedPathways.includes(pathway.id) 
                  ? 'border-teal-500 bg-teal-50 text-teal-700' 
                  : 'border-gray-200 hover:border-teal-200'
              }`}
            >
              <span>{pathway.icon}</span>
              <span className="text-sm font-medium">{pathway.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Topics */}
      <div className="mb-6">
        <label className="text-sm font-medium text-gray-700 mb-3 block">Topics you'd like to discuss</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {topics.map((topic) => (
            <motion.button
              key={topic.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleTopicToggle(topic.id)}
              className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                selectedTopics.includes(topic.id) 
                  ? 'border-teal-500 bg-teal-50 text-teal-700' 
                  : 'border-gray-200 hover:border-teal-200'
              }`}
            >
              {topic.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Anonymous Toggle */}
      <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 rounded-xl">
        <Checkbox 
          id="anonymous" 
          checked={isAnonymous}
          onCheckedChange={setIsAnonymous}
        />
        <Label htmlFor="anonymous" className="cursor-pointer">
          <div className="font-medium">Keep me anonymous</div>
          <div className="text-sm text-gray-500">Your name won't be shared until you're ready</div>
        </Label>
      </div>

      <Button 
        onClick={handleSubmit}
        disabled={isSubmitting || selectedPathways.length === 0}
        className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700"
      >
        <Sparkles className="w-5 h-5 mr-2" />
        {isSubmitting ? 'Finding your match...' : 'Find My Grace Match'}
      </Button>
    </GraceCard>
  );
}

function MatchCard({ match, onAccept, onDecline }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
    >
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xl">
          {match.is_anonymous ? '?' : '👤'}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-900">
              {match.is_anonymous ? 'Anonymous Grace Match' : 'Recovery Buddy'}
            </h4>
            <Badge className="bg-amber-100 text-amber-700">
              <Clock className="w-3 h-3 mr-1" />
              Pending
            </Badge>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-3">
            {match.pathways?.map((p) => (
              <Badge key={p} variant="outline">{p.replace(/_/g, ' ')}</Badge>
            ))}
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button size="sm" onClick={() => onAccept(match)} className="bg-teal-600 hover:bg-teal-700">
              <Check className="w-4 h-4 mr-1" /> Accept
            </Button>
            <Button size="sm" variant="outline" onClick={() => onDecline(match)}>
              <X className="w-4 h-4 mr-1" /> Decline
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function PeerMatching() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const { data: matches } = useQuery({
    queryKey: ['peerMatches'],
    queryFn: async () => {
      if (!user) return [];
      return base44.entities.PeerMatch.filter({ user1_id: user.id });
    },
    enabled: !!user,
    initialData: []
  });

  const createMatch = useMutation({
    mutationFn: async (matchData) => {
      return base44.entities.PeerMatch.create({
        ...matchData,
        user1_id: user?.id
      });
    },
    onSuccess: () => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      setShowForm(false);
      queryClient.invalidateQueries(['peerMatches']);
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <GraceHeader 
          title="Grace Match"
          subtitle="Connect with fellow gardeners tending similar plots. Cultivate support through our AI-guided Grace Match."
          icon={Sparkles}
        />

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm">
            <Shield className="w-5 h-5 text-teal-500" />
            <span className="text-sm text-gray-600">Cultivated with Care & Trust</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm">
            <Heart className="w-5 h-5 text-rose-500" />
            <span className="text-sm text-gray-600">Your Seed, Your Choice</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm">
            <Star className="w-5 h-5 text-amber-500" />
            <span className="text-sm text-gray-600">AI-Guided Cultivation</span>
          </div>
        </div>

        {/* Privacy Notice */}
        <GraceCard className="mb-8 bg-purple-50 border-purple-200">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-purple-900 mb-2">Your Garden, Your Privacy</h4>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• You tend your plot, deciding what to share and when</li>
                <li>• Connections flourish with mutual agreement</li>
                <li>• You can shift your garden anytime, no questions asked</li>
                <li>• Anonymous options protect your identity as you grow</li>
                <li>• Your contact information is only shared with your explicit permission</li>
              </ul>
            </div>
          </div>
        </GraceCard>

        {showForm ? (
          <MatchRequestForm 
            onSubmit={createMatch.mutate}
            isSubmitting={createMatch.isPending}
          />
        ) : (
          <GraceCard gradient className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
            >
              <Sparkles className="w-16 h-16 mx-auto text-teal-500 mb-4" />
            </motion.div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Match Request Submitted! 🎉
            </h3>
            <p className="text-gray-600 mb-6">
              We're finding the perfect recovery buddy for you. You'll be notified when we find a match!
            </p>
            <Button onClick={() => setShowForm(true)} variant="outline">
              Request Another Match
            </Button>
          </GraceCard>
        )}

        {/* Active Matches */}
        {matches.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Your Matches</h2>
            <div className="space-y-4">
              {matches.map((match) => (
                <MatchCard 
                  key={match.id}
                  match={match}
                  onAccept={() => {}}
                  onDecline={() => {}}
                />
              ))}
            </div>
          </section>
        )}

        {/* How It Works */}
        <section className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">How Grace Matching Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GraceCard>
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold mb-4">1</div>
              <h3 className="font-semibold text-gray-900 mb-2">Share Your Journey</h3>
              <p className="text-gray-600 text-sm">Tell us about your recovery pathway and what you're looking for in a peer connection.</p>
            </GraceCard>
            <GraceCard>
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold mb-4">2</div>
              <h3 className="font-semibold text-gray-900 mb-2">AI Finds Your Match</h3>
              <p className="text-gray-600 text-sm">Our AI considers shared experiences, interests, and goals to find compatible peers.</p>
            </GraceCard>
            <GraceCard>
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold mb-4">3</div>
              <h3 className="font-semibold text-gray-900 mb-2">Connect & Grow</h3>
              <p className="text-gray-600 text-sm">Start chatting, meet virtually, and build a supportive connection on your terms.</p>
            </GraceCard>
          </div>
        </section>
      </div>

      <GraceChatWidget />
    </div>
  );
}