import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Search, Trash2, RefreshCw,
  Eye, X, ExternalLink
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import AdminLayout from '../components/AdminLayout';
import { PaginationTop, PaginationBottom } from '../components/Pagination';
import api from '../services/api';

const ContactEnquiriesAdminPage = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalEnquiries, setTotalEnquiries] = useState(0);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedIds, setSelectedIds] = useState([]);

  // Detail Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && modalOpen) {
        setModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit,
        search: search.trim(),
      });

      const res = await api.get(`/contact-enquiries?${params.toString()}`);
      if (res.data.success) {
        setEnquiries(res.data.enquiries || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
        setTotalEnquiries(res.data.stats?.totalEnquiries || res.data.total || 0);
      }
    } catch (err) {
      console.error('Failed to load contact enquiries:', err);
      toast.error(err.response?.data?.message || 'Failed to load contact enquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, limit, search]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(enquiries.map(item => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const openDetailModal = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setModalOpen(true);
  };

  const executeDelete = async (id) => {
    try {
      await api.delete(`/contact-enquiries/${id}`);
      toast.success('Enquiry deleted successfully');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete enquiry');
    }
  };

  const handleDelete = (id, customerName) => {
    toast((t) => (
      <div className="flex flex-col items-center text-center gap-2 p-1">
        <p className="text-sm font-semibold text-neutral-800">Delete enquiry from {customerName}?</p>
        <p className="text-xs text-neutral-600 max-w-xs">
          Are you sure you want to permanently delete this contact message?
        </p>
        <div className="flex justify-center items-center gap-3 mt-2 w-full">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              executeDelete(id);
            }}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold uppercase transition-colors rounded shadow-sm"
          >
            Yes, Delete
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold uppercase transition-colors rounded border border-neutral-200"
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: 5000, position: 'top-center' });
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    toast((t) => (
      <div className="flex flex-col items-center text-center gap-2 p-1">
        <p className="text-sm font-semibold text-neutral-800">Delete {selectedIds.length} Enquiries?</p>
        <p className="text-xs text-neutral-600 max-w-xs">
          This action will permanently delete all selected contact messages.
        </p>
        <div className="flex justify-center items-center gap-3 mt-2 w-full">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await api.delete('/contact-enquiries/bulk', { data: { ids: selectedIds } });
                toast.success(`Deleted ${selectedIds.length} enquiries`);
                setSelectedIds([]);
                loadData();
              } catch (err) {
                toast.error('Bulk deletion failed');
              }
            }}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold uppercase transition-colors rounded shadow-sm"
          >
            Yes, Delete All
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold uppercase transition-colors rounded border border-neutral-200"
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: 5000, position: 'top-center' });
  };

  return (
    <AdminLayout title="Contact Enquiries">
      <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 max-w-7xl mx-auto">
        
        {/* Title Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-neutral-200/80 shadow-sm">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2.5">
              <Mail className="w-6 h-6 sm:w-7 sm:h-7 text-amber-600 flex-shrink-0" />
              <span>Contact Enquiries</span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              View customer messages submitted through your website contact form.
            </p>
          </div>

          <button
            onClick={loadData}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold rounded-xl border border-neutral-300 transition-all shadow-sm self-stretch sm:self-auto flex-shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Messages
          </button>
        </div>

        {/* Stats Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between col-span-1">
            <div>
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Total Enquiries Received</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">{totalEnquiries}</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
              <Mail className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-sm flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search name, email, subject, message..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-9 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-0.5"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                onClick={handleBulkDelete}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-semibold transition-all w-full sm:w-auto shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Selected ({selectedIds.length})
              </button>
            </div>
          )}
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm overflow-hidden">
          <PaginationTop
            page={page}
            limit={limit}
            total={total}
            onPageChange={setPage}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
          />

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[750px]">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      checked={enquiries.length > 0 && selectedIds.length === enquiries.length}
                      onChange={handleSelectAll}
                      className="rounded border-neutral-300 text-amber-600 focus:ring-amber-500"
                    />
                  </th>
                  <th className="p-4 whitespace-nowrap">Date & Time</th>
                  <th className="p-4 whitespace-nowrap">Customer</th>
                  <th className="p-4 whitespace-nowrap">Email / Phone</th>
                  <th className="p-4 whitespace-nowrap">Subject</th>
                  <th className="p-4 whitespace-nowrap">Message Snippet</th>
                  <th className="p-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-neutral-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-amber-600" />
                        <span>Loading contact enquiries...</span>
                      </div>
                    </td>
                  </tr>
                ) : enquiries.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-neutral-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Mail className="w-8 h-8 text-neutral-300" />
                        <span className="font-semibold text-neutral-700">No contact enquiries found</span>
                        <span className="text-xs text-neutral-400">Messages submitted on the contact page will appear here.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  enquiries.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => handleSelectOne(item.id)}
                          className="rounded border-neutral-300 text-amber-600 focus:ring-amber-500"
                        />
                      </td>
                      <td className="p-4 text-xs text-neutral-500 whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleString('en-IN', {
                          month: 'short', day: 'numeric', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="p-4 font-semibold text-neutral-900 min-w-[120px] max-w-[180px] break-words">
                        {item.name}
                      </td>
                      <td className="p-4 text-xs space-y-0.5 min-w-[180px] max-w-[240px]">
                        <a
                          href={`mailto:${item.email}`}
                          className="text-amber-700 hover:underline font-medium block break-all"
                          title={item.email}
                        >
                          {item.email}
                        </a>
                        {item.phone && (
                          <span className="text-neutral-500 block break-all" title={item.phone}>
                            {item.phone}
                          </span>
                        )}
                      </td>
                      <td className="p-4 min-w-[130px] max-w-[200px]">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800 border border-neutral-200 break-words line-clamp-2"
                          title={item.subject}
                        >
                          {item.subject}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-neutral-600 min-w-[200px] max-w-xs">
                        <p className="line-clamp-2 break-words" title={item.message}>
                          {item.message}
                        </p>
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openDetailModal(item)}
                            className="p-1.5 text-neutral-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.name)}
                            className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <PaginationBottom
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>

        {/* View Details Modal */}
        <AnimatePresence>
          {modalOpen && selectedEnquiry && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/50 backdrop-blur-sm"
              onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-neutral-200"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-100 bg-neutral-50/60 flex-shrink-0">
                  <div className="flex items-center gap-3 min-w-0 mr-2">
                    <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center font-bold flex-shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-neutral-900 truncate">
                        Contact Enquiry #{selectedEnquiry.id}
                      </h3>
                      <p className="text-xs text-neutral-500 truncate">
                        Submitted on {new Date(selectedEnquiry.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors flex-shrink-0"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 overflow-y-auto flex-1">
                  
                  {/* Customer Info Box */}
                  <div className="bg-neutral-50/90 p-4 sm:p-5 rounded-xl border border-neutral-200/80 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 text-xs">
                    <div className="min-w-0">
                      <span className="text-neutral-400 font-medium block uppercase tracking-wider text-[11px] mb-1">
                        Customer Name
                      </span>
                      <span className="text-neutral-900 font-bold text-sm sm:text-base break-words block">
                        {selectedEnquiry.name || 'Anonymous'}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <span className="text-neutral-400 font-medium block uppercase tracking-wider text-[11px] mb-1">
                        Inquiry Subject
                      </span>
                      <div className="flex flex-wrap items-center">
                        <span className="inline-block py-1 rounded-md font-semibold text-xs break-words max-w-full">
                          {selectedEnquiry.subject || 'General Inquiry'}
                        </span>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <span className="text-neutral-400 font-medium block uppercase tracking-wider text-[11px] mb-1">
                        Email Address
                      </span>
                      {selectedEnquiry.email ? (
                        <a
                          href={`mailto:${selectedEnquiry.email}`}
                          className="text-amber-700 hover:text-amber-800 hover:underline font-semibold text-sm inline-flex items-center gap-1.5 break-all max-w-full group"
                          title={selectedEnquiry.email}
                        >
                          <span className="break-all">{selectedEnquiry.email}</span>
                          <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 text-amber-600 group-hover:text-amber-800" />
                        </a>
                      ) : (
                        <span className="text-neutral-400 italic text-sm">Not provided</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <span className="text-neutral-400 font-medium block uppercase tracking-wider text-[11px] mb-1">
                        Phone Number
                      </span>
                      {selectedEnquiry.phone ? (
                        <a
                          href={`tel:${selectedEnquiry.phone}`}
                          className="text-neutral-800 hover:text-amber-700 hover:underline font-semibold text-sm break-all inline-block"
                        >
                          {selectedEnquiry.phone}
                        </a>
                      ) : (
                        <span className="text-neutral-400 italic text-sm">Not provided</span>
                      )}
                    </div>
                  </div>

                  {/* Message Content Box */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Customer Message:
                    </label>
                    <div className="bg-amber-50/40 p-4 sm:p-5 rounded-xl border border-amber-200/60 text-sm text-neutral-800 leading-relaxed whitespace-pre-wrap break-words font-sans max-h-60 overflow-y-auto">
                      {selectedEnquiry.message || <span className="text-neutral-400 italic">No message content provided.</span>}
                    </div>
                  </div>
                </div>

                {/* Footer Close Button */}
                <div className="flex items-center justify-end p-4 sm:p-5 border-t border-neutral-100 bg-neutral-50/50 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </AdminLayout>
  );
};

export default ContactEnquiriesAdminPage;
