import React, { useState, useEffect } from 'react';
import { Layers, Plus, Users, UserPlus, RefreshCw, FolderPlus } from 'lucide-react';
import { groupService, customerService } from '../services/api';
import CreateGroupModal from '../components/CreateGroupModal';
import AddMemberModal from '../components/AddMemberModal';

export default function Groups() {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-teal-400" /> Quản Lý Phân Nhóm Khách Hàng / Khu Vực
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tạo nhóm đại lý cấp 2, phân vùng địa lý hoặc phân loại khách hàng theo dự án.
          </p>
        </div>

        <button
          onClick={() => setIsCreateGroupOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition flex items-center gap-2"
        >
          <FolderPlus className="w-4 h-4" /> Tạo Nhóm Mới
        </button>
      </div>

      {/* Grid: Groups List & Members View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Groups List */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
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
                    ? 'bg-slate-900 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                    : 'glass-card hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-200">{g.groupName}</h4>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-slate-700 font-semibold">
                    {g.memberCount || 0} thành viên
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                  {g.description || 'Không có mô tả chi tiết'}
                </p>
              </div>
            );
          })}
        </div>

        {/* Right: Selected Group Members */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            {selectedGroup ? (
              <>
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
                      <Users className="w-5 h-5 text-cyan-400" /> {selectedGroup.groupName}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{selectedGroup.description || 'Chi tiết thành viên trong nhóm'}</p>
                  </div>

                  <button
                    onClick={() => setIsAddMemberOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <UserPlus className="w-4 h-4" /> Thêm Khách Hàng Vào Nhóm
                  </button>
                </div>

                {/* Member Table */}
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-3">Khách Hàng</th>
                        <th className="p-3">Tài Khoản</th>
                        <th className="p-3">Email / Điện Thoại</th>
                        <th className="p-3">Vai Trò</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
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
                          <tr key={m.userId} className="hover:bg-slate-800/40">
                            <td className="p-3 font-bold text-slate-200">{m.userName}</td>
                            <td className="p-3 font-mono text-cyan-400">@{m.account}</td>
                            <td className="p-3">
                              <div>{m.email || '---'}</div>
                              <div className="text-slate-400">{m.cellphone || '---'}</div>
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold text-[10px]">
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
