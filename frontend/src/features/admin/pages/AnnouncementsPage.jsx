import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiRadio, FiBell, FiPlus } from "react-icons/fi";
import DashboardShell from "../../../components/layout/DashboardShell.jsx";
import AnnouncementFormPanel from "../components/announcements/AnnouncementFormPanel.jsx";
import AnnouncementsTablePanel from "../components/announcements/AnnouncementsTablePanel.jsx";
import AnnouncementInsightsPanel from "../components/announcements/AnnouncementInsightsPanel.jsx";
import {
  fetchAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} from "../slices/adminSlice.js";
import getErrorMessage from "../../../utils/error.js";
import { showError, showSuccess } from "../../../components/ui/toast.jsx";

const formatDate = (value) => {
  if (!value) return "?";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "?";
  return date.toLocaleDateString();
};

const AnnouncementsPage = () => {
  const dispatch = useDispatch();
  const { announcements, announcementsStatus, announcementsActionStatus } =
    useSelector((state) => state.admin);

  const [form, setForm] = useState({
    title: "",
    message: "",
    priority: "low",
    link: "",
    target: "all",
    department: "",
    semester: "",
  });
  const [referenceTime] = useState(() => Date.now());

  useEffect(() => {
    dispatch(fetchAnnouncements())
      .unwrap()
      .catch((error) => {
        showError(getErrorMessage(error, "Failed to load broadcast notifications."));
      });
  }, [dispatch]);

  const rows = useMemo(() => {
    return announcements.map((row) => ({
      ...row,
      createdAtLabel: formatDate(row.createdAt),
      audienceLabel:
        row.targetRoles?.length > 0
          ? row.targetRoles.join(", ")
          : row.department || row.semester
            ? "Filtered"
            : "All",
    }));
  }, [announcements]);

  const stats = useMemo(() => {
    const total = rows.length;
    const high = rows.filter((row) => row.priority === "high").length;
    const recipients = rows.reduce(
      (acc, row) => acc + (Number(row.recipients) || 0),
      0,
    );
    const reads = rows.reduce((acc, row) => acc + (Number(row.readCount) || 0), 0);
    const readRate =
      recipients > 0 ? Math.round((reads / Math.max(recipients, 1)) * 100) : 0;
    const weekAgo = referenceTime - 7 * 24 * 60 * 60 * 1000;
    const recent = rows.filter((row) => {
      const stamp = new Date(row.createdAt).getTime();
      return Number.isFinite(stamp) && stamp >= weekAgo;
    }).length;

    return { total, high, readRate, recent };
  }, [rows, referenceTime]);

  const handleSubmit = async () => {
    if (!form.title || !form.message) {
      showError("Title and message are required.");
      return;
    }
    try {
      const targetRoles =
        form.target === "students"
          ? ["student"]
          : form.target === "teachers"
            ? ["teacher"]
            : [];

      await dispatch(
        createAnnouncement({
          title: form.title,
          message: form.message,
          priority: form.priority,
          link: form.link || null,
          targetRoles,
          department: form.department || null,
          semester: form.semester ? Number(form.semester) : null,
        }),
      ).unwrap();
      showSuccess("Broadcast notification sent.");
      setForm({
        title: "",
        message: "",
        priority: "low",
        link: "",
        target: "all",
        department: "",
        semester: "",
      });
      dispatch(fetchAnnouncements());
    } catch (error) {
      showError(getErrorMessage(error, "Failed to send broadcast notification."));
    }
  };

  const handleDelete = async (row) => {
    try {
      await dispatch(deleteAnnouncement(row._id)).unwrap();
      showSuccess("Broadcast notification deleted.");
      dispatch(fetchAnnouncements());
    } catch (error) {
      showError(getErrorMessage(error, "Failed to delete broadcast notification."));
    }
  };

  const handleUseTemplate = (template) => {
    setForm((prev) => ({
      ...prev,
      title: template.title,
      message: template.message,
      priority: template.priority,
    }));
  };

  return (
    <DashboardShell>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Broadcast Notifications</h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
          Send System Updates to Students & Faculty
        </p>
      </div>

      <div className="space-y-6">
        {/* Management Layer: Form & Insights */}
        <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
          <AnnouncementFormPanel
            form={form}
            setForm={setForm}
            onSubmit={handleSubmit}
            actionStatus={announcementsActionStatus}
          />
          <AnnouncementInsightsPanel
            stats={stats}
            onUseTemplate={handleUseTemplate}
          />
        </div>

        {/* History Layer: Registry */}
        <AnnouncementsTablePanel
          rows={rows}
          status={announcementsStatus}
          onDelete={handleDelete}
        />
      </div>
    </DashboardShell>
  );
};

export default AnnouncementsPage;

