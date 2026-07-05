const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Workspace = require('./models/Workspace');
const Mission = require('./models/Mission');
const Objective = require('./models/Objective');

dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/missiongrid';

const avatar = (name, color) =>
  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=${color}`;

const seedDB = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding');

    await Objective.deleteMany({});
    await Mission.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});
    console.log('Cleared existing demo data');

    const captain = await User.create({
      name: 'Commander Nova',
      email: 'captain@missiongrid.io',
      password: 'mission123',
      role: 'Captain',
      avatar: avatar('Commander Nova', '0ea5e9'),
    });

    const crew = await User.create([
      {
        name: 'Aria Chen',
        email: 'aria@missiongrid.io',
        password: 'mission123',
        role: 'Crew',
        avatar: avatar('Aria Chen', '8b5cf6'),
      },
      {
        name: 'Rex Dalton',
        email: 'rex@missiongrid.io',
        password: 'mission123',
        role: 'Crew',
        avatar: avatar('Rex Dalton', 'f59e0b'),
      },
      {
        name: 'Luna Park',
        email: 'luna@missiongrid.io',
        password: 'mission123',
        role: 'Crew',
        avatar: avatar('Luna Park', 'ec4899'),
      },
    ]);

    const workspace = await Workspace.create({
      name: 'OrbitWorks Studio',
      owner: captain._id,
      members: [captain._id, ...crew.map((member) => member._id)],
      inviteCode: 'ORBIT123',
    });

    await User.updateMany(
      { _id: { $in: [captain._id, ...crew.map((member) => member._id)] } },
      { workspace: workspace._id }
    );

    const now = new Date();
    const daysFromNow = (days) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const daysAgo = (days) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const missions = await Mission.create([
      {
        workspace: workspace._id,
        title: 'Operation Nebula Frontend',
        description: 'Polish MissionGrid frontend flows, routing, command center visuals, and production states.',
        category: 'Development',
        priority: 'High',
        status: 'Active',
        startDate: daysAgo(24),
        deadline: daysFromNow(5),
        crew: [captain._id, crew[0]._id, crew[1]._id],
        createdBy: captain._id,
        progress: 48,
        coreStability: 68,
      },
      {
        workspace: workspace._id,
        title: 'Quantum API Infrastructure',
        description: 'Harden API authentication, workspace scoping, analytics endpoints, and seed workflows.',
        category: 'Infrastructure',
        priority: 'Critical',
        status: 'Active',
        startDate: daysAgo(10),
        deadline: daysFromNow(8),
        crew: [captain._id, crew[0]._id, crew[1]._id, crew[2]._id],
        createdBy: captain._id,
        progress: 32,
        coreStability: 59,
      },
      {
        workspace: workspace._id,
        title: 'Galaxy Brand Redesign',
        description: 'Create a cohesive visual language for MissionGrid launch materials and internal decks.',
        category: 'Design',
        priority: 'Medium',
        status: 'Active',
        startDate: daysAgo(14),
        deadline: daysFromNow(18),
        crew: [captain._id, crew[2]._id],
        createdBy: captain._id,
        progress: 76,
        coreStability: 86,
      },
    ]);

    await Objective.insertMany([
      {
        workspace: workspace._id,
        missionId: missions[0]._id,
        title: 'Fix routing and protected dashboard rendering',
        description: 'Ensure each route maps to the correct page and never renders a blank screen.',
        assignedTo: crew[0]._id,
        priority: 'Critical',
        status: 'Completed',
        progress: 100,
        deadline: daysAgo(1),
      },
      {
        workspace: workspace._id,
        missionId: missions[0]._id,
        title: 'Blend comet and orbit assets into cinematic overlays',
        description: 'Keep asset edges hidden and use opacity, screen blending, and glow effects.',
        assignedTo: crew[1]._id,
        priority: 'High',
        status: 'In Progress',
        progress: 55,
        deadline: daysFromNow(2),
      },
      {
        workspace: workspace._id,
        missionId: missions[0]._id,
        title: 'Create responsive command center cards',
        description: 'Fit dashboard panels cleanly on laptop and desktop viewports.',
        assignedTo: crew[0]._id,
        priority: 'High',
        status: 'Review',
        progress: 82,
        deadline: daysFromNow(4),
      },
      {
        workspace: workspace._id,
        missionId: missions[1]._id,
        title: 'Implement workspace invite flow',
        description: 'Register Project Managers, generate invite codes, and allow Team Members to join safely.',
        assignedTo: captain._id,
        priority: 'Critical',
        status: 'In Progress',
        progress: 60,
        deadline: daysFromNow(3),
      },
      {
        workspace: workspace._id,
        missionId: missions[1]._id,
        title: 'Scope mission APIs by workspace',
        description: 'Prevent cross-workspace access and enforce role permissions.',
        assignedTo: crew[1]._id,
        priority: 'Critical',
        status: 'In Progress',
        progress: 35,
        deadline: daysFromNow(4),
        isBlocked: true,
        blockerReason: 'Needs final permission review',
      },
      {
        workspace: workspace._id,
        missionId: missions[1]._id,
        title: 'Add assigned objectives endpoint',
        description: 'Return only the current Team Member objectives for focused dashboards.',
        assignedTo: crew[0]._id,
        priority: 'High',
        status: 'To Do',
        progress: 10,
        deadline: daysFromNow(6),
      },
      {
        workspace: workspace._id,
        missionId: missions[2]._id,
        title: 'Design launch presentation visuals',
        description: 'Prepare polished visual assets and narrative frames for the launch story.',
        assignedTo: crew[2]._id,
        priority: 'Medium',
        status: 'In Progress',
        progress: 64,
        deadline: daysFromNow(10),
      },
      {
        workspace: workspace._id,
        missionId: missions[2]._id,
        title: 'Finalize design token palette',
        description: 'Document color, typography, spacing, and interaction tokens.',
        assignedTo: crew[2]._id,
        priority: 'Medium',
        status: 'Completed',
        progress: 100,
        deadline: daysAgo(2),
      },
    ]);

    console.log('Seed completed successfully');
    console.log('Demo credentials:');
    console.log('  Project Manager: captain@missiongrid.io / mission123');
    console.log('  Team Member:     aria@missiongrid.io / mission123');
    console.log('  Team Member:     rex@missiongrid.io / mission123');
    console.log('  Team Member:     luna@missiongrid.io / mission123');
    console.log('Invite link: http://localhost:5173/join/ORBIT123');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedDB();
