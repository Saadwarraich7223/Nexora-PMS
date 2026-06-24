import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiLayers, FiMail, FiSearch, FiChevronRight } from 'react-icons/fi';
import GroupPanel from './GroupPanel.jsx';
import UserManagementCard from './UserManagementCard.jsx';
import SupervisorPanel from './SupervisorPanel.jsx';

const AdminDataHub = ({
  // Group Props
  groupFilter,
  setGroupFilter,
  groupRows,
  groupsStatus,
  onViewGroup,
  // User Props
  userFilter,
  setUserFilter,
  tableRows,
  isFacultyLoading,
  viewAllPath,
  onEditUser,
  // Request/Supervisor Props
  supervisorRequests,
  unassignedGroups,
  showAssignPanel,
  setShowAssignPanel,
  isLoadingRequests,
}) => {
  const [activeTab, setActiveTab] = useState('groups');
  const navigate = useNavigate();

  const tabs = [
    { id: 'groups', label: 'Groups', icon: <FiLayers className={activeTab === 'groups' ? 'text-emerald-500' : ''} />, count: groupRows.length, color: 'emerald' },
    { id: 'users', label: 'Users', icon: <FiUsers className={activeTab === 'users' ? 'text-indigo-500' : ''} />, count: tableRows.length, color: 'indigo' },
    { id: 'requests', label: 'Requests', icon: <FiMail className={activeTab === 'requests' ? 'text-amber-500' : ''} />, count: supervisorRequests.length, color: 'amber' },
  ];

  const handleFullView = () => {
    switch (activeTab) {
      case 'groups':
        navigate('/admin/groups');
        break;
      case 'users':
        navigate(viewAllPath);
        break;
      case 'requests':
        navigate('/admin/faculty');
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab Navigation - Enhanced Glassy Hub */}
      <div className="flex items-center gap-1 border-b border-slate-100 px-6 py-3 bg-white/40 backdrop-blur-md">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all relative group ${
              activeTab === tab.id 
                ? `bg-slate-900 text-white shadow-xl shadow-slate-900/10` 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'
            }`}
          >
            <span className={`transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'}`}>
              {tab.icon}
            </span>
            {tab.label}
            {tab.count > 0 && (
              <span className={`px-2 py-0.5 rounded-lg text-[9px] tabular-nums font-black ${
                activeTab === tab.id ? `bg-white/20 text-white` : 'bg-slate-100 text-slate-500'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Experimental: Integrated Search Bar */}
      <div className="px-6 py-3 border-b border-slate-100 bg-white/40 backdrop-blur-md flex items-center justify-between gap-4">
         <div className="relative group w-full max-w-xs">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={12} />
            <input 
              type="text" 
              placeholder={`Quick search ${activeTab}...`}
              className="w-full pl-9 pr-4 py-2 bg-slate-100/50 border border-slate-100/50 focus:bg-white focus:border-indigo-200 rounded-xl text-[10px] font-medium transition-all outline-none shadow-inner"
            />
         </div>
         <div className="hidden sm:flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-slate-300"></div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic opacity-60">Management Console // Hub-V6.1</p>
         </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        {activeTab === 'groups' && (
          <div className="p-0">
            <GroupPanel
              groupFilter={groupFilter}
              setGroupFilter={setGroupFilter}
              groupRows={groupRows}
              groupsStatus={groupsStatus}
              onViewGroup={onViewGroup}
              hideHeader={true} // We'll update GroupPanel to allow hiding header
            />
          </div>
        )}

        {activeTab === 'users' && (
          <div className="p-0">
            <UserManagementCard
              userFilter={userFilter}
              setUserFilter={setUserFilter}
              tableRows={tableRows}
              isFacultyLoading={isFacultyLoading}
              viewAllPath={viewAllPath}
              onEditUser={onEditUser}
              hideHeader={true}
            />
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="p-0">
            <SupervisorPanel
              showAssignPanel={showAssignPanel}
              setShowAssignPanel={setShowAssignPanel}
              supervisorRequests={supervisorRequests}
              unassignedGroups={unassignedGroups}
              isLoading={isLoadingRequests}
              hideHeader={true}
            />
          </div>
        )}
      </div>

      {/* Footer / CTA */}
      <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
         <p className="text-[10px] text-slate-400">Quick view mode. Use sidebar for full management.</p>
         <button 
           onClick={handleFullView}
           className="flex items-center gap-1 text-[10px] font-black text-indigo-600 hover:translate-x-1 transition-transform uppercase tracking-widest"
         >
            Full View <FiChevronRight />
         </button>
      </div>
    </div>
  );
};

export default AdminDataHub;
