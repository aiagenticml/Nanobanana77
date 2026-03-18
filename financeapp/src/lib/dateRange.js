function formatDate(d) {
  return d.toISOString().split('T')[0];
}

export function getDateRange(period, date) {
  if (period === 'day') {
    const d = formatDate(date);
    return { startDate: d, endDate: d };
  }

  if (period === 'week') {
    const day = date.getDay();
    const monday = new Date(date);
    monday.setDate(date.getDate() - ((day + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { startDate: formatDate(monday), endDate: formatDate(sunday) };
  }

  if (period === 'month') {
    const year = date.getFullYear();
    const month = date.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    return { startDate: formatDate(first), endDate: formatDate(last) };
  }
}
