import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiUsers, FiTrash2, FiUploadCloud } from "react-icons/fi";
import DashboardShell from "../../../components/layout/DashboardShell.jsx";
import StudentsTablePanel from "../components/students/StudentsTablePanel.jsx";
import StudentDetailDrawer from "../components/students/StudentDetailDrawer.jsx";
import PreApprovedUploadPanel from "../components/preapproved/PreApprovedUploadPanel.jsx";
import PreApprovedEditDrawer from "../components/preapproved/PreApprovedEditDrawer.jsx";
import StatsCards from "../components/StatsCards.jsx";
import {
  fetchStudents,
  fetchStudentDetail,
  uploadPreApprovedCsv,
  updatePreApproved,
  deletePreApproved,
  clearPreApproved,
} from "../slices/adminSlice.js";
import getErrorMessage from "../../../utils/error.js";
import { showError, showSuccess } from "../../../components/ui/toast.jsx";

const StudentsPage = () => {
  const dispatch = useDispatch();
  const {
    students,
    studentsStatus,
    studentDetail,
    studentDetailStatus,
    preApprovedActionStatus,
  } = useSelector((state) => state.admin);

  const [statusTab, setStatusTab] = useState("all");
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [file, setFile] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [lastPreviewRows, setLastPreviewRows] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedPreApproved, setSelectedPreApproved] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedActive, setSelectedActive] = useState(null);

  useEffect(() => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length <= 1) {
         setPreviewRows([]);
         return;
      }
      const rows = lines.slice(1, 6).map((line) => {
        const [registrationNumber, department, semester] = line.split(",");
        return {
          registrationNumber: registrationNumber?.trim() || "?",
          department: department?.trim() || "?",
          semester: semester?.trim() || "?",
        };
      });
      setPreviewRows(rows);
    };
    reader.readAsText(file);
  }, [file]);

  const params = useMemo(() => {
    const next = {};
    if (statusTab !== "all") next.status = statusTab;
    if (departmentFilter !== "all") next.department = departmentFilter;
    if (semesterFilter !== "all") next.semester = semesterFilter;
    if (search.trim()) next.search = search.trim();
    return next;
  }, [statusTab, departmentFilter, semesterFilter, search]);

  useEffect(() => {
    dispatch(fetchStudents(params))
      .unwrap()
      .catch((error) => {
        showError(getErrorMessage(error, "Failed to load students."));
      });
  }, [dispatch, params]);

  const departments = useMemo(() => {
    const set = new Set(students.map((s) => s.department).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [students]);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return students.filter((row) => {
      if (!query) return true;
      const name = row.name?.toLowerCase() || "";
      const email = row.email?.toLowerCase() || "";
      const reg = row.registrationNumber?.toLowerCase() || "";
      return (
        name.includes(query) || email.includes(query) || reg.includes(query)
      );
    });
  }, [students, search]);

  const stats = useMemo(() => {
    const total = students.length;
    const activeData = students.filter((s) => s.source === "active").length;
    const preapprovedData = total - activeData;
    
    return [
      { label: "Total Students", value: total, sub: "Registered Assets" },
      { label: "Active Cohort", value: activeData, sub: "Verified Personnel" },
      { label: "Pre-Approved", value: preapprovedData, sub: "Pending Deployment" },
      { label: "System Load", value: "94%", sub: "Memory Allocation" }
    ];
  }, [students]);

  const handleView = (row) => {
    if (row.source !== "active") return;
    setSelectedActive(row);
    setDetailOpen(true);
    dispatch(fetchStudentDetail(row._id))
      .unwrap()
      .catch((error) => {
        showError(getErrorMessage(error, "Failed to load student detail."));
      });
  };

  const handleEdit = (row) => {
    setSelectedPreApproved(row);
    setEditOpen(true);
  };

  const handleDelete = async (row) => {
    if (!row?._id) return;
    try {
      await dispatch(deletePreApproved(row._id)).unwrap();
      showSuccess("Student record deleted.");
      dispatch(fetchStudents(params));
    } catch (error) {
      showError(
        getErrorMessage(error, "Failed to delete student."),
      );
    }
  };

  const handleSave = async (payload) => {
    if (!selectedPreApproved?._id) return;
    try {
      await dispatch(
        updatePreApproved({
          id: selectedPreApproved._id,
          payload: {
            registrationNumber: payload.registrationNumber,
            department: payload.department,
            semester: Number(payload.semester),
            isRegistered: payload.isRegistered,
          },
        }),
      ).unwrap();
      showSuccess("Student record updated.");
      dispatch(fetchStudents(params));
      setEditOpen(false);
      setSelectedPreApproved(null);
    } catch (error) {
      showError(
        getErrorMessage(error, "Failed to update student."),
      );
    }
  };

  const handleResetUpload = () => {
    setFile(null);
    setPreviewRows([]);
    setLastPreviewRows([]);
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      await dispatch(uploadPreApprovedCsv(file)).unwrap();
      showSuccess("CSV upload successful.");
      setLastPreviewRows(previewRows);
      setPreviewRows([]);
      setFile(null);
      dispatch(fetchStudents(params));
    } catch (error) {
      showError(getErrorMessage(error, "Failed to upload CSV."));
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Clear all preapproved students?")) return;
    try {
      await dispatch(clearPreApproved()).unwrap();
      showSuccess("Preapproved list cleared.");
      dispatch(fetchStudents(params));
    } catch (error) {
      showError(
        getErrorMessage(error, "Failed to clear students."),
      );
    }
  };

  return (
    <DashboardShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Students Hub</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Active Personnel & Pre-Approved Registrations
          </p>
        </div>
        
        <div className="flex items-center gap-3">
           <button
              onClick={handleClearAll}
              className="h-10 px-5 rounded-2xl bg-white border border-rose-100 text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center gap-2"
           >
              <FiTrash2 size={14} /> Clear List
           </button>
           <button
              className="h-10 px-5 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-200"
           >
              <FiUploadCloud size={14} /> Bulk Upload
           </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Strategy Layer */}
        <StatsCards stats={stats} status={studentsStatus} />

        {/* Management Layer: Hub & Tables */}
        <StudentsTablePanel
          statusTab={statusTab}
          setStatusTab={setStatusTab}
          search={search}
          setSearch={setSearch}
          departmentFilter={departmentFilter}
          setDepartmentFilter={setDepartmentFilter}
          semesterFilter={semesterFilter}
          setSemesterFilter={setSemesterFilter}
          departments={departments}
          rows={rows}
          status={studentsStatus}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Action Layer: Upload */}
        <PreApprovedUploadPanel
          file={file}
          setFile={setFile}
          onUpload={handleUpload}
          onReset={handleResetUpload}
          actionStatus={preApprovedActionStatus}
          previewRows={previewRows.length ? previewRows : lastPreviewRows}
          previewLabel={
            previewRows.length
              ? "Upload Preview"
              : "Last Upload Results"
          }
        />
      </div>

      <PreApprovedEditDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        item={selectedPreApproved}
        onSave={handleSave}
        onDelete={handleDelete}
        actionStatus={preApprovedActionStatus}
      />

      <StudentDetailDrawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        detail={studentDetail?.student || studentDetail}
        status={studentDetailStatus}
      />
    </DashboardShell>
  );
};

export default StudentsPage;
