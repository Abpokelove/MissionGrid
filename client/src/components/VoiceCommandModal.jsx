import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiX, FiMic, FiMicOff, FiPlus, FiAlertCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { authAPI, missionAPI, objectiveAPI } from '../services/api';
import toast from 'react-hot-toast';

const VoiceCommandModal = ({ isOpen, onClose }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(true);
  const [missions, setMissions] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Parsed task fields
  const [selectedMissionId, setSelectedMissionId] = useState('');
  const [parsedTitle, setParsedTitle] = useState('');
  const [parsedAssigneeId, setParsedAssigneeId] = useState('');
  const [parsedPriority, setParsedPriority] = useState('Medium');
  const [parsedDeadline, setParsedDeadline] = useState('');

  const recognitionRef = useRef(null);
  const usersRef = useRef([]);

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  useEffect(() => {
    if (isOpen) {
      fetchMissionsAndUsers();
      // Reset state
      setTranscript('');
      setParsedTitle('');
      setParsedAssigneeId('');
      setParsedPriority('Medium');
      setParsedDeadline('');
    }
  }, [isOpen]);

  const fetchMissionsAndUsers = async () => {
    try {
      const [missionsRes, usersRes] = await Promise.all([
        missionAPI.getAll(),
        authAPI.getUsers(),
      ]);
      setMissions(missionsRes.data);
      setUsers(usersRes.data);
      if (missionsRes.data.length > 0) {
        setSelectedMissionId(missionsRes.data[0]._id);
      }
    } catch (error) {
      console.error('Failed to load metadata in voice modal:', error);
    }
  };

  // Rule-based parsing: "create task [title] assign to [name] priority [priority]"
  const parseCommand = useCallback((text) => {
    const cleaned = text.toLowerCase();

    // 1. Try to extract Title
    // Look for phrases like: "create objective x", "add task x", "create task x", "task x"
    let title = '';
    const taskKeywords = ['create objective', 'add objective', 'create task', 'add task', 'objective', 'task'];
    for (const kw of taskKeywords) {
      if (cleaned.includes(kw)) {
        const index = cleaned.indexOf(kw) + kw.length;
        // Grab everything after keyword up to helper prepositions like "assign", "for", "priority"
        let rawTitle = cleaned.slice(index).trim();
        rawTitle = rawTitle.split(/assign to|assigned to|for|priority|deadline/)[0].trim();
        if (rawTitle) {
          title = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
          break;
        }
      }
    }
    if (title) setParsedTitle(title);
    else if (text.trim() && !title) {
      // Fallback: use first chunk of text
      const fallbackTitle = text.split(/assign to|assigned to|for|priority|deadline/i)[0].trim();
      setParsedTitle(fallbackTitle);
    }

    // 2. Try to extract Assignee
    // Look for "assign to [name]", "assigned to [name]", "for [name]"
    const assigneeMatch = text.match(/(?:assign to|assigned to|for)\s+([a-zA-Z\s]+?)(?=\s+priority|\s+deadline|$)/i);
    if (assigneeMatch && assigneeMatch[1]) {
      const rawName = assigneeMatch[1].trim().toLowerCase();
      // Match against fetched users
      const matchedUser = usersRef.current.find(u => u.name.toLowerCase().includes(rawName));
      if (matchedUser) {
        setParsedAssigneeId(matchedUser._id);
      }
    }

    // 3. Try to extract Priority
    // Look for "priority [low|medium|high|critical]"
    const priorityMatch = text.match(/priority\s+(low|medium|high|critical)/i);
    if (priorityMatch && priorityMatch[1]) {
      const pVal = priorityMatch[1].toLowerCase();
      const capitalized = pVal.charAt(0).toUpperCase() + pVal.slice(1);
      setParsedPriority(capitalized);
    }

    // 4. Try to extract Deadline (e.g. "deadline tomorrow", "deadline next week", "deadline in 3 days")
    if (cleaned.includes('deadline')) {
      const today = new Date();
      if (cleaned.includes('tomorrow')) {
        today.setDate(today.getDate() + 1);
        setParsedDeadline(today.toISOString().split('T')[0]);
      } else if (cleaned.includes('next week') || cleaned.includes('in 7 days') || cleaned.includes('a week')) {
        today.setDate(today.getDate() + 7);
        setParsedDeadline(today.toISOString().split('T')[0]);
      } else {
        const daysMatch = cleaned.match(/in\s+(\d+)\s+days/);
        if (daysMatch && daysMatch[1]) {
          today.setDate(today.getDate() + parseInt(daysMatch[1]));
          setParsedDeadline(today.toISOString().split('T')[0]);
        }
      }
    }
  }, []);

  useEffect(() => {
    // Check Speech Recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const currentText = finalTranscript || interimTranscript;
      setTranscript(currentText);
      parseCommand(currentText);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [parseCommand]);

  const startListening = () => {
    if (!supported || !recognitionRef.current) return;
    try {
      recognitionRef.current.start();
      setIsListening(true);
      toast.success('Voice control is listening');
    } catch (err) {
      console.error(err);
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
  };

  const handleSaveObjective = async (e) => {
    e.preventDefault();
    if (!selectedMissionId) {
      toast.error('Select a target project');
      return;
    }
    if (!parsedTitle) {
      toast.error('Task title cannot be empty');
      return;
    }

    try {
      const payload = {
        missionId: selectedMissionId,
        title: parsedTitle,
        assignedTo: parsedAssigneeId || null,
        priority: parsedPriority,
        deadline: parsedDeadline || null,
        status: 'Backlog',
      };
      await objectiveAPI.create(payload);
      toast.success(`Task "${parsedTitle}" created`);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not create task');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-space-950/80 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            className="relative z-10 max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-lg border border-white/10 bg-space-900/92 p-5 shadow-2xl lg:p-6"
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-white/5 mb-6">
              <div>
                <h3 className="text-xl font-bold font-display text-white tracking-wide">
                  Voice Control
                </h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">
                  Create a task from dictation or typed input
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white bg-white/5 border border-white/5 hover:border-white/10 transition-all"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            {/* Glowing Orb / Soundwaves Section */}
            <div className="flex flex-col items-center justify-center py-6 mb-6 rounded-2xl bg-space-950/50 border border-white/5 relative overflow-hidden">
              {/* Glowing Orb Fallback */}
              <motion.div
                animate={{
                  scale: isListening ? [1, 1.15, 1] : 1,
                  boxShadow: isListening 
                    ? ['0 0 20px rgba(14,165,233,0.3)', '0 0 45px rgba(139,92,246,0.6)', '0 0 20px rgba(14,165,233,0.3)']
                    : '0 0 15px rgba(14,165,233,0.15)'
                }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                className={`w-20 h-20 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                  isListening 
                    ? 'bg-gradient-to-tr from-neon-blue to-neon-violet' 
                    : 'bg-space-800 border border-neon-blue/30'
                }`}
                onClick={isListening ? stopListening : startListening}
              >
                {isListening ? (
                  <FiMicOff className="text-2xl text-white animate-pulse" />
                ) : (
                  <FiMic className="text-2xl text-neon-blue" />
                )}
              </motion.div>

              <p className="mt-4 font-mono text-xs tracking-widest text-center">
                {isListening ? (
                  <span className="text-neon-cyan animate-pulse">Listening. Speak now.</span>
                ) : (
                  <span className="text-gray-500">Tap the orb to start voice capture</span>
                )}
              </p>

              {/* Waveform Animation */}
              {isListening && (
                <div className="flex gap-1 items-center mt-3.5 h-6">
                  {[...Array(9)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [4, 24, 4] }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.5 + Math.random() * 0.5,
                        ease: "easeInOut"
                      }}
                      className="w-1 bg-neon-blue rounded-full"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Live Text Field / Editor for speech */}
            <div className="space-y-4">
              <div>
                <label className="label-text">Transcript</label>
                <textarea
                  className="input-field h-24 text-sm resize-none"
                  value={transcript}
                  onChange={(e) => {
                    setTranscript(e.target.value);
                    parseCommand(e.target.value);
                  }}
                  placeholder={
                    supported 
                      ? 'Say: "Create task Design landing page for Aria Chen priority High deadline next week"'
                      : 'Speech recognition is not supported in this browser. Type task details here.'
                  }
                />
              </div>

              {!supported && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs flex gap-2.5 items-start">
                  <FiAlertCircle className="text-lg shrink-0 mt-0.5" />
                  <span>Speech recognition is not available in this browser. You can type or paste the task details instead.</span>
                </div>
              )}

              {/* Parsing result cards */}
              <div className="p-4 rounded-xl bg-space-950/30 border border-white/5">
                <span className="text-[10px] font-mono text-neon-cyan uppercase tracking-wider block mb-3">
                  Parsed Task
                </span>

                <form onSubmit={handleSaveObjective} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Target Project */}
                  <div>
                    <label className="label-text">Project</label>
                    <select
                      className="select-field text-sm"
                      value={selectedMissionId}
                      onChange={(e) => setSelectedMissionId(e.target.value)}
                      required
                    >
                      <option value="" disabled>Select project...</option>
                      {missions.map((m) => (
                        <option key={m._id} value={m._id}>{m.title}</option>
                      ))}
                    </select>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="label-text">Task Title</label>
                    <input
                      type="text"
                      className="input-field text-sm"
                      value={parsedTitle}
                      onChange={(e) => setParsedTitle(e.target.value)}
                      placeholder="Title parsed from stream"
                      required
                    />
                  </div>

                  {/* Assignee */}
                  <div>
                    <label className="label-text">Assigned Team Member</label>
                    <select
                      className="select-field text-sm"
                      value={parsedAssigneeId}
                      onChange={(e) => setParsedAssigneeId(e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {users.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.name} ({u.role === 'Crew' ? 'Team Member' : 'Project Manager'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="label-text">Priority</label>
                    <select
                      className="select-field text-sm"
                      value={parsedPriority}
                      onChange={(e) => setParsedPriority(e.target.value)}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  {/* Deadline */}
                  <div>
                    <label className="label-text">Deadline</label>
                    <input
                      type="date"
                      className="input-field text-sm"
                      value={parsedDeadline}
                      onChange={(e) => setParsedDeadline(e.target.value)}
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="btn-secondary text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary text-sm flex items-center gap-2"
                    >
                      <FiPlus /> Create Task
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default VoiceCommandModal;
