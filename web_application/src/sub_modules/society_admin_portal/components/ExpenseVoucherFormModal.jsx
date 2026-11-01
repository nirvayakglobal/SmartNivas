import React, { useState } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X } from "lucide-react";

export function ExpenseVoucherFormModal({
  isOpen,
  onClose,
  expenseHeads,
  vendors,
  tdsConfigurations,
  amcContracts,
  onSaveVoucher,
}) {
  const currentDateString = new Date().toISOString().split("T")[0];

  const [voucherFormData, setVoucherFormData] = useState({
    voucher_date: currentDateString,
    vendor_id: "",
    expense_head_id: "",
    amc_id: "",
    gross_amount_inr: "",
    tds_percentage: 0,
    payment_mode: "BANK_TRANSFER",
    payment_reference_number: "",
    payment_date: currentDateString,
    invoice_bill_number: "",
    remarks: "",
    invoice_attachment_url: "",
    invoice_attachment_filename: "",
  });

  const [dragActive, setDragActive] = useState(false);
  const [formValidationError, setFormValidationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Handle Vendor Selection and Auto-populate TDS
  const handleVendorChange = (event) => {
    const selectedVendorId = event.target.value;
    const matchedVendor = vendors.find(
      (vendorItem) => String(vendorItem.vendor_id) === String(selectedVendorId)
    );

    let resolvedTdsPercentage = 0;
    if (matchedVendor && matchedVendor.default_tds_percentage !== null) {
      resolvedTdsPercentage = parseFloat(matchedVendor.default_tds_percentage) || 0;
    }

    setVoucherFormData((previousState) => ({
      ...previousState,
      vendor_id: selectedVendorId,
      tds_percentage: resolvedTdsPercentage,
    }));
  };

  // Handle Drag-and-Drop or File Upload
  const handleFileProcess = (selectedFile) => {
    if (!selectedFile) return;

    if (selectedFile.size > 5 * 1024 * 1024) {
      setFormValidationError("File size exceeds 5MB limit. Please upload a smaller file.");
      return;
    }

    const fileReader = new FileReader();
    fileReader.onload = () => {
      setVoucherFormData((previousState) => ({
        ...previousState,
        invoice_attachment_url: fileReader.result,
        invoice_attachment_filename: selectedFile.name,
      }));
      setFormValidationError("");
    };
    fileReader.readAsDataURL(selectedFile);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      handleFileProcess(event.dataTransfer.files[0]);
    }
  };

  // Live calculations
  const grossAmount = parseFloat(voucherFormData.gross_amount_inr) || 0;
  const tdsPercentage = parseFloat(voucherFormData.tds_percentage) || 0;
  const tdsDeducted = Math.round((grossAmount * (tdsPercentage / 100)) * 100) / 100;
  const netPayable = Math.round((grossAmount - tdsDeducted) * 100) / 100;

  const handleSubmitForm = async (event) => {
    event.preventDefault();
    setFormValidationError("");

    if (!voucherFormData.expense_head_id) {
      setFormValidationError("Please select an Expense Head / Category.");
      return;
    }
    if (grossAmount <= 0) {
      setFormValidationError("Please enter a valid Gross Amount greater than zero.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSaveVoucher({
        ...voucherFormData,
        vendor_id: voucherFormData.vendor_id ? parseInt(voucherFormData.vendor_id, 10) : null,
        expense_head_id: parseInt(voucherFormData.expense_head_id, 10),
        amc_id: voucherFormData.amc_id ? parseInt(voucherFormData.amc_id, 10) : null,
        gross_amount_inr: grossAmount,
        tds_percentage: tdsPercentage,
        tds_deducted_amount_inr: tdsDeducted,
        net_payable_amount_inr: netPayable,
      });
      setIsSubmitting(false);
      onClose();
    } catch (submissionError) {
      setIsSubmitting(false);
      setFormValidationError(submissionError.message || "Failed to record expense voucher.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Record Expense Voucher</h2>
            <p className="text-xs text-indigo-200 mt-0.5">
              Accounts Payable entry with automated TDS deduction & invoice capture
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmitForm} className="p-6 space-y-5">
          {formValidationError && (
            <div className="flex items-center gap-2 p-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formValidationError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Voucher Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Voucher Date *
              </label>
              <input
                type="date"
                required
                value={voucherFormData.voucher_date}
                onChange={(event) =>
                  setVoucherFormData({ ...voucherFormData, voucher_date: event.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Expense Head */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Expense Head (Chart of Accounts) *
              </label>
              <select
                required
                value={voucherFormData.expense_head_id}
                onChange={(event) =>
                  setVoucherFormData({ ...voucherFormData, expense_head_id: event.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">-- Select Expense Head --</option>
                {expenseHeads.map((expenseHeadItem) => (
                  <option
                    key={expenseHeadItem.expense_head_id}
                    value={expenseHeadItem.expense_head_id}
                  >
                    [{expenseHeadItem.category_code}] {expenseHeadItem.head_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Vendor Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Service Provider / Vendor
              </label>
              <select
                value={voucherFormData.vendor_id}
                onChange={handleVendorChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">-- Direct / Non-Vendor Petty Expense --</option>
                {vendors.map((vendorItem) => (
                  <option key={vendorItem.vendor_id} value={vendorItem.vendor_id}>
                    {vendorItem.vendor_name} ({vendorItem.vendor_type})
                  </option>
                ))}
              </select>
            </div>

            {/* Optional AMC Link */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Linked AMC Contract (Optional)
              </label>
              <select
                value={voucherFormData.amc_id}
                onChange={(event) =>
                  setVoucherFormData({ ...voucherFormData, amc_id: event.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">-- None (Standalone Expense) --</option>
                {amcContracts.map((amcContractItem) => (
                  <option key={amcContractItem.amc_id} value={amcContractItem.amc_id}>
                    {amcContractItem.contract_title} ({amcContractItem.vendor_name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Financial Breakdown Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
              Tax & Payout Calculation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gross Bill Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  placeholder="e.g. 25000"
                  value={voucherFormData.gross_amount_inr}
                  onChange={(event) =>
                    setVoucherFormData({ ...voucherFormData, gross_amount_inr: event.target.value })
                  }
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  TDS Rate Deduction (%)
                </label>
                <select
                  value={voucherFormData.tds_percentage}
                  onChange={(event) =>
                    setVoucherFormData({
                      ...voucherFormData,
                      tds_percentage: parseFloat(event.target.value) || 0,
                    })
                  }
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="0">0% (No TDS)</option>
                  {tdsConfigurations.map((tdsRuleItem) => (
                    <option key={tdsRuleItem.tds_config_id} value={tdsRuleItem.tds_percentage}>
                      {tdsRuleItem.tds_percentage}% ({tdsRuleItem.section_code} - {tdsRuleItem.vendor_type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Net Disbursed Amount (₹)
                </label>
                <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-bold text-emerald-800">
                  ₹{netPayable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  {tdsDeducted > 0 && (
                    <span className="block text-[11px] font-normal text-emerald-600">
                      (TDS withheld: ₹{tdsDeducted.toLocaleString("en-IN", { minimumFractionDigits: 2 })})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Payment & Invoice Reference Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Payment Mode *
              </label>
              <select
                value={voucherFormData.payment_mode}
                onChange={(event) =>
                  setVoucherFormData({ ...voucherFormData, payment_mode: event.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS/IMPS)</option>
                <option value="CHEQUE">Bank Cheque</option>
                <option value="UPI">UPI Digital Payment</option>
                <option value="PETTY_CASH">Petty Cash</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                UTR / Cheque / Txn Ref No
              </label>
              <input
                type="text"
                placeholder="e.g. UTR19827364"
                value={voucherFormData.payment_reference_number}
                onChange={(event) =>
                  setVoucherFormData({
                    ...voucherFormData,
                    payment_reference_number: event.target.value,
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Vendor Invoice / Bill No
              </label>
              <input
                type="text"
                placeholder="e.g. INV-2026/089"
                value={voucherFormData.invoice_bill_number}
                onChange={(event) =>
                  setVoucherFormData({
                    ...voucherFormData,
                    invoice_bill_number: event.target.value,
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Drag and Drop Zone for PDF / Image Invoice */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Invoice Attachment (PDF / PNG / JPEG)
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition ${
                dragActive
                  ? "border-indigo-600 bg-indigo-50/50"
                  : "border-slate-300 hover:border-indigo-400 bg-slate-50/50"
              }`}
              onClick={() => document.getElementById("invoice_file_input_element")?.click()}
            >
              <input
                id="invoice_file_input_element"
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => {
                  if (event.target.files && event.target.files[0]) {
                    handleFileProcess(event.target.files[0]);
                  }
                }}
              />
              {voucherFormData.invoice_attachment_filename ? (
                <div className="flex items-center justify-center gap-3 text-emerald-700">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  <div className="text-left">
                    <p className="text-sm font-semibold">{voucherFormData.invoice_attachment_filename}</p>
                    <p className="text-xs text-slate-500">Attachment ready. Click or drag to replace.</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-1.5 text-slate-600">
                  <UploadCloud className="w-8 h-8 text-indigo-500" />
                  <p className="text-sm font-medium">
                    Drag and drop invoice file here, or <span className="text-indigo-600 underline">browse</span>
                  </p>
                  <p className="text-xs text-slate-400">PDF, PNG, JPG up to 5MB for audit trails</p>
                </div>
              )}
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Remarks / Audit Notes
            </label>
            <textarea
              rows="2"
              placeholder="e.g. Approved by Society Secretary in MC meeting on 28th Oct"
              value={voucherFormData.remarks}
              onChange={(event) =>
                setVoucherFormData({ ...voucherFormData, remarks: event.target.value })
              }
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-200 disabled:opacity-50 transition"
            >
              {isSubmitting ? "Recording Voucher..." : "Record Voucher & Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
