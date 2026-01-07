import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Maximize, Camera, Grid3x3, AlertCircle, Lightbulb, Wind } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GraceCard from '@/components/common/GraceCard';

export default function ARGardenView({ garden, user }) {
  const [arMode, setArMode] = useState(false);
  const [deviceSupport, setDeviceSupport] = useState(true);
  const [ambientLight, setAmbientLight] = useState('day');
  const [groundingPrompt, setGroundingPrompt] = useState(null);

  useEffect(() => {
    // Check device AR capabilities
    const checkARSupport = () => {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      setDeviceSupport(isMobile);
    };
    checkARSupport();

    // Detect time of day for ambient adjustments
    const hour = new Date().getHours();
    setAmbientLight(hour >= 6 && hour < 18 ? 'day' : 'night');
  }, []);

  const activateGroundingPrompt = () => {
    const prompts = [
      {
        title: "5 Senses Grounding",
        instructions: [
          "Name 5 things you can see",
          "4 things you can touch",
          "3 things you can hear",
          "2 things you can smell",
          "1 thing you can taste"
        ],
        visual: "🌟 Notice each sense with gentle curiosity"
      },
      {
        title: "Breath & Roots",
        instructions: [
          "Feel your feet on the ground",
          "Imagine roots growing down",
          "Breathe in for 4 counts",
          "Hold for 4 counts",
          "Breathe out for 6 counts"
        ],
        visual: "🌱 You are rooted, you are safe"
      },
      {
        title: "Present Moment",
        instructions: [
          "Look around your space",
          "Find something beautiful",
          "Notice its colors and textures",
          "Say: 'I am here, I am now'",
          "Feel the ground supporting you"
        ],
        visual: "✨ This moment is enough"
      }
    ];
    setGroundingPrompt(prompts[Math.floor(Math.random() * prompts.length)]);
  };

  if (!deviceSupport) {
    return (
      <GraceCard>
        <AlertCircle className="w-12 h-12 mx-auto text-amber-600 mb-3" />
        <h4 className="text-center font-semibold text-gray-900 mb-2">AR Mode Coming Soon</h4>
        <p className="text-center text-gray-600 text-sm">
          AR features work best on mobile devices. Access this on your phone to visualize your garden in your space!
        </p>
      </GraceCard>
    );
  }

  return (
    <div className="space-y-6">
      <GraceCard gradient>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">AR Garden Mode</h3>
            <p className="text-sm text-gray-600">Bring your garden into your space</p>
          </div>
          <Button
            onClick={() => setArMode(!arMode)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Maximize className="w-4 h-4 mr-2" />
            {arMode ? 'Exit AR' : 'Enter AR'}
          </Button>
        </div>

        {arMode ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative h-96 bg-black rounded-xl overflow-hidden"
          >
            {/* AR Camera View Simulation */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Camera className="w-24 h-24 text-white/30" />
            </div>
            
            {/* AR Overlay Elements */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Grid overlay */}
              <Grid3x3 className="w-full h-full text-teal-400/20" />
              
              {/* Plants positioned in AR space */}
              {garden.plants_grown?.slice(0, 3).map((plant, idx) => (
                <motion.div
                  key={idx}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: idx * 0.3 }}
                  className="absolute"
                  style={{
                    left: `${20 + idx * 30}%`,
                    bottom: `${20 + Math.sin(idx) * 10}%`
                  }}
                >
                  <div className="text-6xl filter drop-shadow-lg">
                    {plant.plant_type === 'flower' ? '🌸' : plant.plant_type === 'tree' ? '🌳' : '🌱'}
                  </div>
                </motion.div>
              ))}

              {/* Ambient adjustments */}
              {ambientLight === 'night' && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-purple-900/80 text-purple-100">
                    🌙 Night Mode Active
                  </Badge>
                </div>
              )}
            </div>

            {/* AR Controls */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 px-4">
              <Button variant="outline" className="bg-white/90">
                <Lightbulb className="w-4 h-4 mr-2" />
                Place Plant
              </Button>
              <Button variant="outline" className="bg-white/90" onClick={activateGroundingPrompt}>
                <Wind className="w-4 h-4 mr-2" />
                Ground Now
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-12 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
            <Maximize className="w-16 h-16 mx-auto text-purple-600 mb-4" />
            <p className="text-gray-700 mb-4">
              Tap "Enter AR" to place your garden in your physical space
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge className="bg-purple-100 text-purple-700">Real-time plant placement</Badge>
              <Badge className="bg-pink-100 text-pink-700">Grounding overlays</Badge>
              <Badge className="bg-teal-100 text-teal-700">Ambient adaptation</Badge>
            </div>
          </div>
        )}
      </GraceCard>

      {/* Grounding Prompt Overlay */}
      {groundingPrompt && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setGroundingPrompt(null)}
        >
          <GraceCard className="max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-center text-teal-700 mb-4">
              {groundingPrompt.title}
            </h3>
            <div className="space-y-3 mb-6">
              {groundingPrompt.instructions.map((instruction, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.2 }}
                  className="flex items-center gap-3 p-3 bg-teal-50 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold">
                    {idx + 1}
                  </div>
                  <p className="text-gray-700">{instruction}</p>
                </motion.div>
              ))}
            </div>
            <div className="text-center p-4 bg-gradient-to-r from-teal-50 to-green-50 rounded-lg border border-teal-200">
              <p className="text-lg text-teal-800 font-medium">{groundingPrompt.visual}</p>
            </div>
            <Button
              onClick={() => setGroundingPrompt(null)}
              className="w-full mt-4 bg-teal-600 hover:bg-teal-700"
            >
              Complete
            </Button>
          </GraceCard>
        </motion.div>
      )}
    </div>
  );
}