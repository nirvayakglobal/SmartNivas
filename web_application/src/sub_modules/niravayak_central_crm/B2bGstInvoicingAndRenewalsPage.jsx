import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Search,
} from "lucide-react";

export function B2bGstInvoicingAndRenewalsPage() {
  const [b2bInvoiceRecords, setB2bInvoiceRecords] = useState([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);
  const [searchFilterKeyword, setSearchFilterKeyword] = useState("");

  const fetchInvoices = async () => {
    setIsLoadingInvoices(true);
    try {
      const storedAuthToken = localStorage.getItem("smart_nivas_auth_token");
      const httpApiResponse = await fetch("/api/central/invoices", {
        headers: { Authorization: `Bearer ${storedAuthToken}` },
      });
      const responseJsonData = await httpApiResponse.json();
      if (responseJsonData.success) {
        setB2bInvoiceRecords(responseJsonData.data);
      }
    } catch (networkFetchError) {
      console.error("Failed to load invoices:", networkFetchError);
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleUpdatePaymentStatus = async (targetInvoiceId, nextPaymentStatus) => {
    try {
      const storedAuthToken = localStorage.getItem("smart_nivas_auth_token");
      const httpApiResponse = await fetch(
        `/api/central/invoices/${targetInvoiceId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${storedAuthToken}`,
          },
          body: JSON.stringify({ payment_status: nextPaymentStatus }),
        }
      );
      const responseJsonData = await httpApiResponse.json();
      if (responseJsonData.success) {
        fetchInvoices();
      }
    } catch (updateError) {
      console.error("Failed to update invoice payment status:", updateError);
    }
  };

  const filteredInvoicesList = b2bInvoiceRecords.filter((invoiceItem) => {
    const searchTarget = `${invoiceItem.invoice_number} ${invoiceItem.society_legal_name} ${invoiceItem.society_unique_code}`.toLowerCase();
    return searchTarget.includes(searchFilterKeyword.toLowerCase());
  });

  const totalRevenueCollectedInr = b2bInvoiceRecords
    .filter((invoiceItem) => invoiceItem.payment_status === "PAID")
    .reduce((runningSum, invoiceItem) => runningSum + Number(invoiceItem.total_amount_inr), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0F172A] font-heading flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            B2B GST Invoicing & Client Renewals
          </h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            Automated 18% GST tax invoices generated upon society client conversion and renewals.
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-lg px-5 py-3 text-right shadow-[0_1px_3px_0_rgba(15,23,42,0.04)]">
          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
            TOTAL REALIZED REVENUE
          </span>
          <p className="text-xl font-bold text-emerald-700 font-heading">
            ₹{totalRevenueCollectedInr.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Invoices Table Container (Enterprise Light Resting Card) */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden shadow-[0_1px_3px_0_rgba(15,23,42,0.04)]">
        <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
          <div className="relative w-80">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by invoice number or society..."
              value={searchFilterKeyword}
              onChange={(event) => setSearchFilterKeyword(event.target.value)}
              className="w-full bg-white border border-[#CBD5E1] rounded-sm pl-9 pr-3.5 py-1.5 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <span className="text-xs text-[#64748B]">
            Compliant with Indian Goods and Services Tax (GST) Act
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold uppercase text-[11px] tracking-wider border-b border-[#E2E8F0]">
              <tr>
                <th className="px-6 py-3.5">Invoice # & Date</th>
                <th className="px-6 py-3.5">Society Client</th>
                <th className="px-6 py-3.5">Base Amount</th>
                <th className="px-6 py-3.5">GST (18%)</th>
                <th className="px-6 py-3.5">Total Amount</th>
                <th className="px-6 py-3.5">Payment Status</th>
                <th className="px-6 py-3.5 text-right">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[#334155] font-medium">
              {isLoadingInvoices ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-[#94A3B8]">
                    Loading invoices...
                  </td>
                </tr>
              ) : filteredInvoicesList.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-[#94A3B8] italic">
                    No matching B2B invoices found.
                  </td>
                </tr>
              ) : (
                filteredInvoicesList.map((invoiceRecord) => (
                  <tr
                    key={invoiceRecord.invoice_id}
                    className="hover:bg-[#F8FAFC] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-mono font-bold text-[#0F172A]">
                        {invoiceRecord.invoice_number}
                      </div>
                      <div className="text-[11px] text-[#64748B] mt-0.5">
                        {new Date(invoiceRecord.created_at).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-bold text-[#0F172A] font-heading">
                        {invoiceRecord.society_legal_name}
                      </div>
                      <div className="text-xs text-blue-600 font-mono">
                        {invoiceRecord.society_unique_code}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-[#334155]">
                      ₹{Number(invoiceRecord.base_amount_inr).toLocaleString("en-IN")}
                    </td>

                    <td className="px-6 py-4 text-amber-700 text-xs font-semibold">
                      ₹{Number(invoiceRecord.gst_amount_inr).toLocaleString("en-IN")}
                    </td>

                    <td className="px-6 py-4 font-bold text-[#0F172A] text-base font-heading">
                      ₹{Number(invoiceRecord.total_amount_inr).toLocaleString("en-IN")}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          invoiceRecord.payment_status === "PAID"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : invoiceRecord.payment_status === "UNPAID"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {invoiceRecord.payment_status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <select
                        value={invoiceRecord.payment_status}
                        onChange={(selectEvent) =>
                          handleUpdatePaymentStatus(
                            invoiceRecord.invoice_id,
                            selectEvent.target.value
                          )
                        }
                        className="bg-white border border-[#CBD5E1] text-xs text-[#0F172A] rounded-sm px-2.5 py-1 focus:outline-none focus:border-blue-600 font-medium"
                      >
                        <option value="PAID">Mark PAID</option>
                        <option value="UNPAID">Mark UNPAID</option>
                        <option value="CANCELLED">Mark CANCELLED</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
