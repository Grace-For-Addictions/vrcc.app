import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  DollarSign, CreditCard, CheckCircle, Clock,
  AlertCircle, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GraceCard from '@/components/common/GraceCard';

export default function PaymentsBilling({ residentProfile, house }) {
  const { data: invoices } = useQuery({
    queryKey: ['residentInvoices', residentProfile.user_email],
    queryFn: () => base44.entities.ResidentInvoice.filter({ 
      resident_email: residentProfile.user_email 
    }, '-due_date', 20),
    initialData: []
  });

  const currentBalance = residentProfile.current_balance || 0;
  const overdueInvoices = invoices.filter(inv => inv.status === 'overdue');
  const pendingInvoices = invoices.filter(inv => inv.status === 'pending');

  const statusColors = {
    paid: 'bg-green-100 text-green-700 border-green-200',
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    overdue: 'bg-red-100 text-red-700 border-red-200',
    processing: 'bg-blue-100 text-blue-700 border-blue-200'
  };

  const statusIcons = {
    paid: <CheckCircle className="w-4 h-4" />,
    pending: <Clock className="w-4 h-4" />,
    overdue: <AlertCircle className="w-4 h-4" />,
    processing: <Clock className="w-4 h-4" />
  };

  return (
    <div className="space-y-6">
      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GraceCard className="text-center">
          <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <h3 className={`text-3xl font-bold ${currentBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
            ${Math.abs(currentBalance).toFixed(2)}
          </h3>
          <p className="text-gray-600 mt-1">
            {currentBalance > 0 ? 'Current Balance Due' : 'Paid in Full'}
          </p>
        </GraceCard>

        <GraceCard className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-amber-500" />
          <h3 className="text-3xl font-bold text-amber-700">{overdueInvoices.length}</h3>
          <p className="text-gray-600 mt-1">Overdue Invoices</p>
        </GraceCard>

        <GraceCard className="text-center">
          <Clock className="w-12 h-12 mx-auto mb-3 text-blue-500" />
          <h3 className="text-3xl font-bold text-blue-700">{pendingInvoices.length}</h3>
          <p className="text-gray-600 mt-1">Pending Payments</p>
        </GraceCard>
      </div>

      {/* AI Budgeting Insights */}
      <GraceCard>
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-teal-600" />
          AI Budgeting Assistant
        </h3>
        <div className="p-4 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg border border-teal-200">
          <p className="text-sm text-gray-700">
            Based on your program timeline, you have approximately {Math.ceil((90 - (Date.now() - new Date(residentProfile.intake_date)) / (1000 * 60 * 60 * 24)) / 30)} months remaining. 
            Projected total: ${(currentBalance + (pendingInvoices.length * 600)).toFixed(2)}. 
            Consider setting up automatic payments to avoid late fees! 💡
          </p>
        </div>
      </GraceCard>

      {/* Invoice History */}
      <GraceCard>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice History</h3>
        <div className="space-y-3">
          {invoices.map((invoice, idx) => (
            <motion.div
              key={invoice.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-4 rounded-xl border ${statusColors[invoice.status]} flex items-start justify-between`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {statusIcons[invoice.status]}
                </div>
                <div>
                  <h4 className="font-semibold">{invoice.description}</h4>
                  <p className="text-sm mt-1">Invoice #{invoice.invoice_number}</p>
                  <p className="text-xs mt-1 opacity-75">
                    Due: {new Date(invoice.due_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">${invoice.amount.toFixed(2)}</p>
                {invoice.status === 'pending' && (
                  <Button size="sm" className="mt-2 bg-teal-600 hover:bg-teal-700">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay Now
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </GraceCard>
    </div>
  );
}