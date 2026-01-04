import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Home, MapPin, Phone, Globe, Users, 
  Check, DollarSign, Calendar, Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';
import GraceChatWidget from '@/components/chat/GraceChatWidget';

// Sample residencies data (would come from database)
const sampleResidencies = [
  {
    id: 1,
    name: "Hope House Recovery Residence",
    description: "A supportive sober living environment for men in early recovery. Peer-led house with structured programming.",
    address: "123 Recovery Lane",
    city: "Des Moines",
    county: "Polk",
    phone: "(515) 555-0123",
    website: "https://example.com",
    gender: "Men",
    capacity: 12,
    cost_range: "$500-700/month",
    amenities: ["Shared rooms", "Meals included", "Transportation", "Employment support", "12-step meetings"],
    accepts_medicaid: true,
    has_virtual_tour: true,
    image_url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800"
  },
  {
    id: 2,
    name: "Grace Women's Home",
    description: "Safe, nurturing recovery residence for women and women with children. Focus on healing and rebuilding families.",
    address: "456 Serenity Street",
    city: "Cedar Rapids",
    county: "Linn",
    phone: "(319) 555-0456",
    website: "https://example.com",
    gender: "Women",
    capacity: 8,
    cost_range: "$400-600/month",
    amenities: ["Private rooms", "Childcare", "Parenting classes", "Counseling", "Life skills"],
    accepts_medicaid: true,
    has_virtual_tour: true,
    image_url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800"
  },
  {
    id: 3,
    name: "New Beginnings Sober Living",
    description: "Co-ed recovery housing with emphasis on employment readiness and community integration.",
    address: "789 Hope Avenue",
    city: "Davenport",
    county: "Scott",
    phone: "(563) 555-0789",
    gender: "Co-ed",
    capacity: 16,
    cost_range: "$450-550/month",
    amenities: ["Shared rooms", "Job training", "GED classes", "Peer support", "Fitness room"],
    accepts_medicaid: false,
    has_virtual_tour: false,
    image_url: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800"
  }
];

function ResidencyCard({ residency }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow"
    >
      {residency.image_url && (
        <div className="h-48 overflow-hidden">
          <img 
            src={residency.image_url} 
            alt={residency.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{residency.name}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <MapPin className="w-4 h-4" />
              {residency.city}, {residency.county} County
            </div>
          </div>
          <Badge className="bg-teal-100 text-teal-700">
            {residency.gender}
          </Badge>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {residency.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {residency.capacity} beds
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            {residency.cost_range}
          </Badge>
          {residency.accepts_medicaid && (
            <Badge className="bg-green-100 text-green-700">Medicaid</Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-1 mb-4">
          {residency.amenities?.slice(0, 4).map((amenity, idx) => (
            <span key={idx} className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
              {amenity}
            </span>
          ))}
          {residency.amenities?.length > 4 && (
            <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
              +{residency.amenities.length - 4} more
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
          {residency.phone && (
            <Button asChild size="sm" variant="outline">
              <a href={`tel:${residency.phone}`}>
                <Phone className="w-4 h-4 mr-2" />
                Call
              </a>
            </Button>
          )}
          {residency.has_virtual_tour && (
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
              Virtual Tour
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function Residencies() {
  const [search, setSearch] = useState('');
  const [gender, setGender] = useState('all');
  const [county, setCounty] = useState('all');

  // Would fetch from database in production
  const residencies = sampleResidencies;

  const filteredResidencies = residencies.filter(r => {
    const matchesSearch = !search || 
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.city.toLowerCase().includes(search.toLowerCase());
    const matchesGender = gender === 'all' || r.gender === gender;
    const matchesCounty = county === 'all' || r.county === county;
    return matchesSearch && matchesGender && matchesCounty;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <GraceHeader 
          title="Recovery Residencies"
          subtitle="Safe, supportive sober living options across Iowa. Find your home base for healing."
          icon={Home}
        />

        {/* Filters */}
        <GraceCard className="mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by name or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-full"
              />
            </div>
            
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Men">Men</SelectItem>
                <SelectItem value="Women">Women</SelectItem>
                <SelectItem value="Co-ed">Co-ed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={county} onValueChange={setCounty}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="County" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Counties</SelectItem>
                <SelectItem value="Polk">Polk</SelectItem>
                <SelectItem value="Linn">Linn</SelectItem>
                <SelectItem value="Scott">Scott</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </GraceCard>

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResidencies.map((residency) => (
            <ResidencyCard key={residency.id} residency={residency} />
          ))}
        </div>

        {filteredResidencies.length === 0 && (
          <GraceCard className="text-center py-12">
            <Home className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-700">No residencies found</h3>
            <p className="text-gray-500 mt-1">Try adjusting your search or filters</p>
          </GraceCard>
        )}

        {/* Help Section */}
        <GraceCard gradient className="mt-12 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Need Help Finding Housing?</h3>
          <p className="text-gray-600 mb-6">
            AI Grace can help you find the right recovery residence based on your specific needs and location.
          </p>
          <Button asChild className="bg-teal-600 hover:bg-teal-700">
            <a href="/GraceChat">
              Chat with Grace
            </a>
          </Button>
        </GraceCard>
      </div>

      <GraceChatWidget />
    </div>
  );
}