import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import DashboardShell from "../../../components/layout/DashboardShell.jsx";
import PreApprovedTablePanel from "../components/preapproved/PreApprovedTablePanel.jsx";
import PreApprovedUploadPanel from "../components/preapproved/PreApprovedUploadPanel.jsx";
import PreApprovedEditDrawer from "../components/preapproved/PreApprovedEditDrawer.jsx";
import {
  fetchPreApproved,
  uploadPreApprovedCsv,
  updatePreApproved,
  deletePreApproved,
  clearPreApproved,
} from "../slices/adminSlice.js";
import getErrorMessage from "../../../utils/error.js";
import { showError, showSuccess } from "../../../components/ui/toast.jsx";

const formatDate = (value) => {
  if (!value) return "?";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "?";
  return date.toLocaleDateString();
};

const PreApprovedPage = () => {
  const dispatch = useDispatch();
  const { preApproved, preApprovedStatus, preApprovedActionStatus } = useSelector(
    (state) => state.admin,
  );

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [registrationFilter, setRegistrationFilter] = useState("all");
  const [file, setFile] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const params = useMemo(() => {
    const next = {};
    if (departmentFilter !== "all") next.department = departmentFilter;
    if (semesterFilter !== "all") next.semester = semesterFilter;
    if (registrationFilter === "registered") next.isRegistered = true;
    if (registrationFilter === "pending") next.isRegistered = false;
    return next;
  }, [departmentFilter, semesterFilter, registrationFilter]);

  useEffect(() => {
    dispatch(fetchPreApproved(params))
      .unwrap()
      .catch((error) => {
        showError(getErrorMessage(error, "Failed to load preapproved students."));
      });
  }, [dispatch, params]);

  const departments = useMemo(() => {
    const set = new Set(preApproved.map((s) => s.department).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [preApproved]);

  const rows = useMemo(() => {
    return preApproved
      .map((item) => ({
        ...item,
        createdAtLabel: formatDate(item.createdAt),
      }))
      .filter((item) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return item.registrationNumber?.toLowerCase().includes(q);
      });
  }, [preApproved, search]);

  const stats = useMemo(() => {
    const total = preApproved.length;
    const registered = preApproved.filter((s) => s.isRegistered).length;
    const pending = total - registered;
    return { total, registered, pending };
  }, [preApproved]);

  const handleUpload = async () => {
    if (!file) return;
    try {
      await dispatch(uploadPreApprovedCsv(file)).unwrap();
      showSuccess("CSV processed.");
      setFile(null);
      dispatch(fetchPreApproved(params));
    } catch (error) {
      showError(getErrorMessage(error, "Failed to upload CSV."));
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Clear all preapproved students?")) return;
    try {
      await dispatch(clearPreApproved()).unwrap();
      showSuccess("Preapproved list cleared.");
      dispatch(fetchPreApproved(params));
    } catch (error) {
      showError(getErrorMessage(error, "Failed to clear preapproved students."));
    }
  };

  const handleEdit = (item) => {
    setSelected(item);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setSelected(null);
    setDrawerOpen(false);
  };

  const handleSave = async (payload) => {
    if (!selected?._id) return;
    try {
      await dispatch(
        updatePreApproved({
          id: selected._id,
          payload: {
            registrationNumber: payload.registrationNumber,
            department: payload.department,
            semester: Number(payload.semester),
            isRegistered: payload.isRegistered,
          },
        }),
      ).unwrap();
      showSuccess("Preapproved student updated.");
      dispatch(fetchPreApproved(params));
      handleCloseDrawer();
    } catch (error) {
      showError(getErrorMessage(error, "Failed to update preapproved student."));
    }
  };

  const handleDelete = async (item) => {
    if (!item?._id) return;
    try {
      await dispatch(deletePreApproved(item._id)).unwrap();
      showSuccess("Preapproved student deleted.");
      dispatch(fetchPreApproved(params));
      if (selected?._id === item._id) handleCloseDrawer();
    } catch (error) {
      showError(getErrorMessage(error, "Failed to delete preapproved student."));
    }
  };

  return (
    <DashboardShell>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Preapproved</h1>
          <p className="text-sm text-slate-500">
            Control who can self-register and track activation.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="rounded-2xl card-surface px-3 py-2">
            <p className="text-[10px] text-slate-400">Total</p>
            <p className="text-sm font-semibold text-slate-700">{stats.total}</p>
          </div>
          <div className="rounded-2xl card-surface px-3 py-2">
            <p className="text-[10px] text-slate-400">Registered</p>
            <p className="text-sm font-semibold text-emerald-600">{stats.registered}</p>
          </div>
          <div className="rounded-2xl card-surface px-3 py-2">
            <p className="text-[10px] text-slate-400">Pending</p>
            <p className="text-sm font-semibold text-amber-600">{stats.pending}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <PreApprovedTablePanel
          search={search}
          setSearch={setSearch}
          departmentFilter={departmentFilter}
          setDepartmentFilter={setDepartmentFilter}
          semesterFilter={semesterFilter}
          setSemesterFilter={setSemesterFilter}
          registrationFilter={registrationFilter}
          setRegistrationFilter={setRegistrationFilter}
          departments={departments}
          rows={rows}
          status={preApprovedStatus}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <PreApprovedUploadPanel
          file={file}
          setFile={setFile}
          onUpload={handleUpload}
          onClearAll={handleClearAll}
          actionStatus={preApprovedActionStatus}
        />
      </div>

      <PreApprovedEditDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        item={selected}
        onSave={handleSave}
        onDelete={handleDelete}
        actionStatus={preApprovedActionStatus}
      />
    </DashboardShell>
  );
};

export default PreApprovedPage;
