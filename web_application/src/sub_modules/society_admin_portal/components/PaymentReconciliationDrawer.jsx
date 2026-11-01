import React, { useState, useEffect } from "react";
import {
  X,
  CreditCard,
  Building,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  IndianRupee,
} from "lucide-react";

export function PaymentReconciliationDrawer({
  isOpen,
  onClose,
  flatsList,
  preselectedFlatId,
  onPaymentRecorded,
}) {
  if (!isOpen) return null;

  const [selectedFlatId, setSelectedFlatId] = useState(preselectedFlatId || "");
  const [flatUnpaidInvoices, setFlatUnpaidInvoices] = useState([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [transactionRef, setTransactionRef] = useState("");
  const [chequeNumber, setChequeNumber] = useState("");
  const [chequeDate, setChequeDate] = useState("");
  const [bankName, setBankName] = useState("");
  const [depositSlipUrl, setDepositSlipUrl] = useState("");
  const [notes, setNotes] = useState("");

  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Load unpaid invoices when flat changes
  useEffect(() => {
    if (!selectedFlatId) {
      setFlatUnpaidInvoices([]);
      setSelectedInvoiceId("");
      return;
    }

    const fetchFlatStatement = async () => {
      setIsLoadingInvoices(true);
      try {
        const token = localStorage.getItem("smart_nivas_auth_token");
        const res = await fetch(`/api/admin/billing/ledger/${selectedFlatId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          const unpaid = data.data.unpaid_invoices || [];
          setFlatUnpaidInvoices(unpaid);
          if (unpaid.length > 0) {
            setSelectedInvoiceId(unpaid[0].invoice_id);
            setAmountPaid(unpaid[0].outstanding_balance_inr);
          } else {
            setSelectedInvoiceId("");
            setAmountPaid("");
          }
        }
      } catch (err) {
        console.error("Failed to load invoices for flat", err);
      } finally {
        setIsLoadingInvoices(false);
      }
    };

    fetchFlatStatement();
  }, [selectedFlatId]);

  const handleInvoiceChange = (invId) => {
    setSelectedInvoiceId(invId);
    const inv = flatUnpaidInvoices.find((i) => String(i.invoice_id) === String(invId));
    if (inv) {
      setAmountPaid(inv.outstanding_balance_inr);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const token = localStorage.getItem("smart_nivas_auth_token");
      const payload = {
        flat_id: parseInt(selectedFlatId),
        invoice_id: selectedInvoiceId ? parseInt(selectedInvoiceId) : null,
        amount_paid_inr: parseFloat(amountPaid),
        payment_mode: paymentMode,
        payment_date: paymentDate,
        transaction_reference: transactionRef || null,
        cheque_number: chequeNumber || null,
        cheque_date: chequeDate || null,
        bank_name: bankName || null,
        deposit_slip_image_url: depositSlipUrl || null,
        notes: notes || null,
      };

      const res = await fetch("/api/admin/billing/payments/record", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`Payment recorded! Receipt: ${data.data.receipt_number}`);
        setTimeout(() => {
          onPaymentRecorded();
          onClose();
        }, 1200);
      } else {
        setErrorMessage(data.message || "Failed to record payment.");
      }
    } catch (err) {
      setErrorMessage("Network error recording payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-slide-left">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Manual Payment Reconciliation
            </h2>
            <p className="text-xs text-slate-500">
              Record offline cheque, bank deposit, or cash receipt to credit flat ledger.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form id="payment-form" onSubmit={handleFormSubmit} className="space-y-4">
            {/* Flat Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Flat Unit
              </label>
              <select
                required
                value={selectedFlatId}
                onChange={(e) => setSelectedFlatId(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white"
              >
                <option value="">-- Choose Flat Unit --</option>
                {flatsList?.map((f) => (
                  <option key={f.flat_id} value={f.flat_id}>
                    {f.wing_name}-{f.flat_number} {f.resident_name ? `(${f.resident_name})` : "(Vacant)"}
                  </option>
                ))}
              </select>
            </div>

            {/* Invoices dropdown if unpaid exist */}
            {selectedFlatId && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Allocate to Invoice (Optional)
                </label>
                {isLoadingInvoices ? (
                  <p className="text-xs text-slate-400">Loading invoices...</p>
                ) : flatUnpaidInvoices.length > 0 ? (
                  <select
                    value={selectedInvoiceId}
                    onChange={(e) => handleInvoiceChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white"
                  >
                    <option value="">Unallocated Payment (Credit Balance)</option>
                    {flatUnpaidInvoices.map((inv) => (
                      <option key={inv.invoice_id} value={inv.invoice_id}>
                        {inv.invoice_number} - {inv.billing_period_label} (Due: ₹{inv.outstanding_balance_inr})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-emerald-600 font-medium bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                    No open invoices pending. Payment will sit as advance credit in ledger.
                  </p>
                )}
              </div>
            )}

            {/* Amount & Mode */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Amount Received (₹)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder="e.g. 2500"
                    className="w-full pl-8 pr-3 py-2 text-sm font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white"
                >
                  <option value="UPI">UPI Transfer / QR</option>
                  <option value="NEFT_IMPS">NEFT / RTGS / IMPS</option>
                  <option value="CHEQUE">Bank Cheque</option>
                  <option value="CASH">Cash Deposit</option>
                </select>
              </div>
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Receipt / Deposit Date
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            {/* Conditional fields based on Payment Mode */}
            {(paymentMode === "UPI" || paymentMode === "NEFT_IMPS") && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  UTR / Transaction Reference Number
                </label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g. UPI/20261101/987654"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>
            )}

            {paymentMode === "CHEQUE" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Cheque Number
                  </label>
                  <input
                    type="text"
                    required
                    value={chequeNumber}
                    onChange={(e) => setChequeNumber(e.target.value)}
                    placeholder="e.g. 000456"
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Cheque Date
                  </label>
                  <input
                    type="date"
                    value={chequeDate}
                    onChange={(e) => setChequeDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>
              </div>
            )}

            {(paymentMode === "CHEQUE" || paymentMode === "NEFT_IMPS") && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Drawn On Bank Name
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. HDFC Bank, Vastrapur Branch"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>
            )}

            {/* Upload Deposit Slip / Receipt Screenshot URL */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Deposit Slip / Receipt Attachment</span>
                <span className="text-[10px] text-slate-400 font-normal">Optional</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={depositSlipUrl}
                  onChange={(e) => setDepositSlipUrl(e.target.value)}
                  placeholder="Paste receipt / slip image URL"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Internal Remarks / Notes
              </label>
              <textarea
                rows="2"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Handed over at clubhouse office"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>
          </form>
        </div>

        {/* Drawer Actions Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="payment-form"
            disabled={isSubmitting || !selectedFlatId || !amountPaid}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? "Reconciling Ledger..." : "Record Payment & Issue Receipt"}
            <CheckCircle2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
