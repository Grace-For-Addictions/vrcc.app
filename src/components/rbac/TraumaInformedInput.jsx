import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { enforceLanguage, LANGUAGE_RULES } from './PermissionHelper';
import { AlertCircle } from 'lucide-react';

// Input component with real-time language enforcement
export function TraumaInformedInput({ value, onChange, userRole, ...props }) {
  const [warning, setWarning] = useState(null);

  const handleChange = (e) => {
    const inputValue = e.target.value;
    
    // Check for prohibited terms
    const lowerValue = inputValue.toLowerCase();
    const foundProhibited = LANGUAGE_RULES.prohibited_terms.find(term => 
      lowerValue.includes(term)
    );
    
    if (foundProhibited) {
      const replacement = LANGUAGE_RULES.replacement_map[foundProhibited];
      setWarning(`Consider using "${replacement}" instead of "${foundProhibited}"`);
    } else {
      setWarning(null);
    }
    
    onChange(e);
  };

  return (
    <div className="space-y-1">
      <Input {...props} value={value} onChange={handleChange} />
      {warning && (
        <div className="flex items-center gap-2 text-xs text-amber-600">
          <AlertCircle className="w-3 h-3" />
          <span>{warning}</span>
        </div>
      )}
    </div>
  );
}

export function TraumaInformedTextarea({ value, onChange, userRole, ...props }) {
  const [warning, setWarning] = useState(null);

  const handleChange = (e) => {
    const inputValue = e.target.value;
    
    const lowerValue = inputValue.toLowerCase();
    const foundProhibited = LANGUAGE_RULES.prohibited_terms.find(term => 
      lowerValue.includes(term)
    );
    
    if (foundProhibited) {
      const replacement = LANGUAGE_RULES.replacement_map[foundProhibited];
      setWarning(`Consider using "${replacement}" instead of "${foundProhibited}"`);
    } else {
      setWarning(null);
    }
    
    onChange(e);
  };

  return (
    <div className="space-y-1">
      <Textarea {...props} value={value} onChange={handleChange} />
      {warning && (
        <div className="flex items-center gap-2 text-xs text-amber-600">
          <AlertCircle className="w-3 h-3" />
          <span>{warning}</span>
        </div>
      )}
    </div>
  );
}