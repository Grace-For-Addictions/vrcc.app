import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

export default function GFAPlanExport({ plan, formData, sections, onClose }) {
  const generatePDF = () => {
    const doc = new jsPDF();
    let y = 20;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(20, 184, 166); // Teal
    doc.text('My GFA Plan', 20, y);
    y += 10;

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Grace-Filled Action Plan • Grace For Addictions', 20, y);
    y += 15;

    doc.setTextColor(0);
    doc.text(`Created: ${new Date(plan.created_date).toLocaleDateString()}`, 20, y);
    y += 5;
    doc.text(`Last Updated: ${new Date(plan.last_touched_date).toLocaleDateString()}`, 20, y);
    y += 15;

    // Sections
    sections.forEach((section, idx) => {
      const content = formData[`section_${section.key}`];
      if (!content?.trim()) return;

      // Check if we need a new page
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(20, 184, 166);
      doc.text(section.title, 20, y);
      y += 8;

      doc.setFontSize(10);
      doc.setTextColor(0);
      const lines = doc.splitTextToSize(content, 170);
      lines.forEach(line => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 20, y);
        y += 5;
      });
      y += 10;
    });

    // Grace Notes
    if (formData.grace_notes?.trim()) {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(20, 184, 166);
      doc.text('Grace Notes', 20, y);
      y += 8;

      doc.setFontSize(10);
      doc.setTextColor(0);
      const lines = doc.splitTextToSize(formData.grace_notes, 170);
      lines.forEach(line => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 20, y);
        y += 5;
      });
    }

    // Footer
    doc.addPage();
    y = 20;
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text('Remember:', 20, y);
    y += 10;
    doc.setFontSize(10);
    doc.text('• This plan is yours—update it whenever feels right', 20, y);
    y += 7;
    doc.text('• There are no deadlines, only gentle invitations', 20, y);
    y += 7;
    doc.text('• Every small step is worth celebrating', 20, y);
    y += 7;
    doc.text('• You are worthy of grace, always', 20, y);
    y += 15;

    doc.setTextColor(20, 184, 166);
    doc.text('💚 Grace For Addictions Virtual Recovery Community Center', 20, y);

    // Save
    doc.save(`My-GFA-Plan-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Your plan has been downloaded! 💚');
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Your GFA Plan</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Download a beautiful PDF copy of your Grace-Filled Action Plan. This is your personal 
            document—keep it safe, share it with trusted supporters, or print it for reflection.
          </p>

          <div className="bg-teal-50 border border-teal-100 rounded-lg p-4">
            <p className="text-sm text-teal-800">
              <strong>Privacy Note:</strong> This PDF will contain all the content you've written in your plan. 
              Only share it with people you trust.
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={generatePDF} className="flex-1 bg-teal-600 hover:bg-teal-700 gap-2">
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
            <Button variant="ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}