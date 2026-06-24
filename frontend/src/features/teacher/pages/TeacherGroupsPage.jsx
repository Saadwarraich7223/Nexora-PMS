import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import DashboardShell from "../../../components/layout/DashboardShell.jsx";
import { fetchTeacherWorkspace } from "../slices/teacherSlice.js";
import getErrorMessage from "../../../utils/error.js";
import { showError } from "../../../components/ui/toast.jsx";
import teacherApi from "../api/teacherApi.js";
import GroupContributionsPanel from "../components/groups/GroupContributionsPanel.jsx";
import TraceabilityPanel from "../components/groups/TraceabilityPanel.jsx";
import GroupHealthSummary from "../components/groups/GroupHealthSummary.jsx";
import GitHubInsightsPanel from "../components/groups/GitHubInsightsPanel.jsx";
import html2pdf from "html2pdf.js";
import { FiDownload, FiUsers, FiLayers, FiFolder, FiStar, FiChevronRight, FiSearch } from "react-icons/fi";
import LoadingSkeleton from "../../../components/ui/LoadingSkeleton.jsx";

const TeacherGroupsPage = () => {
  const dispatch = useDispatch();
  const { groups, status, error } = useSelector((state) => state.teacher);

  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [detailsStatus, setDetailsStatus] = useState("idle");
  const [groupWorkspace, setGroupWorkspace] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    dispatch(fetchTeacherWorkspace())
      .unwrap()
      .catch((err) =>
        showError(getErrorMessage(err, "Failed to load groups.")),
      );
  }, [dispatch]);

  useEffect(() => {
    if (!selectedGroupId && groups.length > 0) {
      setSelectedGroupId(String(groups[0]._id));
    }
  }, [groups, selectedGroupId]);

  useEffect(() => {
    if (!selectedGroupId) {
      setGroupWorkspace(null);
      return;
    }

    const loadDetails = async () => {
      setDetailsStatus("loading");
      try {
        const workspaceRes =
          await teacherApi.fetchGroupWorkspace(selectedGroupId);
        setGroupWorkspace(workspaceRes.data || null);
        setDetailsStatus("succeeded");
      } catch (error) {
        setDetailsStatus("failed");
        setGroupWorkspace(null);
        showError(getErrorMessage(error, "Failed to load group workspace."));
      }
    };

    loadDetails();
  }, [selectedGroupId]);

  const filteredGroups = useMemo(() => {
     return groups.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [groups, searchTerm]);

  const selectedGroup = useMemo(
    () =>
      groups.find((group) => String(group._id) === String(selectedGroupId)) ||
      null,
    [groups, selectedGroupId],
  );

  return (
    <DashboardShell>
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Orchestrator Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              Group Command
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Strategic Cohort & Intelligence Registry
            </p>
          </div>

          <div className="flex items-center gap-3">
             <div className="relative group">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={14} />
                <input 
                   type="text"
                   placeholder="SEARCH COHORTS..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="h-10 pl-10 pr-4 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-200 transition-all w-full md:w-64 shadow-sm"
                />
             </div>
          </div>
        </div>

        {status === "failed" && (
          <div className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 border border-rose-100 rounded-xl">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Left Sidebar - Selection Registry */}
          <div className="lg:col-span-3 sticky top-6 space-y-4">
            <div className="glass-card bg-white/95 border border-slate-200/50 shadow-sm rounded-2xl p-5 flex flex-col max-h-[calc(100vh-140px)]">
              <div className="mb-6 flex items-center justify-between shrink-0">
                <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                  Assigned Units
                </h2>
                <span className="h-5 px-2 flex items-center bg-indigo-600 text-[9px] font-black text-white rounded-md uppercase tracking-wider">
                  {groups.length}
                </span>
              </div>

              <div className="space-y-2.5 overflow-y-auto pr-1 custom-scrollbar">
                {filteredGroups.map((group) => {
                  const isActive = String(group._id) === String(selectedGroupId);
                  return (
                    <button
                      key={group._id}
                      onClick={() => setSelectedGroupId(String(group._id))}
                      className={`w-full group/item relative rounded-xl border p-4 text-left transition-all duration-300 ${
                        isActive
                          ? "border-indigo-600 bg-indigo-600 text-white shadow-xl shadow-indigo-200 ring-4 ring-indigo-50"
                          : "border-slate-100 bg-white hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-[10px] font-black uppercase tracking-tight truncate transition-colors ${isActive ? "text-white" : "text-slate-800 group-hover/item:text-indigo-600"}`}>
                           {group.name}
                        </p>
                        {isActive && <FiChevronRight className="text-white" />}
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-colors ${
                            isActive ? "bg-white/10 border-white/20 text-white" : "bg-slate-50 border-slate-100 text-slate-400"
                        }`}>
                          {group.status || "active"}
                        </span>
                        <p className={`text-[9px] font-bold uppercase tracking-widest opacity-60 ${isActive ? "text-white" : "text-slate-400"}`}>
                           Sem {group.semester}
                        </p>
                      </div>
                    </button>
                  );
                })}

                {status !== "loading" && filteredGroups.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic px-4">
                      No matching records recovered.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Main Content */}
          <div className="lg:col-span-9 space-y-6">
            {!selectedGroup ? (
              <div className="glass-card bg-white/95 border-slate-200/50 shadow-sm rounded-2xl p-12 text-center border-dashed border-2 flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 shadow-inner border border-slate-100">
                  <FiLayers className="text-slate-300" size={24} />
                </div>
                <h2 className="text-lg font-black text-slate-800 tracking-tight">No Group Selected</h2>
                <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest leading-relaxed max-w-xs mx-auto">
                  Select a cohort registry to initialize tactical oversight telemetry.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Protocol Header & Export Action */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-card bg-white/95 border-slate-200/50 shadow-sm px-5 py-4 rounded-2xl">
                  <div className="flex items-center gap-4">
                     <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-900/10">
                        <FiUsers size={16} />
                     </div>
                     <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                          {selectedGroup.name}
                        </h3>
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">Operational Hub</p>
                     </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      const element = document.getElementById("group-report-content");
                      const opt = {
                        margin: [0.3, 0.3, 0.3, 0.3],
                        filename: `${selectedGroup.name.replace(/\s+/g, '_')}_Progress_Report.pdf`,
                        image: { type: 'jpeg', quality: 0.98 },
                        html2canvas: { scale: 2, useCORS: true, windowWidth: 1024 },
                        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
                      };
                      html2pdf().from(element).set(opt).save();
                    }}
                    className="flex items-center gap-2 h-10 px-6 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-95"
                  >
                    <FiDownload /> Export Dossier
                  </button>
                </div>

                <div id="group-report-content" className="space-y-6">
                  {/* Intelligence Layer */}
                  <GroupHealthSummary
                    workspace={groupWorkspace}
                    status={detailsStatus}
                  />

                  {/* High-Fidelity Registry Matrix */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {/* Leader Information */}
                    <div className="glass-card bg-white/95 border border-slate-100 shadow-sm rounded-2xl p-5 hover:border-indigo-100 transition-colors group">
                      <div className="flex items-center gap-2 mb-3">
                         <div className="h-6 w-6 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center border border-orange-100 shadow-sm"><FiStar size={11}/></div>
                         <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Architect</p>
                      </div>
                      {detailsStatus === "loading" ? <LoadingSkeleton className="h-8 w-3/4 rounded" /> : (
                        <>
                          <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate">
                            {groupWorkspace?.group?.leader?.name || selectedGroup.leader?.name || "Unknown"}
                          </p>
                          <p className="text-[9px] font-bold text-slate-400 truncate mt-1">
                            {groupWorkspace?.group?.leader?.email || selectedGroup.leader?.email || "N/A"}
                          </p>
                        </>
                      )}
                    </div>

                    {/* Team Distribution */}
                    <div className="glass-card bg-white/95 border border-slate-100 shadow-sm rounded-2xl p-5 hover:border-indigo-100 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                         <div className="flex items-center gap-2">
                           <div className="h-6 w-6 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center border border-indigo-100 shadow-sm"><FiUsers size={11}/></div>
                           <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Team</p>
                         </div>
                         {detailsStatus !== "loading" && (
                           <span className="text-[10px] font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">{
                             (groupWorkspace?.group?.members || selectedGroup.members || []).length
                           }</span>
                         )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {detailsStatus === "loading" ? <LoadingSkeleton className="h-5 w-full rounded" /> : 
                          (groupWorkspace?.group?.members || selectedGroup.members || []).slice(0, 3).map((member) => (
                            <span key={member.user?._id || member._id} className="text-[9px] font-black uppercase tracking-widest text-slate-600 bg-white border border-slate-100 px-2 py-1 rounded-md shadow-sm">
                              {member.user?.name?.split(' ')[0] || member.name?.split(' ')[0] || "MEM"}
                            </span>
                          ))
                        }
                        {detailsStatus !== "loading" && (groupWorkspace?.group?.members || selectedGroup.members || []).length > 3 && (
                          <span className="text-[9px] font-black text-slate-400 px-1 py-1">+{
                            (groupWorkspace?.group?.members || selectedGroup.members || []).length - 3
                          }</span>
                        )}
                      </div>
                    </div>

                    {/* Project Stage */}
                    <div className="glass-card bg-white/95 border border-slate-100 shadow-sm rounded-2xl p-5 hover:border-indigo-100 transition-colors">
                      <div className="flex items-center gap-2 mb-3">
                         <div className="h-6 w-6 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100 shadow-sm"><FiLayers size={11}/></div>
                         <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Stage</p>
                      </div>
                      {detailsStatus === "loading" ? <LoadingSkeleton className="h-8 w-3/4 rounded" /> : (
                        <>
                          <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate">
                            {groupWorkspace?.project?.title || selectedGroup.project?.title || "Not Proposed"}
                          </p>
                          <span className="inline-flex mt-2 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">
                            {groupWorkspace?.project?.status || selectedGroup.project?.status || "n/a"}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Technical Assets */}
                    <div className="glass-card bg-white/95 border border-slate-100 shadow-sm rounded-2xl p-5 hover:border-indigo-100 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                         <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-lg bg-violet-50 text-violet-500 flex items-center justify-center border border-violet-100 shadow-sm"><FiFolder size={11}/></div>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Assets</p>
                         </div>
                         {detailsStatus !== "loading" && (
                           <span className="text-[10px] font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">{
                             (groupWorkspace?.resources || []).length
                           }</span>
                         )}
                      </div>
                      <div className="space-y-2">
                        {detailsStatus === "loading" ? (
                          <LoadingSkeleton className="h-8 w-full rounded" />
                        ) : (groupWorkspace?.resources || []).length === 0 ? (
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">No assets recovered</p>
                        ) : (
                          (groupWorkspace?.resources || []).slice(0, 2).map((file) => (
                            <div key={file._id} className="text-[9px] font-black uppercase tracking-widest text-slate-600 truncate flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0"></span>
                              {file.originalName}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Analytical Depth Panels */}
                  <div className="grid gap-6">
                    <TraceabilityPanel
                      features={groupWorkspace?.features}
                      status={detailsStatus}
                    />

                    <div className="grid xl:grid-cols-2 gap-6">
                      <GroupContributionsPanel
                        contributions={groupWorkspace?.contributions}
                        status={detailsStatus}
                      />

                      <GitHubInsightsPanel
                        workspace={groupWorkspace}
                        status={detailsStatus}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
};

export default TeacherGroupsPage;
