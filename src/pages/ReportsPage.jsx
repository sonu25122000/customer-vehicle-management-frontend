import { Fragment, useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Pagination from '../components/Pagination';
import StatTile from '../components/StatTile';
import { RouteIcon, RupeeIcon, UsersIcon, CheckCircleIcon, ChevronDownIcon, ChevronRightIcon } from '../components/icons';
import {
  fetchDailyReports,
  fetchMonthlyReports,
  fetchYearlyReports,
  fetchCustomReport,
  fetchReportJobs,
  runReports,
  retryReportJob,
} from '../api/reports';

const TABS = [
  { key: 'daily', label: 'Daily' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
  { key: 'custom', label: 'Custom' },
  { key: 'jobs', label: 'Job History' },
];

// Shown as money; every other metric is a count.
const MONEY = new Set(['amount', 'toll', 'vehicleExpense']);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const thClass = 'whitespace-nowrap bg-gray-50 px-3 py-2 text-left text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500';
const tdClass = 'whitespace-nowrap border-t border-gray-100 px-3 py-2 align-middle';
const inputClass =
  'rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-100';

function money(v) {
  return `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function metricValue(key, v) {
  return MONEY.has(key) ? money(v) : Number(v || 0).toLocaleString('en-IN');
}

// 'YYYY-MM-DD' in the browser's local time (the business is in one timezone), shifted by days.
function localDate(days = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function rowLabel(scope, key) {
  if (scope === 'daily') {
    return new Date(`${key}T00:00:00Z`).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' }).replace(/ /g, '-');
  }
  if (scope === 'monthly') return `${MONTHS[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`;
  return key;
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function sumRows(rows, metrics) {
  return Object.fromEntries(metrics.map((m) => [m.key, rows.reduce((s, r) => s + Number(r[m.key] || 0), 0)]));
}

function ReportTable({ scope, rows, metrics, loading, empty }) {
  if (loading) return <div className="h-48 animate-pulse rounded-xl bg-white shadow-sm" />;
  if (!rows.length) return <div className="rounded-xl bg-white p-12 text-center text-sm text-gray-500 shadow-sm">{empty}</div>;
  const totals = sumRows(rows, metrics.filter((m) => m.key !== 'repeatCustomers'));
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
      <table className="w-full min-w-[1100px] border-collapse text-xs">
        <thead>
          <tr>
            <th className={thClass}>{scope === 'daily' ? 'Date' : scope === 'monthly' ? 'Month' : 'Year'}</th>
            {metrics.map((m) => (
              <th key={m.key} className={`${thClass} text-right`}>
                {m.label}
              </th>
            ))}
            <th className={thClass}>Updated</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="hover:bg-gray-50">
              <td className={`${tdClass} font-semibold text-gray-900`}>{rowLabel(scope, r.key)}</td>
              {metrics.map((m) => (
                <td key={m.key} className={`${tdClass} text-right tabular-nums text-gray-700`}>
                  {metricValue(m.key, r[m.key])}
                </td>
              ))}
              <td className={`${tdClass} text-gray-400`}>{formatDateTime(r.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
        {rows.length > 1 && (
          <tfoot>
            <tr className="bg-gray-50 font-semibold text-gray-900">
              <td className={tdClass}>Total</td>
              {metrics.map((m) => (
                <td key={m.key} className={`${tdClass} text-right tabular-nums`} title={m.key === 'repeatCustomers' ? 'Not added up — the same customer can repeat on several days' : undefined}>
                  {m.key === 'repeatCustomers' ? '—' : metricValue(m.key, totals[m.key])}
                </td>
              ))}
              <td className={tdClass} />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

function JobStatusBadge({ status }) {
  const cls = {
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    failed: 'bg-red-50 text-red-700 ring-red-100',
    running: 'bg-blue-50 text-blue-700 ring-blue-100',
  }[status];
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[0.7rem] font-semibold capitalize ring-1 ${cls}`}>{status}</span>;
}

function JobHistory({ refreshKey }) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [retrying, setRetrying] = useState(null);

  const load = useCallback(() => {
    fetchReportJobs({ page, status })
      .then(setResult)
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load job history'));
  }, [page, status]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  async function retry(job) {
    setRetrying(job._id);
    try {
      const res = await retryReportJob(job._id);
      if (res.data.status === 'success') toast.success(res.message);
      else toast.error(res.message);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Retry failed');
    } finally {
      setRetrying(null);
    }
  }

  const jobs = result?.data || [];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs text-gray-500">
          Every run of the report engine — nightly, manual and retries. A metric that fails is retried automatically up to{' '}
          {result?.maxRetries ?? 5} times before the run is marked failed.
        </p>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={`${inputClass} ml-auto cursor-pointer font-semibold`}>
          <option value="">All runs</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="running">Running</option>
        </select>
      </div>
      {!result ? (
        <div className="h-48 animate-pulse rounded-xl bg-white shadow-sm" />
      ) : !jobs.length ? (
        <div className="rounded-xl bg-white p-12 text-center text-sm text-gray-500 shadow-sm">No runs yet.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full min-w-[960px] border-collapse text-xs">
            <thead>
              <tr>
                <th className={`${thClass} w-8`} />
                <th className={thClass}>Started</th>
                <th className={thClass}>For Date</th>
                <th className={thClass}>Trigger</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Metrics</th>
                <th className={thClass}>Duration</th>
                <th className={thClass}>Error</th>
                <th className={thClass}>Action</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const done = job.steps.filter((s) => s.status === 'success').length;
                const retried = job.steps.filter((s) => s.attempts > 1).length;
                const open = expanded === job._id;
                return (
                  <Fragment key={job._id}>
                    <tr className="hover:bg-gray-50">
                      <td className={tdClass}>
                        <button
                          type="button"
                          onClick={() => setExpanded(open ? null : job._id)}
                          aria-label={open ? 'Hide metrics' : 'Show metrics'}
                          className="cursor-pointer rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                        >
                          {open ? <ChevronDownIcon className="h-3.5 w-3.5" /> : <ChevronRightIcon className="h-3.5 w-3.5" />}
                        </button>
                      </td>
                      <td className={tdClass}>{formatDateTime(job.startedAt)}</td>
                      <td className={`${tdClass} font-semibold text-gray-900`}>{rowLabel('daily', job.date)}</td>
                      <td className={`${tdClass} capitalize text-gray-600`}>
                        {job.trigger === 'schedule' ? 'Nightly' : job.trigger}
                        {job.triggeredBy && job.trigger !== 'schedule' && <span className="ml-1 text-gray-400">({job.triggeredBy})</span>}
                      </td>
                      <td className={tdClass}>
                        <JobStatusBadge status={job.status} />
                      </td>
                      <td className={`${tdClass} tabular-nums text-gray-700`}>
                        {done}/{job.steps.length}
                        {retried > 0 && <span className="ml-1 text-amber-600">({retried} retried)</span>}
                      </td>
                      <td className={`${tdClass} tabular-nums text-gray-500`}>{job.durationMs ? `${(job.durationMs / 1000).toFixed(1)}s` : '-'}</td>
                      <td className="max-w-xs truncate border-t border-gray-100 px-3 py-2 align-middle text-red-600" title={job.error}>
                        {job.error || '-'}
                      </td>
                      <td className={tdClass}>
                        {job.status === 'failed' && !job.retriedBy ? (
                          <button
                            type="button"
                            onClick={() => retry(job)}
                            disabled={retrying === job._id}
                            className="cursor-pointer rounded-lg bg-blue-600 px-3 py-1.5 text-[0.7rem] font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
                          >
                            {retrying === job._id ? 'Retrying...' : 'Retry'}
                          </button>
                        ) : job.retriedBy ? (
                          <span className="text-gray-400">Retried</span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    </tr>
                    {open && (
                      <tr>
                        <td colSpan={9} className="border-t border-gray-100 bg-gray-50/60 px-4 py-3">
                          <div className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
                            {job.steps.map((s) => (
                              <div key={`${s.scope}-${s.metric}`} className="flex items-center gap-2 text-[0.7rem]">
                                <span
                                  className={`h-2 w-2 flex-shrink-0 rounded-full ${
                                    s.status === 'success' ? 'bg-emerald-500' : s.status === 'failed' ? 'bg-red-500' : 'bg-gray-300'
                                  }`}
                                />
                                <span className="capitalize text-gray-500">{s.scope}</span>
                                <span className="font-medium text-gray-800">{s.metric}</span>
                                {s.attempts > 1 && <span className="text-amber-600">{s.attempts} attempts</span>}
                                {s.error && (
                                  <span className="truncate text-red-600" title={s.error}>
                                    {s.error}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {result && (
        <Pagination page={page} totalPages={result.pagination.totalPages} total={result.pagination.total} limit={result.pagination.limit} onPageChange={setPage} />
      )}
    </div>
  );
}

function RunNow({ onDone }) {
  const [from, setFrom] = useState(localDate(-1));
  const [to, setTo] = useState('');
  const [running, setRunning] = useState(false);

  async function run() {
    setRunning(true);
    try {
      const res = await runReports(from, to);
      if (res.data.some((j) => j.status === 'failed')) toast.error(res.message);
      else toast.success(res.message);
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to run reports');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-xl bg-white p-3 shadow-sm">
      <div className="mr-auto">
        <p className="text-xs font-semibold text-gray-800">Run reports now</p>
        <p className="text-[0.7rem] text-gray-500">The engine runs every night for the day that ended. Run it here for a day, or a range of up to 31 days.</p>
      </div>
      <label className="flex flex-col gap-1 text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500">
        From
        <input type="date" value={from} max={localDate()} onChange={(e) => setFrom(e.target.value)} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500">
        To (optional)
        <input type="date" value={to} min={from} max={localDate()} onChange={(e) => setTo(e.target.value)} className={inputClass} />
      </label>
      <button
        type="button"
        onClick={run}
        disabled={running || !from}
        className="cursor-pointer rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
      >
        {running ? 'Running...' : 'Run'}
      </button>
    </div>
  );
}

export default function ReportsPage() {
  const [tab, setTab] = useState('daily');
  const [refreshKey, setRefreshKey] = useState(0);
  const [range, setRange] = useState({ from: localDate(-29), to: localDate() });
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [custom, setCustom] = useState({ from: localDate(-6), to: localDate() });
  const [data, setData] = useState({ rows: [], metrics: [], custom: null });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab === 'jobs') return undefined;
    let cancelled = false;
    setLoading(true);
    const request =
      tab === 'daily'
        ? fetchDailyReports(range)
        : tab === 'monthly'
          ? fetchMonthlyReports(year)
          : tab === 'yearly'
            ? fetchYearlyReports()
            : fetchCustomReport(custom.from, custom.to);
    request
      .then((res) => {
        if (cancelled) return;
        setData(tab === 'custom' ? { rows: [], metrics: res.metrics, custom: res.data } : { rows: res.data, metrics: res.metrics, custom: null });
      })
      .catch((err) => !cancelled && toast.error(err.response?.data?.message || 'Failed to load reports'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [tab, range, year, custom, refreshKey]);

  const metrics = data.metrics;
  const summary = tab === 'custom' ? data.custom : data.rows.length ? sumRows(data.rows, metrics) : null;

  return (
    <div className="flex flex-col gap-4">
      <RunNow onDone={() => setRefreshKey((k) => k + 1)} />

      <div className="no-scrollbar -mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0">
        <div className="flex w-max gap-1 rounded-lg bg-white p-1 shadow-sm">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`cursor-pointer rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                tab === t.key ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'jobs' ? (
        <JobHistory refreshKey={refreshKey} />
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-2">
            {tab === 'daily' && (
              <>
                <input type="date" value={range.from} max={range.to} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} className={inputClass} aria-label="From" />
                <span className="pb-2 text-xs text-gray-400">to</span>
                <input type="date" value={range.to} min={range.from} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} className={inputClass} aria-label="To" />
              </>
            )}
            {tab === 'monthly' && (
              <select value={year} onChange={(e) => setYear(e.target.value)} className={`${inputClass} cursor-pointer font-semibold`} aria-label="Year">
                {Array.from({ length: 6 }, (_, i) => String(new Date().getFullYear() - i)).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            )}
            {tab === 'custom' && (
              <>
                <input type="date" value={custom.from} max={custom.to} onChange={(e) => setCustom((r) => ({ ...r, from: e.target.value }))} className={inputClass} aria-label="From" />
                <span className="pb-2 text-xs text-gray-400">to</span>
                <input type="date" value={custom.to} min={custom.from} onChange={(e) => setCustom((r) => ({ ...r, to: e.target.value }))} className={inputClass} aria-label="To" />
              </>
            )}
            <p className="ml-auto text-[0.7rem] text-gray-400">
              Trips count towards the day they start on{tab === 'custom' ? ' · worked out live from the trips' : ' · filled in by the nightly engine'}.
            </p>
          </div>

          {summary && (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatTile icon={RouteIcon} label="Total Trips" value={summary.totalTrips.toLocaleString('en-IN')} sub={`${summary.completedTrips} completed`} accent="blue" />
              <StatTile icon={RupeeIcon} label="Amount" value={money(summary.amount)} sub={`Toll ${money(summary.toll)}`} accent="green" />
              <StatTile
                icon={UsersIcon}
                label="New Customers"
                value={summary.newCustomers.toLocaleString('en-IN')}
                sub={tab === 'custom' ? `${summary.repeatCustomers} repeat` : undefined}
                accent="violet"
              />
              <StatTile
                icon={CheckCircleIcon}
                label="Direct / Third Party"
                value={`${summary.directBookings} / ${summary.thirdPartyBookings}`}
                sub={`Vehicle expense ${money(summary.vehicleExpense)}`}
                accent="amber"
              />
            </div>
          )}

          {tab === 'custom' ? (
            loading || !data.custom ? (
              <div className="h-48 animate-pulse rounded-xl bg-white shadow-sm" />
            ) : (
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-gray-100 shadow-sm sm:grid-cols-5">
                {metrics.map((m) => (
                  <div key={m.key} className="bg-white px-4 py-3">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500">{m.label}</p>
                    <p className="mt-1 text-lg font-bold tabular-nums text-gray-900">{metricValue(m.key, data.custom[m.key])}</p>
                  </div>
                ))}
              </div>
            )
          ) : (
            <ReportTable
              scope={tab}
              rows={data.rows}
              metrics={metrics}
              loading={loading}
              empty="No report rows yet — they're filled in by the nightly run, or use “Run reports now” above."
            />
          )}
        </>
      )}
    </div>
  );
}
