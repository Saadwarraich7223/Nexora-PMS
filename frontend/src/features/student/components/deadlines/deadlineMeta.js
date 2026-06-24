const statusMeta = {
  overdue: {
    label: "Overdue",
    className: "student-status-rejected",
  },
  today: {
    label: "Due Today",
    className: "student-status-pending",
  },
  upcoming: {
    label: "Upcoming",
    className: "student-status-under_review",
  },
};

const getDaysUntil = (dateValue) => {
  if (!dateValue) return null;
  const now = new Date();
  const due = new Date(dateValue);
  if (Number.isNaN(due.getTime())) return null;

  const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const ms = startOfDue.getTime() - startOfNow.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
};

const resolveDeadlineStatus = (dateValue) => {
  const days = getDaysUntil(dateValue);
  if (days === null) return statusMeta.upcoming;
  if (days < 0) return statusMeta.overdue;
  if (days === 0) return statusMeta.today;
  return statusMeta.upcoming;
};

export { getDaysUntil, resolveDeadlineStatus };
