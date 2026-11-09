import React, { useRef } from "react";
import {
  Printer,
  Download,
  X,
  Building2,
  Calendar,
  AlertCircle,
  QrCode,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export function MaintenanceNoticeCircularModal({
  isOpen,
  onClose,
  noticeData,
}) {
  if (!isOpen || !noticeData) return null;

  const printAreaRef = useRef(null);

  const handlePrint = () => {
    window.print();
  };

  const rates = noticeData.rates || {
    REGULAR: { owner_monthly: 2400, tenant_monthly: 3000, owner_quarterly: 7200, tenant_quarterly: 9000 },
    PENTHOUSE: { owner_monthly: 2900, tenant_monthly: 3500, owner_quarterly: 8700, tenant_quarterly: 10500 },
  };

  const regular = rates.REGULAR || {};
  const penthouse = rates.PENTHOUSE || {};

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      {/* Container */}
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-scale-up">
        {/* Top Action Bar */}
        <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50 no-print">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-900 font-heading">
              Official Society Maintenance Notice Circular (મેઈન્ટેનન્સ પરિપત્ર)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Circular Content Area */}
        <div
          ref={printAreaRef}
          className="p-8 sm:p-12 max-h-[82vh] overflow-y-auto bg-white text-slate-800 font-sans print:p-0 print:max-h-none"
        >
          {/* Header Title */}
          <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-wide font-heading">
              {noticeData.society_legal_name || "SHILP SERENITY CO OPERATIVE HOUSING SERVICE SOCIETY LIMITED"}
            </h1>
            <p className="text-xs font-mono text-slate-600 font-semibold">
              REG/{noticeData.registration_number || "REG/GNR/SA(HAA)19102/2024"}
            </p>
            <p className="text-[11px] text-slate-500 max-w-xl mx-auto leading-relaxed">
              {noticeData.billing_address || "Near Shiva Blessing, Behind Swagat Flamingo, Sarkhej-Gandhinagar Highway, Sargasan, Gandhinagar - 382421"}
            </p>
          </div>

          {/* Reference Meta */}
          <div className="flex items-center justify-between py-3 border-b border-slate-200 text-xs font-semibold text-slate-700">
            <div>
              <span>Date: </span>
              <strong className="text-slate-900 font-mono">{noticeData.date || "21.09.2026"}</strong>
            </div>
            <div>
              <span>Sr # </span>
              <strong className="text-slate-900 font-mono">202600009</strong>
            </div>
          </div>

          {/* Subject Banner */}
          <div className="my-5 text-center">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 bg-amber-50/80 border border-amber-200/70 py-2.5 px-4 rounded-xl leading-normal">
              {noticeData.period_label || "વર્ષ ૨૦૨૬-૨૭ Q3: ઓક્ટોબર - ૨૬ થી ડીસેમ્બર - ૨૬ મેઈન્ટેનન્સની રકમ જમા કરવાનો સમય મર્યાદા અને માધ્યમ"}
            </h2>
          </div>

          {/* Salutation */}
          <div className="text-xs text-slate-700 space-y-1.5 leading-relaxed">
            <p className="font-bold text-slate-900">To,</p>
            <p className="font-semibold">સોસાયટીના ફ્લેટ માલિકો અને ભાડુયાતો,</p>
            <p className="pt-1">
              સભ્યશ્રી, આપણી સોસાયટીના મેઈન્ટેનન્સની રકમ નીચે મુજબ છે તે આપેલ સમય મર્યાદા માં જમા કરવા વિનંતી.
            </p>
          </div>

          {/* Rate Matrix Table (Matching circular layout) */}
          <div className="my-5 overflow-hidden rounded-xl border-2 border-slate-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#781216] text-white font-bold border-b-2 border-slate-900">
                <tr>
                  <th className="py-2.5 px-3 border-r border-red-900/40 text-center w-28">
                    દર મહિનાની<br />મેઈન્ટેનન્સ રકમ
                  </th>
                  <th className="py-2.5 px-4 border-r border-red-900/40 text-center">
                    કોને લાગુ પડશે?
                  </th>
                  <th className="py-2.5 px-3 text-center w-36">
                    ૩ મહિનાના મેઈન્ટેનન્સની<br />રકમ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 font-medium">
                {/* Regular: Owner / Vacant / Builder */}
                <tr className="hover:bg-slate-50">
                  <td className="py-3 px-3 text-center font-bold text-slate-900 font-mono text-sm border-r border-slate-300">
                    ₹{(regular.owner_monthly || 2400).toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-4 border-r border-slate-300 text-slate-800">
                    <strong className="text-slate-900">પેન્ટહાઉસ સિવાયના ફ્લેટ માટે:</strong> જે પણ ફ્લેટમાં મકાનમાલિક રહે છે કે ફ્લેટ ખાલી છે કે ફ્લેટ બિલ્ડરના હસ્તકમાં છે કે ફ્લેટનું વેચાણ થયેલ છે પણ દસ્તાવેજ થયેલ નથી, એ બધા માટે
                  </td>
                  <td className="py-3 px-3 text-center font-extrabold text-slate-900 font-mono text-sm">
                    ₹{(regular.owner_quarterly || (regular.owner_monthly * 3) || 7200).toLocaleString("en-IN")}
                  </td>
                </tr>

                {/* Regular: Tenant */}
                <tr className="hover:bg-slate-50 bg-slate-50/40">
                  <td className="py-3 px-3 text-center font-bold text-slate-900 font-mono text-sm border-r border-slate-300">
                    ₹{(regular.tenant_monthly || 3000).toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-4 border-r border-slate-300 text-slate-800">
                    <strong className="text-slate-900">પેન્ટહાઉસ સિવાયના ફ્લેટ માટે:</strong> ફ્લેટ ભાડે આપેલ હોય તેમને
                  </td>
                  <td className="py-3 px-3 text-center font-extrabold text-slate-900 font-mono text-sm">
                    ₹{(regular.tenant_quarterly || (regular.tenant_monthly * 3) || 9000).toLocaleString("en-IN")}
                  </td>
                </tr>

                {/* Penthouse: Owner / Vacant / Builder */}
                <tr className="hover:bg-slate-50">
                  <td className="py-3 px-3 text-center font-bold text-slate-900 font-mono text-sm border-r border-slate-300">
                    ₹{(penthouse.owner_monthly || 2900).toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-4 border-r border-slate-300 text-slate-800">
                    <strong className="text-slate-900">પેન્ટહાઉસ ફ્લેટ માટે:</strong> જે પણ ફ્લેટમાં મકાનમાલિક રહે છે કે ફ્લેટ ખાલી છે કે ફ્લેટ બિલ્ડરના હસ્તકમાં છે કે ફ્લેટનું વેચાણ થયેલ છે પણ દસ્તાવેજ થયેલ નથી, એ બધા માટે
                  </td>
                  <td className="py-3 px-3 text-center font-extrabold text-slate-900 font-mono text-sm">
                    ₹{(penthouse.owner_quarterly || (penthouse.owner_monthly * 3) || 8700).toLocaleString("en-IN")}
                  </td>
                </tr>

                {/* Penthouse: Tenant */}
                <tr className="hover:bg-slate-50 bg-slate-50/40">
                  <td className="py-3 px-3 text-center font-bold text-slate-900 font-mono text-sm border-r border-slate-300">
                    ₹{(penthouse.tenant_monthly || 3500).toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-4 border-r border-slate-300 text-slate-800">
                    <strong className="text-slate-900">પેન્ટહાઉસ ફ્લેટ માટે:</strong> પેન્ટહાઉસ ફ્લેટ ભાડે આપેલ હોય તેમને
                  </td>
                  <td className="py-3 px-3 text-center font-extrabold text-slate-900 font-mono text-sm">
                    ₹{(penthouse.tenant_quarterly || (penthouse.tenant_monthly * 3) || 10500).toLocaleString("en-IN")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Compulsory Due Date Notice */}
          <div className="text-center py-2 text-xs sm:text-sm font-extrabold text-slate-900 tracking-wide">
            ૩ મહિનાનું મેઈન્ટેનન્સ તા. <span className="underline decoration-red-600 decoration-2 font-mono">૧૦-૧૦-૨૦૨૬</span> સુધીમાં જમા કરવું ફરજિયાત છે.
          </div>

          {/* Payment Instructions & Bank Details */}
          <div className="my-5 p-4 rounded-xl border border-slate-200 bg-slate-50/70 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* QR Box */}
            <div className="flex flex-col items-center justify-center p-3 bg-white rounded-lg border border-slate-200 shadow-xs">
              <div className="w-28 h-28 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200 p-1">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                    `upi://pay?pa=${noticeData.bank?.upi_vpa || "smartnivas@icici"}&pn=${encodeURIComponent(
                      noticeData.society_legal_name || "Shilp Serenity RWA"
                    )}&cu=INR`
                  )}`}
                  alt="UPI QR Code"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-[10px] font-bold text-slate-500 mt-1.5 font-mono">
                {noticeData.bank?.upi_vpa || "smartnivas@icici"}
              </span>
            </div>

            {/* Instruction Details */}
            <div className="md:col-span-2 space-y-2 text-xs text-slate-700">
              <h4 className="font-bold text-slate-900 uppercase tracking-wide">
                મેઈન્ટેનન્સ ની રકમ ની ચુકવણી કેવી રીતે કરવી?
              </h4>
              <p className="leading-relaxed">
                ઉપર આપેલ QR Code સ્કેન કરીને તમે <strong>GPay, PhonePe, Paytm કે UPI</strong> માધ્યમથી ચુકવણી કરી શકો છો.
              </p>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-[11px] font-mono space-y-0.5">
                <div><strong>બેંકનું નામ:</strong> {noticeData.bank?.bank_name || "ICICI Bank"}</div>
                <div><strong>ખાતાનું નામ:</strong> {noticeData.bank?.beneficiary_name || noticeData.society_legal_name}</div>
                {noticeData.bank?.account_number && <div><strong>ખાતા નંબર:</strong> {noticeData.bank?.account_number}</div>}
                {noticeData.bank?.ifsc_code && <div><strong>IFSC Code:</strong> {noticeData.bank?.ifsc_code}</div>}
              </div>
            </div>
          </div>

          {/* Rules & Policies Bullet Points (Matching Gujarati notice) */}
          <div className="space-y-2 pt-2 border-t border-slate-200 text-[11px] text-slate-700">
            <h4 className="font-bold text-slate-900 text-xs underline">મેઈન્ટેનન્સ માટેના નિયમો:</h4>
            <ul className="list-disc pl-5 space-y-1 leading-relaxed">
              <li>મેઈન્ટેનન્સની રકમ કેશ સ્વીકારવામાં આવશે નહીં. મેઈન્ટેનન્સ ફક્ત સોસાયટીના બેંક એકાઉન્ટ અથવા UPI ક્યૂઆર લિંક મારફતે જ લેવામાં આવશે.</li>
              <li>મેઈન્ટેનન્સ સોસાયટીએ નક્કી કરેલા સમયગાળામાં જમા કરાવવું ફરજિયાત રહેશે. જો આપેલ સમય મર્યાદા બાદ જમા કરવામાં આવશે તો ₹{noticeData.penalty_amount_inr || 500} પ્રતિ મહિનાનો દંડ સાથે આપવાનું રહેશે.</li>
              <li>જો મેઈન્ટેનન્સ ૧ મહિનો મોડું આપવામાં આવશે તો સોસાયટીની કોમન સર્વિસીસ પાણી અને હાઉસકીપિંગ સર્વિસ બંધ કરવામાં આવશે.</li>
              <li>દરેક ક્વાર્ટરનું (૩ મહિનાનું) મેઈન્ટેનન્સ એક સાથે જ જમા કરવાનું રહેશે.</li>
              <li>જો ફ્લેટ ભાડે આપેલ હોય તો મેઈન્ટેનન્સ ની રકમ જમા કરવાની જવાબદારી ફ્લેટ માલિકની રહેશે.</li>
              <li>જો ફ્લેટ બંધ હોય તો પણ ફ્લેટ ની મેઈન્ટેનન્સ રકમ ફરજિયાત જમા કરવાની રહેશે.</li>
              <li>જે પણ ફ્લેટ બિલ્ડર ની સત્તા માં છે એ પણ ફ્લેટ ની મેઈન્ટેનન્સની રકમ બિલ્ડરે સોસાયટીમાં જમા કરવાની રહેશે.</li>
              <li>જે પણ ફ્લેટ ની દસ્તાવેજ ન થયો હોય એ પણ ફ્લેટ માલિકોએ સોસાયટીમાં મેઈન્ટેનન્સ ની રકમ ફરજિયાત જમા કરવી.</li>
            </ul>
          </div>

          {/* Signatures */}
          <div className="pt-8 text-right text-xs font-semibold text-slate-800">
            <p>આભાર,</p>
            <p className="font-bold text-slate-900 pt-1">
              પ્રમુખ / મંત્રી / ખજાનચી
            </p>
            <p className="text-slate-600 text-[11px]">
              {noticeData.society_legal_name || "શિલ્પ સેરેનિટી કો ઓપરેટિવ હાઉસિંગ સર્વિસ સોસાયટી લિમિટેડ"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
