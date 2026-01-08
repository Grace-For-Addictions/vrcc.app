import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, AlertCircle, Calendar, Loader2, Zap } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import GraceCard from '@/components/common/GraceCard';
import { Badge } from '@/components/ui/badge';

export default function PredictiveAnalytics({ sessions, outcomes, grants }) {
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generatePredictions();
  }, [sessions.length, outcomes.length, grants.length]);

  const generatePredictions = async () => {
    setLoading(true);
    try {
      // Calculate historical trends
      const monthlyParticipants = {};
      const monthlyOutcomes = {};
      const monthlyFunding = {};

      sessions.forEach(s => {
        const month = new Date(s.activity_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        monthlyParticipants[month] = (monthlyParticipants[month] || 0) + 1;
      });

      outcomes.forEach(o => {
        const month = new Date(o.outcome_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        monthlyOutcomes[month] = (monthlyOutcomes[month] || 0) + 1;
      });

      grants.forEach(g => {
        if (g.status === 'awarded') {
          const month = new Date(g.decision_date || g.submission_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
          monthlyFunding[month] = (monthlyFunding[month] || 0) + (g.amount_awarded || 0);
        }
      });

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a predictive analytics AI for Grace For Addictions analyzing trends to forecast future needs and impacts.

HISTORICAL DATA (last 6 months):
- Total service events: ${sessions.length}
- Total outcomes: ${outcomes.length}
- Grants awarded: ${grants.filter(g => g.status === 'awarded').length}
- Total funding secured: $${grants.reduce((sum, g) => sum + (g.amount_awarded || 0), 0).toLocaleString()}
- Unique participants: ${new Set(sessions.map(s => s.contact_email || s.contact_name)).size}
- Average events per month: ${Math.round(sessions.length / 6)}

TRENDS:
- Monthly participants: ${JSON.stringify(monthlyParticipants)}
- Monthly outcomes: ${JSON.stringify(monthlyOutcomes)}

Generate:
1. 6-month service volume forecast (monthly participant projections)
2. Funding needs forecast (based on growth trajectory)
3. Outcome projections (expected outcomes based on current ratios)
4. Policy impact predictions (2026 Iowa HF 1038, opioid settlement impact)
5. Risk factors (funding gaps, capacity constraints)
6. Opportunities (expansion potential, partnership leverage)

Be data-driven, realistic, and actionable.`,
        response_json_schema: {
          type: "object",
          properties: {
            service_forecast: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  month: { type: "string" },
                  projected_participants: { type: "number" },
                  confidence: { type: "string" }
                }
              }
            },
            funding_forecast: {
              type: "object",
              properties: {
                next_6_months_need: { type: "number" },
                breakdown: { type: "array", items: { type: "object", properties: { category: { type: "string" }, amount: { type: "number" } } } }
              }
            },
            outcome_projections: {
              type: "object",
              properties: {
                housing_stability: { type: "number" },
                employment_gained: { type: "number" },
                crisis_diversion: { type: "number" },
                cost_avoidance: { type: "number" }
              }
            },
            policy_impacts: { type: "array", items: { type: "string" } },
            risks: { type: "array", items: { type: "string" } },
            opportunities: { type: "array", items: { type: "string" } }
          }
        }
      });

      setPredictions(response);
    } catch (error) {
      console.error('Failed to generate predictions', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <GraceCard className="text-center py-12">
        <Loader2 className="w-12 h-12 mx-auto text-teal-600 animate-spin mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating Predictive Analytics...</h3>
        <p className="text-gray-600">Analyzing trends and forecasting future impacts</p>
      </GraceCard>
    );
  }

  if (!predictions) return null;

  return (
    <div className="space-y-6">
      <GraceCard gradient>
        <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Zap className="w-6 h-6 text-amber-600" />
          AI Predictive Analytics & Forecasting
        </h3>
        <p className="text-gray-700">Data-driven projections for strategic planning and policy advocacy</p>
      </GraceCard>

      {/* Service Volume Forecast */}
      <GraceCard>
        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-teal-600" />
          6-Month Service Volume Forecast
        </h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={predictions.service_forecast}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="projected_participants" stroke="#14b8a6" strokeWidth={3} dot={{ r: 5 }} name="Projected Participants" />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 flex flex-wrap gap-2">
          {predictions.service_forecast?.map((month, i) => (
            <Badge key={i} variant="outline">
              {month.month}: {month.projected_participants} ({month.confidence} confidence)
            </Badge>
          ))}
        </div>
      </GraceCard>

      {/* Funding Needs Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GraceCard>
          <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Funding Needs Forecast
          </h4>
          <div className="text-center mb-6">
            <div className="text-5xl font-bold text-green-700 mb-2">
              ${predictions.funding_forecast?.next_6_months_need?.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600">Projected Need (Next 6 Months)</p>
          </div>
          <div className="space-y-2">
            {predictions.funding_forecast?.breakdown?.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-900">{item.category}</span>
                <span className="text-sm text-green-700 font-bold">${item.amount?.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </GraceCard>

        <GraceCard>
          <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Projected Outcomes (6 Months)
          </h4>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-700 mb-1">{predictions.outcome_projections?.housing_stability}</div>
              <div className="text-xs text-gray-600">Housing Stability Outcomes</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-700 mb-1">{predictions.outcome_projections?.employment_gained}</div>
              <div className="text-xs text-gray-600">Employment Placements</div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-700 mb-1">{predictions.outcome_projections?.crisis_diversion}</div>
              <div className="text-xs text-gray-600">Crisis Diversions</div>
            </div>
            <div className="p-4 bg-teal-50 rounded-lg">
              <div className="text-2xl font-bold text-teal-700 mb-1">
                ${predictions.outcome_projections?.cost_avoidance?.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">Projected Cost Avoidance</div>
            </div>
          </div>
        </GraceCard>
      </div>

      {/* Policy Impacts */}
      <GraceCard>
        <h4 className="font-bold text-gray-900 mb-4">2026 Iowa Policy Impact Predictions</h4>
        <div className="space-y-2">
          {predictions.policy_impacts?.map((impact, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900"
            >
              {impact}
            </motion.div>
          ))}
        </div>
      </GraceCard>

      {/* Risks & Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GraceCard>
          <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            Risk Factors
          </h4>
          <ul className="space-y-2">
            {predictions.risks?.map((risk, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-red-600 mt-0.5">⚠️</span>
                {risk}
              </li>
            ))}
          </ul>
        </GraceCard>

        <GraceCard>
          <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Growth Opportunities
          </h4>
          <ul className="space-y-2">
            {predictions.opportunities?.map((opp, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-green-600 mt-0.5">✨</span>
                {opp}
              </li>
            ))}
          </ul>
        </GraceCard>
      </div>
    </div>
  );
}