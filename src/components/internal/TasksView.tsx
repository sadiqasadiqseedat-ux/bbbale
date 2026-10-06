import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  Filter 
} from 'lucide-react';
import { storageService, subscribeToStore } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { Task, User as UserType, Matter, CaseRecord } from '../../types';

export const TasksView: React.FC = () => {
  const { currentUser, isCounselStaff } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lawyers, setLawyers] = useState<UserType[]>([]);
  const [matters, setMatters] = useState<Matter[]>([]);
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // New task modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [matterId, setMatterId] = useState('');

  const loadData = () => {
    setTasks(storageService.getTasks());
    setLawyers(storageService.getUsers().filter(u => u.isActive));
    setMatters(storageService.getMatters());
    setCases(storageService.getCases());
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToStore(loadData);
    return () => unsub();
  }, []);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle || !currentUser) return;

    storageService.addTask({
      title: newTaskTitle,
      assignedToId: assignedToId || currentUser.id,
      assignedById: currentUser.id,
      priority,
      dueDate: dueDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      status: 'Pending',
      matterId: matterId || undefined,
      notes
    }, currentUser);

    setIsAddModalOpen(false);
    setNewTaskTitle('');
    setNotes('');
  };

  const handleUpdateStatus = (task: Task, status: Task['status']) => {
    if (!currentUser) return;
    const updated: Task = {
      ...task,
      status,
      completionDate: status === 'Completed' ? new Date().toISOString().split('T')[0] : undefined
    };
    storageService.updateTask(updated, currentUser);
  };

  const filteredTasks = tasks.filter(t => {
    if (isCounselStaff && t.assignedToId !== currentUser?.id) return false;
    if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
    return t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (t.notes && t.notes.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">
            Legal Task & Workflow Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Brief Drafting · Court Filing Deadlines · Process Service · Research Assignments
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Task</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center space-x-2 w-full sm:w-auto flex-1">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search tasks by title or notes..."
            className="w-full text-xs sm:text-sm bg-transparent border-none focus:outline-hidden"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-500 font-semibold">Status:</span>
          {['ALL', 'Pending', 'In Progress', 'Completed'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-2.5 py-1 rounded font-medium ${
                filterStatus === st ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="p-3.5">Task Description</th>
                <th className="p-3.5">Assigned To</th>
                <th className="p-3.5">Priority</th>
                <th className="p-3.5">Due Date</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No tasks found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredTasks.map(task => {
                  const assignee = lawyers.find(l => l.id === task.assignedToId);
                  return (
                    <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5">
                        <p className="font-semibold text-slate-900">{task.title}</p>
                        {task.notes && <p className="text-[11px] text-slate-500">{task.notes}</p>}
                      </td>
                      <td className="p-3.5 font-medium text-slate-800">
                        {assignee?.name || 'Unassigned'}
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                          task.priority === 'Urgent' ? 'bg-red-100 text-red-800' :
                          task.priority === 'High' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-700">{task.dueDate}</td>
                      <td className="p-3.5">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                          task.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                          task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1">
                        {task.status !== 'Completed' ? (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(task, 'In Progress')}
                              className="px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-50 rounded border border-blue-200"
                            >
                              In Progress
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(task, 'Completed')}
                              className="px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 rounded border border-emerald-200"
                            >
                              Mark Done
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-bold">✓ Completed</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Task Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-300">
            <h3 className="text-base font-serif font-bold text-slate-900 pb-2 border-b">
              Create New Legal Workflow Task
            </h3>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Task Title: *</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Draft Statement of Claim and Certificate of Pre-Action Counseling"
                  className="w-full p-2.5 rounded border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assign To: *</label>
                <select
                  value={assignedToId}
                  onChange={e => setAssignedToId(e.target.value)}
                  className="w-full p-2.5 rounded border border-slate-300 bg-white"
                >
                  {lawyers.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l.role.replace('_', ' ')})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority: *</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as Task['priority'])}
                    className="w-full p-2.5 rounded border border-slate-300 bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Due Date: *</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Instructions / Notes:</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Specific statutory citations or filing requirements..."
                  className="w-full p-2.5 rounded border border-slate-300"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border rounded font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold"
                >
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
