import React, { useState, useEffect } from "react";
import {
  X,
  QrCode,
  IndianRupee,
  Building,
  Calendar,
  User,
  ShieldCheck,
  Download,
  CheckCircle2,
} from "lucide-react";

export function InvoiceUpiQrModal({
  isOpen,
  onClose,
  invoiceId,
}) {
  if (!isOpen || !invoiceId) return null;

  const [upiDetails, setUpiDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchUpiData = async () => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const token = localStorage.getItem("smart_nivas_auth_token");
        const res = await fetch(`/api/admin/billing/invoices/${invoiceId}/upi-qr`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setUpiDetails(data.data);
        } else {
          setErrorMessage(data.message || "Failed to load UPI details.");
        }
      } catch (err) {
        setErrorMessage("Network error loading UPI QR.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUpiData();
  }, [invoiceId]);

  // Generate QR code image URL using standard open QR API with encoded UPI intent URI
  const qrCodeUrl = upiDetails?.upi_intent_uri
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(
        upiDetails.upi_intent_uri
      )}`
    : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden animate-scale-up text-center">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Instant UPI Maintenance QR
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500">Generating Dynamic UPI QR...</p>
            </div>
          ) : errorMessage ? (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
              {errorMessage}
            </div>
          ) : upiDetails ? (
            <>
              {/* Invoice & Flat Pill */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 space-y-1">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Unit {upiDetails.flat_number}</span>
                  <span className="text-blue-600 font-mono">{upiDetails.invoice_number}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Resident: {upiDetails.resident_name || "N/A"}</span>
                  <span className="font-bold text-slate-900">
                    ₹{upiDetails.amount_due_inr.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* QR Container */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs inline-block">
                {qrCodeUrl && (
                  <img
                    src={qrCodeUrl}
                    alt="UPI Payment QR Code"
                    className="w-48 h-48 mx-auto object-contain"
                  />
                )}
                <div className="mt-2 text-[11px] font-mono font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                  VPA: {upiDetails.upi_vpa}
                </div>
              </div>

              {/* Supported Apps Badges */}
              <div className="text-[11px] text-slate-400 font-medium">
                Scan with Google Pay, PhonePe, Paytm, or BHIM
              </div>

              {/* Bank Details Breakdown */}
              {upiDetails.bank_details?.account_number && (
                <div className="border-t border-slate-100 pt-3 text-[11px] text-slate-500 text-left space-y-0.5 font-mono">
                  <div>Bank: <span className="text-slate-700 font-semibold">{upiDetails.bank_details.bank_name}</span></div>
                  <div>A/C: <span className="text-slate-700 font-semibold">{upiDetails.bank_details.account_number}</span></div>
                  <div>IFSC: <span className="text-slate-700 font-semibold">{upiDetails.bank_details.ifsc_code}</span></div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1 text-emerald-600 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            Zero-Commission Direct Transfer
          </span>
          <button
            onClick={onClose}
            className="font-bold text-slate-700 hover:underline cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
