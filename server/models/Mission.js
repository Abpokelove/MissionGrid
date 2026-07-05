const mongoose = require('mongoose');

const missionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Mission title is required'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    category: {
      type: String,
      enum: ['Development', 'Design', 'Marketing', 'Research', 'Operations', 'Infrastructure', 'Other'],
      default: 'Other',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Planning', 'Active', 'Paused', 'Completed', 'Archived'],
      default: 'Planning',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    deadline: {
      type: Date,
    },
    crew: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace is required'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    coreStability: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
missionSchema.index({ workspace: 1, status: 1 });
missionSchema.index({ createdBy: 1, status: 1 });
missionSchema.index({ crew: 1 });

module.exports = mongoose.model('Mission', missionSchema);
