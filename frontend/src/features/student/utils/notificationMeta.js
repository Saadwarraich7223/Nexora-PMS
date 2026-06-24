export const resolveNotificationSender = (notification) => {
  const createdBy =
    notification?.broadcastCreatedBy || notification?.announcement?.createdBy;
  if (createdBy?.name) {
    const role = createdBy.role || "admin";
    const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
    return {
      role,
      roleLabel,
      name: createdBy.name,
      tag: `From ${roleLabel}`,
    };
  }

  const type = String(notification?.type || "").toLowerCase();
  const link = String(notification?.link || "").toLowerCase();

  if (type === "announcement") {
    return { role: "admin", roleLabel: "Admin", name: "Admin Team", tag: "From Admin" };
  }

  if (link.includes("/teacher") || ["project", "feedback", "deadline", "meeting"].includes(type)) {
    return {
      role: "teacher",
      roleLabel: "Teacher",
      name: "Faculty Supervisor",
      tag: "From Teacher",
    };
  }

  if (link.includes("/student") || type === "request") {
    return { role: "student", roleLabel: "Student", name: "Group Member", tag: "From Student" };
  }

  if (["approval", "rejection"].includes(type)) {
    return { role: "admin", roleLabel: "Admin", name: "Admin Team", tag: "From Admin" };
  }

  return { role: "system", roleLabel: "System", name: "System", tag: "From System" };
};

export const normalizeNotificationPriority = (value) => {
  const priority = String(value || "low").toLowerCase();
  if (["high", "medium", "low"].includes(priority)) return priority;
  return "low";
};
