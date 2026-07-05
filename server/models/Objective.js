const mongoose = require('mongoose');

const objectiveSchema = new mongoose.Schema(
  {
    missionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mission',
      required: [true, 'Mission ID is required'],
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace is required'],
    },
    title: {
      type: String,
      required: [true, 'Objective title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Backlog', 'To Do', 'In Progress', 'Review', 'Completed'],
      default: 'Backlog',
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    deadline: {
      type: Date,
      default: null,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    blockerReason: {
      type: String,
      default: '',
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
objectiveSchema.index({ workspace: 1, status: 1 });
objectiveSchema.index({ workspace: 1, assignedTo: 1 });
objectiveSchema.index({ workspace: 1, assignees: 1 });
objectiveSchema.index({ missionId: 1, status: 1 });
objectiveSchema.index({ assignedTo: 1 });
objectiveSchema.index({ assignees: 1 });
objectiveSchema.index({ deadline: 1 });

module.exports = mongoose.model('Objective', objectiveSchema);
