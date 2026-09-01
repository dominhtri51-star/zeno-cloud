import React, { useState, useEffect } from 'react';
import { Layers, Plus, Users, UserPlus, RefreshCw, FolderPlus } from 'lucide-react';
import { groupService, customerService } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import CreateGroupModal from '../components/CreateGroupModal';
import AddMemberModal from '../components/AddMemberModal';

export default function Groups() {
  const { isDark } = useTheme();
  const [groups, setGroups] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);

  // Modals
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [grpRes, custRes] = await Promise.all([
        groupService.getGroups(),
        customerService.getCustomers()
      ]);
      const grpList = grpRes.groups || [];
      setGroups(grpList);
      setCustomers(custRes.customers || []);

      if (grpList.length > 0 && !selectedGroup) {
        selectGroup(grpList[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const selectGroup = async (group) => {
    setSelectedGroup(group);
    setMembersLoading(true);
    try {
      const res = await groupService.getGroupMembers(group.groupId);
      setGroupMembers(res.members || []);
    } catch (e) {
      console.error(e);
    } finally {
      setMembersLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif] animate-fade-in pb-12">
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border transition-colors duration-300 ${
        isDark ? 'bg-[#0b101e] border-slate-800/90 shadow-xl' : 'bg-white border-slate-200 shadow-md'
      }`}>
        <div>
          <h1 className={`text-xl sm:text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2.5`}>
            <Layers className="w-6 h-6 text-teal-500" /> Quản Lý Phân Nhóm Khách Hàng / Khu Vực
          </h1>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
            Tạo nhóm đại lý cấp 2, phân vùng địa lý hoặc phân loại khách hàng theo dự án.
          </p>
        </div>

        <button
          onClick={() => setIsCreateGroupOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition flex items-center gap-2 cursor-pointer"
        >
          <FolderPlus className="w-4 h-4" /> Tạo Nhóm Mới
        </button>
      </div>

      {/* Grid: Groups List & Members View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Groups List */}
        <div className="space-y-3">
          <div className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider px-1`}>
            Danh Sách Nhóm ({groups.length})
          </div>

          {groups.map((g) => {
            const isSelected = selectedGroup?.groupId === g.groupId;
            return (
              <div
                key={g.groupId}
                onClick={() => selectGroup(g)}
                className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 border ${
                  isSelected
                    ? isDark 
                      ? 'bg-slate-900 border-cyan-500/50 shadow-lg shadow-cyan-500/10' 
                      : 'bg-cyan-50/70 border-cyan-400 shadow-md'
                    : isDark 
                      ? 'bg-[#0b101e] border-slate-800/90 hover:border-slate-700' 
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className={`font-bold text-sm ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{g.groupName}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${
                    isDark ? 'bg-slate-800 text-cyan-400 border-slate-700' : 'bg-slate-100 text-cyan-700 border-slate-200'
                  }`}>
                    {g.memberCount || 0} thành viên
                  </span>
                </div>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-2 line-clamp-2`}>
                  {g.description || 'Không có mô tả chi tiết'}
                </p>
              </div>
            );
          })}
        </div>

        {/* Right: Selected Group Members */}
        <div className={`lg:col-span-2 p-5 sm:p-6 rounded-2xl border flex flex-col justify-between transition-colors duration-300 ${
          isDark ? 'bg-[#0b101e] border-slate-800/90 shadow-xl' : 'bg-white border-slate-200 shadow-md'
        }`}>
          <div>
            {selectedGroup ? (
              <>
                <div className={`flex items-center justify-between pb-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                  <div>
                    <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
                      <Users className="w-5 h-5 text-cyan-500" /> {selectedGroup.groupName}
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>{selectedGroup.description || 'Chi tiết thành viên trong nhóm'}</p>
                  </div>

                  <button
                    onClick={() => setIsAddMemberOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" /> Thêm Khách Hàng Vào Nhóm
                  </button>
                </div>

                {/* Member Table */}
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className={`uppercase text-[10px] font-bold border-b ${
                      isDark ? 'bg-slate-900/60 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      <tr>
                        <th className="p-3">Khách Hàng</th>
                        <th className="p-3">Tài Khoản</th>
                        <th className="p-3">Email / Điện Thoại</th>
                        <th className="p-3">Vai Trò</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-slate-800/60 text-slate-300' : 'divide-slate-200 text-slate-700'}`}>
                      {membersLoading ? (
                        <tr>
                          <td colSpan="4" className="p-6 text-center text-slate-500">
                            Đang tải thành viên...
                          </td>
                        </tr>
                      ) : groupMembers.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="p-8 text-center text-slate-500">
                            Chưa có khách hàng nào trong nhóm này. Hãy bấm "Thêm Khách Hàng Vào Nhóm".
                          </td>
                        </tr>
                      ) : (
                        groupMembers.map((m) => (
                          <tr key={m.userId} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}>
                            <td className={`p-3 font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{m.userName}</td>
                            <td className="p-3 font-mono text-cyan-500">@{m.account}</td>
                            <td className="p-3">
                              <div>{m.email || '---'}</div>
                              <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>{m.cellphone || '---'}</div>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded border font-semibold text-[10px] ${
                                isDark ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                              }`}>
                                {m.roleName || 'Owner'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-slate-500">
                Chọn một nhóm ở danh sách bên trái để xem chi tiết.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onSuccess={loadData}
      />

      <AddMemberModal
        isOpen={isAddMemberOpen}
        group={selectedGroup}
        customers={customers}
        onClose={() => setIsAddMemberOpen(false)}
        onSuccess={() => {
          loadData();
          if (selectedGroup) selectGroup(selectedGroup);
        }}
      />
    </div>
  );
}
