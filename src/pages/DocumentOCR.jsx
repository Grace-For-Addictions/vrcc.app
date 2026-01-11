import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import RoleGuard from '@/components/navigation/RoleGuard';
import { useMutation } from '@tanstack/react-query';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import GraceHeader from '@/components/common/GraceHeader';
import { toast } from 'sonner';

export default function DocumentOCR() {
  const [file, setFile] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [progress, setProgress] = useState(0);

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      setProgress(20);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProgress(50);
      
      // Define intake form schema
      const schema = {
        type: "object",
        properties: {
          full_name: { type: "string" },
          date_of_birth: { type: "string" },
          phone: { type: "string" },
          email: { type: "string" },
          emergency_contact_name: { type: "string" },
          emergency_contact_phone: { type: "string" },
          emergency_contact_relationship: { type: "string" },
          gender: { type: "string" },
          pronouns: { type: "string" },
          ethnicity: { type: "string" },
          race: { type: "string" },
          housing_status: { type: "string" },
          education: { type: "string" },
          legal_status: { type: "string" },
          drivers_license: { type: "string" },
          transportation: { type: "string" }
        }
      };

      setProgress(70);
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: schema
      });

      setProgress(100);
      
      if (result.status === 'success') {
        return result.output;
      } else {
        throw new Error(result.details || 'OCR extraction failed');
      }
    },
    onSuccess: (data) => {
      setExtractedData(data);
      toast.success('Document data extracted successfully!');
    },
    onError: (error) => {
      toast.error(`Extraction failed: ${error.message}`);
      setProgress(0);
    }
  });

  const syncToBeepurple = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('syncToBeepurple', {
        endpoint: '/participants/create',
        data: {
          contact_name: data.full_name,
          date_of_birth: data.date_of_birth,
          phone: data.phone,
          email: data.email,
          emergency_contact: {
            name: data.emergency_contact_name,
            phone: data.emergency_contact_phone,
            relationship: data.emergency_contact_relationship
          },
          demographics: {
            gender: data.gender,
            pronouns: data.pronouns,
            ethnicity: data.ethnicity,
            race: data.race,
            housing_status: data.housing_status,
            education: data.education,
            legal_status: data.legal_status,
            drivers_license: data.drivers_license,
            transportation: data.transportation
          }
        }
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Data synced to BeePurple 5CRM!');
      setExtractedData(null);
      setFile(null);
      setProgress(0);
    },
    onError: (error) => {
      toast.error(`Sync failed: ${error.message}`);
    }
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setExtractedData(null);
      setProgress(0);
    }
  };

  return (
    <RoleGuard allowedRoles={['program_staff']} pageName="Document OCR">
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <GraceHeader
          title="Document OCR & Data Extraction"
          subtitle="Upload intake forms, IDs, or documents to automatically extract and sync data"
          icon={FileText}
        />

        <Card className="p-6 mb-6">
          <div className="space-y-6">
            {/* Upload Section */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Upload Document
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Supports PDF, PNG, JPG, JPEG files
              </p>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button asChild>
                  <span className="cursor-pointer">Choose File</span>
                </Button>
              </label>
              {file && (
                <p className="mt-3 text-sm text-gray-700">
                  Selected: <strong>{file.name}</strong>
                </p>
              )}
            </div>

            {/* Extract Button */}
            {file && !extractedData && (
              <Button
                onClick={() => uploadMutation.mutate(file)}
                disabled={uploadMutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Extracting Data...
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5 mr-2" />
                    Extract Data from Document
                  </>
                )}
              </Button>
            )}

            {/* Progress Bar */}
            {uploadMutation.isPending && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-gray-600 text-center">
                  {progress < 30 && "Uploading document..."}
                  {progress >= 30 && progress < 60 && "Processing with AI OCR..."}
                  {progress >= 60 && "Extracting structured data..."}
                </p>
              </div>
            )}

            {/* Extracted Data Preview */}
            {extractedData && (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <h3 className="text-lg font-semibold text-green-900">
                    Data Extracted Successfully
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {Object.entries(extractedData).map(([key, value]) => (
                    <div key={key} className="bg-white p-3 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        {key.replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {value || 'N/A'}
                      </p>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => syncToBeepurple.mutate(extractedData)}
                  disabled={syncToBeepurple.isPending}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  {syncToBeepurple.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Syncing to BeePurple...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Sync to BeePurple 5CRM
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <FileText className="w-8 h-8 text-purple-600 mb-2" />
            <h4 className="font-semibold text-gray-900 mb-1">Smart OCR</h4>
            <p className="text-sm text-gray-600">
              AI-powered extraction from any document format
            </p>
          </Card>
          <Card className="p-4">
            <CheckCircle className="w-8 h-8 text-green-600 mb-2" />
            <h4 className="font-semibold text-gray-900 mb-1">Auto-Fill</h4>
            <p className="text-sm text-gray-600">
              Automatically populate BeePurple fields
            </p>
          </Card>
          <Card className="p-4">
            <AlertCircle className="w-8 h-8 text-orange-600 mb-2" />
            <h4 className="font-semibold text-gray-900 mb-1">Error Reduction</h4>
            <p className="text-sm text-gray-600">
              Eliminate manual data entry mistakes
            </p>
          </Card>
        </div>
      </div>
    </div>
    </RoleGuard>
  );
}