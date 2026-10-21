import React, { useState } from 'react';
import {
  X,
  Archive,
  Search,
  Filter,
  Download,
  Trash2,
  ExternalLink,
  ChevronRight,
  Clock,
  Tag,
} from 'lucide-react';
import { DakRecord } from '../types/index.ts';
import { formatPostalDate } from '../utils/dakUtils.ts';

interface DakHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: DakRecord[];
  onSelectRecord: (record: DakRecord) => void;
  onClearHistory: () => void;
  onDeleteRecord: (id: string) => void;
}

export const DakHistoryModal: React.FC<DakHistoryModalProps> = ({
  isOpen,
  onClose,
  records,
  onSelectRecord,
  onClearHistory,
  onDeleteRecord,
}) => {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  if (!isOpen) return null;

  const filtered = records.filter((r) => {
    const matchesSearch =
      r.docketNumber.toLowerCase().includes(search.toLowerCase()) ||
      (r.trackingNumber && r.trackingNumber.toLowerCase().includes(search.toLowerCase())) ||
      (r.customerName && r.customerName.toLowerCase().includes(search.toLowerCase())) ||
      r.originalText.toLowerCase().includes(search.toLowerCase()) ||
      r.summary.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = filterCategory === 'all' || r.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  const exportCSV = () => {
    const headers = [
      'Docket Number',
      'Date',
      'Category',
      'Tracking Number',
      'Customer',
      'Source Language',
      'Staff Language',
      'Urgency',
      'Status',
      'Model Used',
    ];
    const rows = records.map((r) => [
      `"${r.docketNumber}"`,
      `"${r.createdAt}"`,
      `"${r.category}"`,
      `"${r.trackingNumber || ''}"`,
      `"${r.customerName || ''}"`,
      `"${r.sourceLanguage}"`,
      `"${r.staffLanguage}"`,
      `"${r.urgency}"`,
      `"${r.status}"`,
      `"${r.modelUsed}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `IndiaPost_Dak_Register_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-gray-200 overflow-hidden my-8 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#b31317] to-[#8f0e13] px-6 py-4 text-white flex items-center justify-between border-b-2 border-[#ffcb05]">
          <div className="flex items-center gap-2.5">
            <Archive className="w-5 h-5 text-[#ffcb05]" />
            <div>
              <h3 className="font-bold text-lg">India Post Dak Register & Archive</h3>
              <p className="text-xs text-red-100">
                Official local log of translated customer mails and dispatched replies ({records.length} records)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Docket No, Tracking ID, Customer or keyword..."
                className="w-full text-xs pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c91d24] focus:outline-none bg-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              disabled={records.length === 0}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            {records.length > 0 && (
              <button
                onClick={onClearHistory}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-gray-100">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Archive className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-semibold">No Dak records found</p>
              <p className="text-xs text-gray-400 mt-1">
                {records.length === 0
                  ? 'Processed customer letters and dispatched replies will appear here.'
                  : 'Try adjusting your search criteria.'}
              </p>
            </div>
          ) : (
            filtered.map((record) => (
              <div
                key={record.id}
                className="py-3 px-2 hover:bg-gray-50 rounded-lg transition flex items-center justify-between gap-4 group cursor-pointer"
                onClick={() => {
                  onSelectRecord(record);
                  onClose();
                }}
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                      {record.docketNumber}
                    </span>
                    <span className="text-xs font-bold text-gray-800">{record.category}</span>
                    {record.trackingNumber && (
                      <span className="font-mono text-[11px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                        {record.trackingNumber}
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        record.urgency === 'Urgent / Grievance'
                          ? 'bg-red-100 text-red-700'
                          : record.urgency === 'High Priority'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {record.urgency}
                    </span>
                  </div>

                  <p className="text-xs text-gray-700 truncate font-medium">
                    {record.summary || record.originalText.slice(0, 100)}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatPostalDate(record.createdAt)}
                    </span>
                    <span>•</span>
                    <span>
                      {record.sourceLanguage} → {record.staffLanguage}
                    </span>
                    <span>•</span>
                    <span className="font-medium text-emerald-600">
                      Status: {record.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRecord(record.id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-red-600 transition" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
