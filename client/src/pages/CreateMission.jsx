import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { missionAPI, authAPI, objectiveAPI } from '../services/api';
import { FiArrowLeft, FiCpu, FiCheck, FiInfo } from 'react-icons/fi';
import toast from 'react-hot-toast';

const CreateMission = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Development');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Planning');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [deadline, setDeadline] = useState('');
  const [selectedCrew, setSelectedCrew] = useState([]);

  // Smart Task Splitter
  const [ideaText, setIdeaText] = useState('');
  const [suggestedTasks, setSuggestedTasks] = useState([]);
  const [checkedTasks, setCheckedTasks] = useState({});

  // DB Metadata
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMetadata = useCallback(async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      try {
        const usersRes = await authAPI.getUsers();
        setUsers(usersRes.data);

        if (isEditMode) {
          const { data } = await missionAPI.getOne(id);
          const { mission } = data;
          setTitle(mission.title);
          setDescription(mission.description);
          setCategory(mission.category);
          setPriority(mission.priority);
          setStatus(mission.status);
          if (mission.startDate) {
            setStartDate(new Date(mission.startDate).toISOString().split('T')[0]);
          }
          if (mission.deadline) {
            setDeadline(new Date(mission.deadline).toISOString().split('T')[0]);
          }
          setSelectedCrew(mission.crew.map(c => c._id));
        }
      } catch (error) {
        console.error('Failed to load project setup data:', error);
        toast.error('Failed to load project setup data');
      } finally {
        setLoading(false);
      }
  }, [id, isEditMode]);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  useEffect(() => {
    const refreshOnFocus = () => loadMetadata({ silent: true });
    const refreshOnVisible = () => {
      if (document.visibilityState === 'visible') refreshOnFocus();
    };

    window.addEventListener('focus', refreshOnFocus);
    document.addEventListener('visibilitychange', refreshOnVisible);
    return () => {
      window.removeEventListener('focus', refreshOnFocus);
      document.removeEventListener('visibilitychange', refreshOnVisible);
    };
  }, [loadMetadata]);

  // Crew selection helper
  const handleCrewToggle = (userId) => {
    if (selectedCrew.includes(userId)) {
      setSelectedCrew(selectedCrew.filter(c => c !== userId));
    } else {
      setSelectedCrew([...selectedCrew, userId]);
    }
  };

  // Smart Task Splitter rule-based generator
  const handleGenerateTasks = () => {
    if (!ideaText.trim()) {
      toast.error('Provide a project concept first');
      return;
    }

    const text = ideaText.toLowerCase();
    const suggestions = [];

    // Basic rule-based template generation
    if (text.includes('web') || text.includes('site') || text.includes('react') || text.includes('frontend') || text.includes('ui')) {
      suggestions.push(
        { title: 'Create interactive design wireframes', priority: 'Medium', desc: 'Wireframe main page views & theme tokens.' },
        { title: 'Build React UI shell layout with Sidebar & Topbar', priority: 'High', desc: 'Implement responsive base styling.' },
        { title: 'Integrate global state manager & Axios datalinks', priority: 'High', desc: 'Connect frontend context to server APIs.' },
        { title: 'Complete mobile responsive view validations', priority: 'Medium', desc: 'Test viewport compatibility.' },
      );
    }
    
    if (text.includes('database') || text.includes('db') || text.includes('backend') || text.includes('api') || text.includes('server')) {
      suggestions.push(
        { title: 'Design database schemas & validations', priority: 'High', desc: 'Create Mongoose models & database indexing structures.' },
        { title: 'Build REST endpoints with CORS & error handlers', priority: 'High', desc: 'Setup standard Express route structures.' },
        { title: 'Implement JWT secure authentication flow middleware', priority: 'Critical', desc: 'Hash password & secure telemetry payloads.' },
        { title: 'Prepare production seed and migration checks', priority: 'Low', desc: 'Verify database setup, indexes, and repeatable setup commands.' },
      );
    }

    if (text.includes('marketing') || text.includes('copy') || text.includes('launch') || text.includes('campaign')) {
      suggestions.push(
        { title: 'Design brand visual assets & graphics', priority: 'Medium', desc: 'Generate marketing images & banners.' },
        { title: 'Write marketing landing page copy & slogans', priority: 'Low', desc: 'Copywriting for SEO optimization.' },
        { title: 'Initialize email capture list collection funnel', priority: 'High', desc: 'Setup database endpoint hook for signups.' },
      );
    }

    // Default generic suggestions
    if (suggestions.length === 0) {
      suggestions.push(
        { title: 'Define scope document and requirements', priority: 'Medium', desc: 'Draft the initial project roadmap.' },
        { title: 'Host team alignment kickoff', priority: 'Low', desc: 'Align responsibilities and expected outcomes.' },
        { title: 'Build the first working prototype', priority: 'High', desc: 'Assemble the core project structure for review.' },
      );
    }

    setSuggestedTasks(suggestions);
    // Auto-check all generated suggestions
    const initialChecked = {};
    suggestions.forEach((_, idx) => {
      initialChecked[idx] = true;
    });
    setCheckedTasks(initialChecked);
    toast.success(`Smart Task Splitter generated ${suggestions.length} tasks`);
  };

  const handleTaskCheckToggle = (idx) => {
    setCheckedTasks({
      ...checkedTasks,
      [idx]: !checkedTasks[idx]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Project title is required');
      return;
    }

    try {
      const missionPayload = {
        title,
        description,
        category,
        priority,
        status,
        startDate,
        deadline: deadline || null,
        crew: selectedCrew,
      };

      let missionId = id;
      if (isEditMode) {
        await missionAPI.update(id, missionPayload);
        toast.success(`Project "${title}" updated`);
      } else {
        const { data } = await missionAPI.create(missionPayload);
        missionId = data._id;
        toast.success(`Project "${title}" created`);

        // If new mission, split & insert checked objectives automatically
        const selectedObjectives = suggestedTasks.filter((_, idx) => checkedTasks[idx]);
        if (selectedObjectives.length > 0) {
          await Promise.all(
            selectedObjectives.map(obj => 
              objectiveAPI.create({
                missionId,
                title: obj.title,
                description: obj.desc,
                priority: obj.priority,
                status: 'Backlog',
              })
            )
          );
          toast.success(`Created ${selectedObjectives.length} suggested tasks`);
        }
      }

      navigate(`/missions/${missionId}`);
    } catch (error) {
      console.error('Save mission error:', error);
      const message = error.response?.data?.message || 'Could not save project';
      toast.error(message.includes('workspace') ? 'Workspace was missing. The server can repair Project Manager accounts; retry once after refresh.' : message);
    }
  };

  if (loading) {
    return (
      <div className="page-container flex flex-col justify-center items-center h-[calc(100vh-5rem)]">
        <div className="w-16 h-16 border-4 border-t-neon-blue border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-mono text-neon-blue animate-pulse text-sm">Loading project setup...</p>
      </div>
    );
  }

  return (
    <div className="page-container max-w-4xl mx-auto">
      {/* Back link */}
      <Link to="/missions" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-4">
        <FiArrowLeft /> Back to Projects
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="page-title text-white">{isEditMode ? 'Edit Project' : 'Create Project'}</h1>
          <p className="text-xs font-mono text-gray-400 mt-1">Set project details, assign your team, and generate starter tasks.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Core Form Parameters */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
            <div>
              <label className="label-text">Project Title</label>
              <input
                type="text"
                className="input-field text-sm"
                placeholder="e.g. Customer Portal API"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label-text">Description</label>
              <textarea
                className="input-field text-sm h-28 resize-none"
                placeholder="Project goals, deliverables, and important context..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-text">Category</label>
                <select
                  className="select-field text-sm"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Development">Development</option>
                  <option value="Design">Design</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Research">Research</option>
                  <option value="Operations">Operations</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Other">Other</option>
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
                <label className="label-text">Status</label>
                <select
                  className="select-field text-sm"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="Planning">Planning</option>
                  <option value="Active">Active</option>
                  <option value="Paused">Paused</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="label-text">Start Date</label>
                <input
                  type="date"
                  className="input-field text-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="label-text">Deadline</label>
                <input
                  type="date"
                  className="input-field text-sm"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
            </div>

            {/* Crew Selection */}
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <label className="label-text mb-0">Team Members ({selectedCrew.length})</label>
                <button
                  type="button"
                  onClick={() => loadMetadata({ silent: true })}
                  className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-gray-300 transition hover:border-neon-blue/30 hover:text-white"
                >
                  Refresh Team
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2.5 max-h-40 overflow-y-auto p-2 bg-space-950/40 rounded-xl border border-white/5 pr-1">
                {users.map((u) => {
                  const isSelected = selectedCrew.includes(u._id);
                  return (
                    <button
                      key={u._id}
                      type="button"
                      onClick={() => handleCrewToggle(u._id)}
                      className={`flex items-center gap-2.5 p-2 rounded-lg text-left text-xs transition-all border ${
                        isSelected 
                          ? 'bg-neon-blue/15 border-neon-blue/40 text-white' 
                          : 'bg-white/2 border-transparent text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-full border border-white/10" />
                      <div className="min-w-0">
                        <p className="font-semibold truncate leading-none">{u.name}</p>
                        <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">
                          {u.role === 'Crew' ? 'Team Member' : 'Project Manager'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <Link to="/missions" className="btn-secondary text-sm">
                Cancel
              </Link>
              <button type="submit" className="btn-primary text-sm">
                {isEditMode ? 'Save Project' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Smart Task Splitter AI suggestions */}
        {!isEditMode && (
          <div className="space-y-6">
            <div className="glass-card p-6 border-neon-cyan/20">
              <div className="flex items-center gap-2 pb-3 border-b border-white/5 mb-4">
                <FiCpu className="text-neon-cyan animate-pulse text-lg" />
                <h3 className="font-display font-semibold text-sm text-white">Smart Task Splitter</h3>
              </div>

              <p className="text-[11px] text-gray-400 leading-normal mb-4">
                Add a high-level project idea and MissionGrid will suggest practical starter tasks.
              </p>

              <textarea
                className="input-field text-xs h-24 mb-4 resize-none"
                placeholder="e.g. Build an Express server with MongoDB databases, JWT authentication, and automated error handling middlewares"
                value={ideaText}
                onChange={(e) => setIdeaText(e.target.value)}
              />

              <button
                type="button"
                onClick={handleGenerateTasks}
                className="w-full btn-secondary text-xs flex items-center justify-center gap-2 hover:border-neon-cyan/30 text-neon-cyan bg-neon-cyan/5 py-2.5"
              >
                Split Project Into Tasks
              </button>

              {/* Suggestions list */}
              {suggestedTasks.length > 0 && (
                <div className="mt-5 space-y-3 pt-5 border-t border-white/5">
                  <div className="flex justify-between items-center text-[10px] font-mono text-gray-500 mb-2">
                    <span>Suggested Tasks ({suggestedTasks.length})</span>
                    <span>Include</span>
                  </div>

                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {suggestedTasks.map((t, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleTaskCheckToggle(idx)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex gap-3.5 justify-between items-start ${
                          checkedTasks[idx]
                            ? 'bg-neon-cyan/5 border-neon-cyan/30 text-white'
                            : 'bg-white/2 border-white/5 text-gray-400 hover:border-white/10'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-[11px] truncate leading-tight">{t.title}</p>
                          <span className="text-[9px] font-mono opacity-85 leading-normal mt-1 block line-clamp-1">{t.desc}</span>
                        </div>
                        <div className={`w-4.5 h-4.5 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                          checkedTasks[idx] ? 'bg-neon-cyan border-neon-cyan text-space-950' : 'border-white/20'
                        }`}>
                          {checkedTasks[idx] && <FiCheck className="text-xs stroke-[4px]" />}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 items-start mt-3.5 p-2.5 rounded bg-space-950/40 text-[10px] text-gray-400 border border-white/5 leading-normal">
                    <FiInfo className="text-xs shrink-0 mt-0.5 text-neon-blue" />
                    <span>Checked tasks will be created automatically in Backlog when the project is saved.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateMission;
