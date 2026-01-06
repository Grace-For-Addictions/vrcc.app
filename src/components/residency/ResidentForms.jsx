import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  FileText, CheckCircle, Clock, AlertCircle,
  Save, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import GraceCard from '@/components/common/GraceCard';

export default function ResidentForms({ residentProfile, house }) {
  const [selectedForm, setSelectedForm] = useState(null);
  const [responses, setResponses] = useState({});
  const queryClient = useQueryClient();

  const { data: forms } = useQuery({
    queryKey: ['residentForms', house?.id],
    queryFn: async () => {
      const houseForms = await base44.entities.ResidentForm.filter({ 
        house_id: house.id,
        is_active: true
      });
      const orgForms = await base44.entities.ResidentForm.filter({ 
        house_id: null,
        is_active: true
      });
      return [...houseForms, ...orgForms];
    },
    enabled: !!house,
    initialData: []
  });

  const { data: myResponses } = useQuery({
    queryKey: ['myFormResponses', residentProfile.user_email],
    queryFn: () => base44.entities.ResidentFormResponse.filter({ 
      resident_email: residentProfile.user_email 
    }),
    initialData: []
  });

  const submitForm = useMutation({
    mutationFn: (data) => base44.entities.ResidentFormResponse.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['myFormResponses']);
      setSelectedForm(null);
      setResponses({});
    }
  });

  const handleFieldChange = (fieldName, value) => {
    setResponses(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = () => {
    submitForm.mutate({
      form_id: selectedForm.id,
      resident_email: residentProfile.user_email,
      responses: responses,
      submitted_date: new Date().toISOString()
    });
  };

  const completedFormIds = myResponses.map(r => r.form_id);

  const priorityColors = {
    urgent: 'bg-red-100 text-red-700 border-red-300',
    high: 'bg-orange-100 text-orange-700 border-orange-300',
    normal: 'bg-blue-100 text-blue-700 border-blue-300',
    low: 'bg-gray-100 text-gray-700 border-gray-300'
  };

  return (
    <div className="space-y-6">
      <GraceCard>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-teal-600" />
          Available Forms
        </h3>
        <div className="space-y-3">
          {forms.map((form, idx) => {
            const isCompleted = completedFormIds.includes(form.id);
            return (
              <motion.div
                key={form.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`p-4 rounded-xl border ${priorityColors[form.priority]} ${
                  isCompleted ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{form.form_title}</h4>
                      {isCompleted && <CheckCircle className="w-4 h-4 text-green-600" />}
                      {form.priority === 'urgent' && !isCompleted && (
                        <Badge className="bg-red-600 text-white animate-pulse">Urgent</Badge>
                      )}
                    </div>
                    <p className="text-sm mt-1">{form.form_description}</p>
                    {form.due_date && (
                      <p className="text-xs mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Due: {new Date(form.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setSelectedForm(form)}
                    disabled={isCompleted}
                    variant={isCompleted ? 'outline' : 'default'}
                    className={!isCompleted ? 'bg-teal-600 hover:bg-teal-700' : ''}
                  >
                    {isCompleted ? 'Completed' : 'Fill Out'}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </GraceCard>

      {/* Form Dialog */}
      <Dialog open={!!selectedForm} onOpenChange={() => setSelectedForm(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedForm?.form_title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {selectedForm?.form_fields?.map((field, idx) => (
              <div key={idx}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.field_name} {field.required && <span className="text-red-600">*</span>}
                </label>
                {field.field_type === 'text' && (
                  <Input
                    value={responses[field.field_name] || ''}
                    onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
                  />
                )}
                {field.field_type === 'textarea' && (
                  <Textarea
                    value={responses[field.field_name] || ''}
                    onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
                    rows={4}
                  />
                )}
                {field.field_type === 'select' && (
                  <select
                    value={responses[field.field_name] || ''}
                    onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select...</option>
                    {field.options?.map((opt, i) => (
                      <option key={i} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
            <Button
              onClick={handleSubmit}
              disabled={submitForm.isPending}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              {submitForm.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Submit Form
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}