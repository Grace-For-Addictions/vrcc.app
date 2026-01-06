import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, FileText, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GraceCard from '@/components/common/GraceCard';

export default function FormManagement({ user }) {
  const queryClient = useQueryClient();

  const { data: forms } = useQuery({
    queryKey: ['allForms'],
    queryFn: () => base44.entities.ResidentForm.list(),
    initialData: []
  });

  const { data: responses } = useQuery({
    queryKey: ['allResponses'],
    queryFn: () => base44.entities.ResidentFormResponse.list('-submitted_date', 100),
    initialData: []
  });

  const getResponseCount = (formId) => {
    return responses.filter(r => r.form_id === formId).length;
  };

  const priorityColors = {
    urgent: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    normal: 'bg-blue-100 text-blue-700',
    low: 'bg-gray-100 text-gray-700'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">Form Management</h3>
        <Button className="bg-teal-600 hover:bg-teal-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Form
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {forms.map((form, idx) => (
          <motion.div
            key={form.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <GraceCard>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 mb-2">{form.form_title}</h4>
                  <div className="flex items-center gap-2">
                    <Badge className={priorityColors[form.priority]}>
                      {form.priority}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {form.form_type}
                    </Badge>
                  </div>
                </div>
                <Button size="icon" variant="ghost">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-600 mb-4">{form.form_description}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {form.form_fields?.length || 0} fields
                </span>
                <span className="font-semibold text-teal-700">
                  {getResponseCount(form.id)} responses
                </span>
              </div>
            </GraceCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}