import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import DashboardShell from "../../../components/layout/DashboardShell.jsx";
import {
  cancelStudentSupervisorRequest,
  createStudentGroup,
  deleteStudentGroup,
  fetchStudentGroupsWorkspace,
  inviteStudent,
  leaveStudentGroup,
  removeStudentMember,
  requestJoinGroup,
  requestStudentSupervisor,
  respondInvite,
  respondJoinRequest,
  submitGroupForApproval,
  transferStudentLeadership,
} from "../slices/studentSlice.js";
import getErrorMessage from "../../../utils/error.js";
import { showError, showSuccess } from "../../../components/ui/toast.jsx";
import { FiMail, FiSend, FiGlobe, FiUsers, FiLock, FiDatabase } from "react-icons/fi";
import StudentPageHeader from "../components/shared/StudentPageHeader.jsx";
import CreateGroupPanel from "../components/groups/CreateGroupPanel.jsx";
import MyGroupPanel from "../components/groups/MyGroupPanel.jsx";
import InvitesPanel from "../components/groups/InvitesPanel.jsx";
import JoinRequestsPanel from "../components/groups/JoinRequestsPanel.jsx";
import DiscoverGroupsPanel from "../components/groups/DiscoverGroupsPanel.jsx";
import InviteStudentsPanel from "../components/groups/InviteStudentsPanel.jsx";
import SupervisorRequestPanel from "../components/groups/SupervisorRequestPanel.jsx";
import GroupIntelligencePanel from "../components/groups/GroupIntelligencePanel.jsx";
import StatsCards from "../../admin/components/StatsCards.jsx";
import studentApi from "../api/studentApi.js";
import HealthForecastingHub from "../../admin/components/analytics/HealthForecastingHub.jsx";
import RubricCoverageDashboard from "../../admin/components/analytics/RubricCoverageDashboard.jsx";
import "../studentTheme.css";

const StudentGroupsPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { groupsWorkspace, groupsStatus, actionStatus } = useSelector(
    (state) => state.student,
  );

  useEffect(() => {
    dispatch(fetchStudentGroupsWorkspace())
      .unwrap()
      .catch((error) => {
        showError(getErrorMessage(error, "Failed to load groups workspace."));
      });
  }, [dispatch]);

  const refreshWorkspace = () => {
    dispatch(fetchStudentGroupsWorkspace());
  };

  const isMe = (memberId) => String(memberId) === String(user?._id);
  const myGroup = groupsWorkspace.myGroup;
  const isLeader =
    myGroup &&
    user?._id &&
    String(myGroup.leader?._id || myGroup.leader) === String(user._id);

  const myGroupMemberIds = useMemo(
    () =>
      (myGroup?.members || []).map((m) =>
        String((m.user || m)._id || m.user || m),
      ),
    [myGroup],
  );

  const runAction = async (fn, successText, fallback) => {
    try {
      await fn();
      showSuccess(successText);
      refreshWorkspace();
    } catch (error) {
      showError(getErrorMessage(error, fallback));
    }
  };

  const stats = useMemo(() => [
    { label: "Synergy Invitations", value: groupsWorkspace.invites.length, sub: "Incoming Signals" },
    { label: "Join Requests", value: groupsWorkspace.joinRequests.length, sub: "System Pings" },
    { label: "Cohorts Discovered", value: groupsWorkspace.relatedGroups.length, sub: "Active Nodes" },
    { label: "Team Health", value: "Optimal", sub: "Operational Status" },
  ], [groupsWorkspace]);

  return (
    <DashboardShell>
      <main className="max-w-[1400px] mx-auto space-y-6">
        {/* Standardized Orchestrator Header */}
        <StudentPageHeader
          protocolName="Group_Command_v3.4"
          title="Group Synergy Center"
          subtitle="Collaborative Workspace & Strategic Governance Hub"
          groupName={myGroup?.name}
          rightSide={
            <div className="px-4 py-2 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center gap-3">
              <FiLock className="text-slate-400" size={14} />
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Synergy_Protocol</span>
            </div>
          }
        />

        {/* Strategy KPI Layer */}
        <StatsCards 
          stats={stats} 
          status={groupsStatus} 
        />

        {groupsStatus === "loading" && (
          <div className="px-4 py-3 rounded-xl bg-indigo-50 border border-indigo-100 text-[10px] font-black text-indigo-600 uppercase tracking-widest animate-pulse">
            Syncing Synergy Data...
          </div>
        )}

        <div className=" space-y-6">
          {/* Layer 2.5: Strategic Intelligence Hubs */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="space-y-3">
               <div className="flex items-center gap-2 mb-2">
                 <div className="h-4 w-1 bg-cyan-500 rounded-full" />
                 <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">
                   Health Forecasting
                 </h2>
               </div>
               <HealthForecastingHub 
                  groupId={myGroup?._id} 
                  groupName={myGroup?.name} 
                  fetcher={studentApi.fetchProjectHealthForecast}
               />
            </div>
            
            <div className="space-y-3">
               <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-1 bg-emerald-500 rounded-full" />
                    <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">
                      Academic Alignment
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-md border border-emerald-100">
                    <FiDatabase size={10} className="text-emerald-600" />
                    <span className="text-[8px] font-black uppercase text-emerald-700 tracking-widest">Rubric Compliance</span>
                  </div>
               </div>
               <div className="bg-slate-50 p-4 rounded-[2rem] border border-slate-100/50 shadow-inner h-full flex flex-col">
                 <RubricCoverageDashboard groupId={myGroup?._id} />
               </div>
            </div>
          </div>
          
          {/* Synergy Core & Recruitment Layer */}
          <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
            <MyGroupPanel
              group={myGroup}
              isLeader={isLeader}
              isMe={isMe}
              actionLoading={actionStatus === "loading"}
              onSubmitApproval={() =>
                runAction(
                  () => dispatch(submitGroupForApproval()).unwrap(),
                  "Group submitted for approval.",
                  "Failed to submit group.",
                )
              }
              onLeave={() =>
                runAction(
                  () => dispatch(leaveStudentGroup()).unwrap(),
                  "You left the group.",
                  "Failed to leave group.",
                )
              }
              onDelete={() =>
                runAction(
                  () => dispatch(deleteStudentGroup()).unwrap(),
                  "Group deleted.",
                  "Failed to delete group.",
                )
              }
              onTransferLeadership={(newLeaderId) =>
                runAction(
                  () => dispatch(transferStudentLeadership(newLeaderId)).unwrap(),
                  "Leadership transferred.",
                  "Failed to transfer leadership.",
                )
              }
              onRemoveMember={(memberId) =>
                runAction(
                  () => dispatch(removeStudentMember(memberId)).unwrap(),
                  "Member removed.",
                  "Failed to remove member.",
                )
              }
            />

            <div className="space-y-4 h-full">
              {!myGroup && (
                <CreateGroupPanel
                  loading={actionStatus === "loading"}
                  onCreate={(form) =>
                    runAction(
                      () =>
                        dispatch(
                          createStudentGroup({
                            name: form.name,
                            department: form.department,
                            semester: Number(form.semester),
                          }),
                        ).unwrap(),
                      "Group created.",
                      "Failed to create group.",
                    )
                  }
                />
              )}

              {myGroup && (
                <InviteStudentsPanel
                  students={groupsWorkspace.relatedStudents}
                  myGroupMemberIds={myGroupMemberIds}
                  isLeader={isLeader}
                  actionLoading={actionStatus === "loading"}
                  onInvite={(studentId) =>
                    runAction(
                      () => dispatch(inviteStudent(studentId)).unwrap(),
                      "Invite sent.",
                      "Failed to invite student.",
                    )
                  }
                />
              )}
            </div>
          </div>

          {/* Personnel Guidance Layer */}
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="h-full">
              {myGroup && isLeader && (
                <SupervisorRequestPanel
                  group={myGroup}
                  isLeader={isLeader}
                  supervisors={groupsWorkspace.availableSupervisors || []}
                  request={groupsWorkspace.supervisorRequest}
                  actionLoading={actionStatus === "loading"}
                  onSubmitRequest={(payload) =>
                    runAction(
                      () => dispatch(requestStudentSupervisor(payload)).unwrap(),
                      "Supervisor request submitted.",
                      "Failed to submit supervisor request.",
                    )
                  }
                  onCancelRequest={(requestId) =>
                    runAction(
                      () =>
                        dispatch(cancelStudentSupervisorRequest(requestId)).unwrap(),
                      "Supervisor request cancelled.",
                      "Failed to cancel supervisor request.",
                    )
                  }
                />
              )}
            </div>
            <div className="space-y-6 h-full">
              {myGroup && (
                <GroupIntelligencePanel 
                  group={myGroup}
                  requests={groupsWorkspace.joinRequests}
                  supervisorRequest={groupsWorkspace.supervisorRequest}
                />
              )}
            </div>
          </div>

          {/* Registry & Operations Layer */}
          <div className="grid gap-4 lg:grid-cols-3 pb-6">
            <InvitesPanel
              invites={groupsWorkspace.invites}
              actionLoading={actionStatus === "loading"}
              onRespondInvite={(inviteId, accept) =>
                runAction(
                  () => dispatch(respondInvite({ inviteId, accept })).unwrap(),
                  `Invite ${accept ? "accepted" : "rejected"}.`,
                  "Failed to respond to invite.",
                )
              }
            />

            <JoinRequestsPanel
              requests={groupsWorkspace.joinRequests}
              isLeader={isLeader}
              actionLoading={actionStatus === "loading"}
              onRespondRequest={(requestId, accept) =>
                runAction(
                  () =>
                    dispatch(respondJoinRequest({ requestId, accept })).unwrap(),
                  `Request ${accept ? "accepted" : "rejected"}.`,
                  "Failed to respond to join request.",
                )
              }
            />

            <DiscoverGroupsPanel
              groups={groupsWorkspace.relatedGroups}
              myGroupId={myGroup?._id}
              actionLoading={actionStatus === "loading"}
              onJoin={(groupId) =>
                runAction(
                  () => dispatch(requestJoinGroup(groupId)).unwrap(),
                  "Join request sent.",
                  "Failed to request join.",
                )
              }
            />
          </div>
        </div>
      </main>
    </DashboardShell>
  );
};

export default StudentGroupsPage;
