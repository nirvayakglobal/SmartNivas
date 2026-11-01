import React from "react";
import {
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Building,
  Wrench,
  Droplet,
  Layers,
} from "lucide-react";

export function TurnaroundTimeAndTrendsReport({ tatData, trendData }) {
  const statusSummary = trendData?.status_summary || {};
  const wingBreakdown = trendData?.wing_breakdown || [];
  const overdueCount = trendData?.overdue_tickets_count || 0;

  // Find max complaints for relative bar widths
  const maxWingCount = Math.max(
    ...wingBreakdown.map((item) => item.ticket_count),
    1
  );

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Open / In-Progress
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {(statusSummary["OPEN"] || 0) +
              (statusSummary["ASSIGNED"] || 0) +
              (statusSummary["IN_PROGRESS"] || 0)}
          </p>
          <p className="text-2xs text-slate-400 mt-1">Active complaints in workflow</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Overdue Tickets
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-600 mt-2">{overdueCount}</p>
          <p className="text-2xs text-red-500 font-medium mt-1">
            Breached target SLA resolution window
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Resolved Tickets
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">
            {statusSummary["RESOLVED"] || 0}
          </p>
          <p className="text-2xs text-slate-400 mt-1">Closed satisfactorily</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Top Incident Wing
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {wingBreakdown.length > 0 ? wingBreakdown[0].wing_name : "N/A"}
          </p>
          <p className="text-2xs text-amber-600 font-medium mt-1">
            {wingBreakdown.length > 0
              ? `${wingBreakdown[0].ticket_count} tickets (${wingBreakdown[0].category_name})`
              : "No issues recorded"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Turnaround Time (TAT) Analytics Table & Bar */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Turnaround Time (TAT) Analytics by Category
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Average hours taken from ticket creation to resolution vs. SLA target.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-2xs uppercase tracking-wider text-slate-400 font-semibold">
                  <th className="py-2.5">Category</th>
                  <th className="py-2.5 text-center">SLA Target</th>
                  <th className="py-2.5 text-center">Resolved</th>
                  <th className="py-2.5 text-right">Avg TAT</th>
                  <th className="py-2.5 text-right">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(tatData || []).map((row) => {
                  const avgTat = parseFloat(row.avg_turnaround_hours);
                  const slaTarget = row.sla_resolution_hours;
                  const isWithinSla = avgTat <= slaTarget;

                  return (
                    <tr key={row.category_id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 font-semibold text-slate-800">
                        {row.category_name}
                      </td>
                      <td className="py-3 text-center text-slate-500 font-mono">
                        {slaTarget}h
                      </td>
                      <td className="py-3 text-center">
                        <span className="font-semibold text-slate-700">
                          {row.total_resolved_tickets}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-slate-900">
                        {row.total_resolved_tickets > 0 ? `${avgTat}h` : "—"}
                      </td>
                      <td className="py-3 text-right">
                        {row.total_resolved_tickets > 0 ? (
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-2xs font-semibold ${
                              isWithinSla
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {isWithinSla
                              ? `✓ Within SLA (-${(slaTarget - avgTat).toFixed(1)}h)`
                              : `⚠️ Exceeded (+${(avgTat - slaTarget).toFixed(1)}h)`}
                          </span>
                        ) : (
                          <span className="text-2xs text-slate-400 italic">No samples</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Volume & Recurring Issues by Wing */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              Volume & Recurring Issues by Wing
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Highlighting frequency hot-spots (e.g. frequent water leaks in Wing B).
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {wingBreakdown.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No tickets recorded yet.
              </div>
            ) : (
              wingBreakdown.map((wb, index) => {
                const percentage = Math.round((wb.ticket_count / maxWingCount) * 100);
                const isHighVolume = wb.ticket_count >= 3;

                return (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        {wb.wing_name}
                        <span className="text-2xs font-normal text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {wb.category_name}
                        </span>
                        {isHighVolume && (
                          <span className="text-2xs text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-medium">
                            Recurring Trend
                          </span>
                        )}
                      </span>
                      <span className="font-mono text-slate-700">
                        {wb.ticket_count} {wb.ticket_count === 1 ? "ticket" : "tickets"}
                      </span>
                    </div>

                    {/* Visual Bar Indicator */}
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isHighVolume
                            ? "bg-amber-500"
                            : "bg-blue-600"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Context Alert for Recurring Structural Issues */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2.5 mt-4">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold">Maintenance Intelligence Alert:</span>
              <p className="mt-0.5 leading-relaxed text-slate-700">
                Wing B exhibits recurring plumbing seepage incidents. Inspecting the common riser shaft and pressure reducing valves (PRVs) across B-302 and B-402 is recommended to prevent repeated complaints.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
