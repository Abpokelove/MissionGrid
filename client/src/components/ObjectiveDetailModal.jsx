import React, { useState, useEffect } from 'react';
import { FiCheck, FiX, FiTrash2, FiAlertOctagon } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { objectiveAPI } from '../services/api';
import toast from 'react-hot-toast';

const ObjectiveDetailModal = ({ isOpen, onClose, objective, mission, members = [], onSave }) => {
  const isEdit = !!objective;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState([]);
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Backlog');
  const [progress, setProgress] = useState(0);
  const [deadline, setDeadline] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockerReason, setBlockerReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isEdit && objective) {
        setTitle(objective.title || '');
        setDescription(objective.description || '');
        const selectedAssignees = Array.isArray(objective.assignees)
          ? objective.assignees.map((assignee) => assignee?._id || assignee)
          : objective.assignedTo
            ? [objective.assignedTo?._id || objective.assignedTo]
            : [];
        setAssignedTo(selectedAssignees.map((assignee) => assignee.toString()));
        setPriority(objective.priority || 'Medium');
        setStatus(objective.status || 'Backlog');
        setProgress(objective.progress || 0);
        setDeadline(objective.deadline ? new Date(objective.deadline).toISOString().split('T')[0] : '');
        setIsBlocked(objective.isBlocked || false);
        setBlockerReason(objective.blockerReason || '');
      } else {
        // Reset for new creation
        setTitle('');
        setDescription('');
        setAssignedTo([]);
        setPriority('Medium');
        setStatus('Backlog');
        setProgress(0);
        setDeadline('');
        setIsBlocked(false);
        setBlockerReason('');
      }
    }
  }, [isOpen, isEdit, objective]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (isBlocked && !blockerReason.trim()) {
      toast.error('Blocked task reason is required');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        missionId: mission._id,
        title,
        description,
        assignedTo: assignedTo[0] || null,
        assignees: assignedTo,
        priority,
        status,
        progress: parseInt(progress),
        deadline: deadline || null,
        isBlocked,
        blockerReason: isBlocked ? blockerReason : '',
      };

      if (isEdit && objective) {
        await objectiveAPI.update(objective._id, payload);
        toast.success(`Task "${title}" updated`);
      } else {
        await objectiveAPI.create(payload);
        toast.success(`Task "${title}" added to project`);
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Save task error:', error);
      toast.error(error.response?.data?.message || 'Could not save task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!objective?._id) return;
    if (!window.confirm(`Delete task "${title}"?`)) {
      return;
    }

    setIsLoading(true);
    try {
      await objectiveAPI.delete(objective._id);
      toast.success(`Task "${title}" deleted`);
      onSave();
      onClose();
    } catch (error) {
      console.error('Delete task error:', error);
      toast.error('Failed to delete task');
    } finally {
      setIsLoading(false);
    }
  };

  const assignableSource = members.length
    ? members
    : [
        ...(mission.createdBy ? [mission.createdBy] : []),
        ...(mission.crew || []),
      ];
  const assignableMembers = assignableSource.reduce((members, member) => {
    if (!member?._id || members.some((item) => String(item._id) === String(member._id))) return members;
    return [...members, member];
  }, []);
  const toggleAssignee = (memberId) => {
    const normalizedId = String(memberId);
    setAssignedTo((current) => (
      current.includes(normalizedId)
        ? current.filter((id) => id !== normalizedId)
        : [...current, normalizedId]
    ));
  };
  const clearAssignees = () => setAssignedTo([]);
  const getMemberRoleLabel = (member) => (
    member.role === 'Crew' || member.role === 'Team Member' || member.role === 'TeamMember'
      ? 'Team Member'
      : 'Project Manager'
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-3 py-5 sm:p-5">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-space-950/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Panel */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            className="relative z-10 max-h-[calc(100dvh-2.5rem)] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/10 bg-space-900/95 p-5 shadow-2xl sm:p-6"
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-white/5 mb-5">
              <div>
                <h3 className="text-lg font-bold font-display text-white tracking-wide">
                  {isEdit ? 'Edit Task' : 'Add New Task'}
                </h3>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                  Project: {mission.title}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white bg-white/5 border border-white/5 hover:border-white/10 transition-all"
              >
                <FiX className="text-base" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-text">Task Title</label>
                <input
                  type="text"
                  className="input-field text-sm"
                  placeholder="e.g. Implement schema validations"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="label-text">Description</label>
                <textarea
                  className="input-field text-sm h-20 resize-none"
                  placeholder="Task details, acceptance criteria, or notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-text">Assign Team Members</label>
                  <div className="rounded-2xl border border-white/10 bg-space-950/45 p-2">
                    <div className="mb-2 flex items-center justify-between gap-2 px-1">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-gray-500">
                        {assignedTo.length} selected
                      </span>
                      {assignedTo.length > 0 && (
                        <button
                          type="button"
                          onClick={clearAssignees}
                          className="text-[10px] font-semibold uppercase tracking-wider text-neon-blue transition hover:text-neon-cyan"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="max-h-32 space-y-2 overflow-y-auto pr-1">
                      {assignableMembers.map((member) => {
                        const memberId = String(member._id);
                        const selected = assignedTo.includes(memberId);
                        return (
                          <button
                            key={memberId}
                            type="button"
                            onClick={() => toggleAssignee(memberId)}
                            className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left transition ${
                              selected
                                ? 'border-neon-cyan/45 bg-neon-cyan/10 text-white shadow-glow-cyan'
                                : 'border-white/10 bg-white/[0.03] text-gray-300 hover:border-neon-blue/30 hover:bg-neon-blue/10'
                            }`}
                          >
                            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                              selected ? 'border-neon-cyan bg-neon-cyan text-space-950' : 'border-white/15 bg-white/5 text-transparent'
                            }`}>
                              <FiCheck className="text-xs" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-xs font-semibold">{member.name || member.email}</span>
                              <span className="block truncate font-mono text-[9px] uppercase tracking-wider text-gray-500">
                                {getMemberRoleLabel(member)}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                      {assignableMembers.length === 0 && (
                        <p className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-4 text-center text-xs text-gray-500">
                          No team members are available yet.
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="mt-1.5 text-[10px] text-gray-500">Click multiple people to assign shared task ownership.</p>
                </div>

                <div>
                  <label className="label-text">Status</label>
                  <select
                    className="select-field text-sm"
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value);
                      // Auto adjustment for progress based on status selection
                      if (e.target.value === 'Completed') setProgress(100);
                      else if (e.target.value === 'Backlog') setProgress(0);
                    }}
                  >
                    <option value="Backlog">Backlog</option>
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="label-text">Priority</label>
                  <select
                    className="select-field text-sm"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="label-text">Deadline</label>
                  <input
                    type="date"
                    className="input-field text-sm"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
              </div>

              {/* Progress Slider */}
              <div>
                <div className="flex justify-between font-mono text-[10px] text-gray-400 mb-1.5">
                  <span>Task Progress</span>
                  <span className="text-neon-cyan">{progress}%</span>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    className="flex-1 accent-neon-blue h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                    value={progress}
                    disabled={status === 'Completed' || status === 'Backlog'}
                    onChange={(e) => setProgress(e.target.value)}
                  />
                  {status === 'Completed' && <span className="text-[10px] font-mono text-green-400 uppercase font-semibold">Complete</span>}
                </div>
              </div>

              {/* Blocked task section */}
              <div className="p-3.5 bg-space-950/40 border border-white/5 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <FiAlertOctagon className={isBlocked ? 'text-neon-red animate-pulse' : 'text-gray-500'} /> 
                    Blocked Task
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={isBlocked}
                      onChange={(e) => setIsBlocked(e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neon-red"></div>
                  </label>
                </div>

                {isBlocked && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="space-y-2"
                  >
                    <label className="label-text text-[10px]">Blocker Reason</label>
                    <input
                      type="text"
                      className="input-field text-xs px-3 py-2 bg-red-950/15 border-red-500/20 focus:border-red-500/50 focus:ring-red-500/30"
                      placeholder="e.g. Waiting on infrastructure access..."
                      value={blockerReason}
                      onChange={(e) => setBlockerReason(e.target.value)}
                      required
                    />
                  </motion.div>
                )}
              </div>

              {/* Actions Bar */}
              <div className="sticky bottom-0 -mx-5 flex items-center justify-between border-t border-white/5 bg-space-900/95 px-5 pt-4 mt-6 pb-1 backdrop-blur-xl sm:-mx-6 sm:px-6">
                {isEdit ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="text-red-400 hover:text-red-300 font-semibold text-xs flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 px-3 py-2 border border-red-500/20 rounded-xl transition-all"
                  >
                    <FiTrash2 /> Delete Task
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-secondary text-xs px-4"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary text-xs px-4"
                  >
                    {isEdit ? 'Save Task' : 'Create Task'}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ObjectiveDetailModal;
