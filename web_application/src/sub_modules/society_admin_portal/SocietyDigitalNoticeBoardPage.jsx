import React, { useState, useEffect } from "react";
import {
  Bell,
  PlusCircle,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  Megaphone,
  X,
} from "lucide-react";

export function SocietyDigitalNoticeBoardPage() {
  const [societyNoticesList, setSocietyNoticesList] = useState([]);
  const [isLoadingNotices, setIsLoadingNotices] = useState(true);
  const [isPublishingNoticeModalOpen, setIsPublishingNoticeModalOpen] =
    useState(false);

  // New Notice State
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeBodyContent, setNoticeBodyContent] = useState("");
  const [isSubmittingNotice, setIsSubmittingNotice] = useState(false);
  const [noticeFeedbackMessage, setNoticeFeedbackMessage] = useState("");
  const [noticeErrorMessage, setNoticeErrorMessage] = useState("");

  const fetchNotices = async () => {
    setIsLoadingNotices(true);
    try {
      const storedAuthToken = localStorage.getItem("smart_nivas_auth_token");
      const httpApiResponse = await fetch("/api/admin/notices", {
        headers: { Authorization: `Bearer ${storedAuthToken}` },
      });
      const responseJsonData = await httpApiResponse.json();
      if (responseJsonData.success) {
        setSocietyNoticesList(responseJsonData.data);
      }
    } catch (networkError) {
      console.error("Failed to load notices:", networkError);
    } finally {
      setIsLoadingNotices(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handlePublishNoticeSubmit = async (formSubmitEvent) => {
    formSubmitEvent.preventDefault();
    setIsSubmittingNotice(true);
    setNoticeFeedbackMessage("");
    setNoticeErrorMessage("");

    try {
      const storedAuthToken = localStorage.getItem("smart_nivas_auth_token");
      const httpApiResponse = await fetch("/api/admin/notices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedAuthToken}`,
        },
        body: JSON.stringify({
          notice_title: noticeTitle,
          notice_body_content: noticeBodyContent,
        }),
      });

      const responseJsonData = await httpApiResponse.json();
      if (responseJsonData.success) {
        setNoticeFeedbackMessage(responseJsonData.message);
        setNoticeTitle("");
        setNoticeBodyContent("");
        setIsPublishingNoticeModalOpen(false);
        fetchNotices();
      } else {
        setNoticeErrorMessage(
          responseJsonData.message || "Failed to publish notice."
        );
      }
    } catch (networkError) {
      setNoticeErrorMessage("Network error publishing notice.");
    } finally {
      setIsSubmittingNotice(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Megaphone className="w-7 h-7 text-blue-600" />
            Society Digital Notice Board
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Broadcast official circulars, AGM reminders, and maintenance updates to all resident apps.
          </p>
        </div>

        <button
          onClick={() => setIsPublishingNoticeModalOpen(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all text-sm"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Publish New Notice</span>
        </button>
      </div>

      {noticeFeedbackMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{noticeFeedbackMessage}</span>
        </div>
      )}

      {/* Notices Feed */}
      {isLoadingNotices ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          Loading digital notices...
        </div>
      ) : societyNoticesList.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 italic text-sm shadow-card">
          No notices published yet. Click "Publish New Notice" to broadcast circulars to residents.
        </div>
      ) : (
        <div className="space-y-4">
          {societyNoticesList.map((noticeRecord) => (
            <div
              key={noticeRecord.notice_id}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-6 shadow-card space-y-3 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md inline-block mb-1.5">
                    Official Circular
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">
                    {noticeRecord.notice_title}
                  </h3>
                </div>

                <div className="text-right text-xs font-mono text-slate-500 shrink-0">
                  <div className="flex items-center gap-1 justify-end text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {new Date(noticeRecord.created_at).toLocaleDateString(
                        "en-IN",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    By {noticeRecord.publisher_name}
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {noticeRecord.notice_body_content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Publish Notice Modal */}
      {isPublishingNoticeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-600" />
                Publish Digital Notice
              </h3>
              <button
                onClick={() => setIsPublishingNoticeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {noticeErrorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{noticeErrorMessage}</span>
              </div>
            )}

            <form onSubmit={handlePublishNoticeSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                  Notice Headline *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scheduled Overhead Water Tank Cleaning"
                  value={noticeTitle}
                  onChange={(event) => setNoticeTitle(event.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                  Circular Content & Details *
                </label>
                <textarea
                  rows="5"
                  required
                  placeholder="Water supply will be paused between 10:00 AM and 2:00 PM this Sunday..."
                  value={noticeBodyContent}
                  onChange={(event) => setNoticeBodyContent(event.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPublishingNoticeModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNotice}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-xl text-sm shadow-sm transition-all disabled:opacity-50"
                >
                  {isSubmittingNotice ? "Broadcasting..." : "Broadcast Notice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
