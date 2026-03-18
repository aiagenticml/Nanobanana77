import { useMemo } from 'react';

const PERIODS = ['day', 'week', 'month'];

function formatDayLabel(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatWeekLabel(date) {
  const day = date.getDay();
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((day + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const monMonth = monday.toLocaleDateString('en-US', { month: 'short' });
  const sunMonth = sunday.toLocaleDateString('en-US', { month: 'short' });
  const year = sunday.getFullYear();

  if (monMonth === sunMonth) {
    return `${monMonth} ${monday.getDate()} \u2013 ${sunday.getDate()}, ${year}`;
  }
  return `${monMonth} ${monday.getDate()} \u2013 ${sunMonth} ${sunday.getDate()}, ${year}`;
}

function generateMonthOptions() {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    options.push({ label, value, date: d });
  }
  return options;
}

export default function PeriodSelector({ period, onPeriodChange, selectedDate, onDateChange }) {
  const monthOptions = useMemo(() => generateMonthOptions(), []);

  const shiftDate = (delta) => {
    const next = new Date(selectedDate);
    if (period === 'day') {
      next.setDate(next.getDate() + delta);
    } else if (period === 'week') {
      next.setDate(next.getDate() + delta * 7);
    }
    onDateChange(next);
  };

  const handleMonthSelect = (e) => {
    const [year, month] = e.target.value.split('-').map(Number);
    onDateChange(new Date(year, month - 1, 1));
  };

  const currentMonthValue = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;

  return (
    <div className="flex flex-col gap-2">
      {/* Row 1: Period toggles */}
      <div className="flex flex-row gap-1">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => onPeriodChange(p)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize ${
              period === p
                ? 'text-accent border-b-2 border-accent'
                : 'bg-card text-text-muted'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Row 2: Contextual date picker */}
      <div className="flex items-center gap-2">
        {period === 'month' ? (
          <select
            value={currentMonthValue}
            onChange={handleMonthSelect}
            className="bg-input border border-border text-text-primary rounded-lg px-3 py-1.5 text-sm"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <>
            <button
              onClick={() => shiftDate(-1)}
              className="text-text-muted hover:text-text-primary px-2 py-1 rounded"
            >
              &lt;
            </button>
            <span className="text-text-primary font-medium text-sm">
              {period === 'day' ? formatDayLabel(selectedDate) : formatWeekLabel(selectedDate)}
            </span>
            <button
              onClick={() => shiftDate(1)}
              className="text-text-muted hover:text-text-primary px-2 py-1 rounded"
            >
              &gt;
            </button>
          </>
        )}
      </div>
    </div>
  );
}
