const Job = require('../models/job.model');

const User = require('../models/user.model');

const mongoose = require('mongoose');


 

// Create a new job (Manager only)

exports.createJob = async (req, res) => {

  try {

    console.log('Creating job with data:', req.body);


 

    const { title, description, department, skillsRequired, location, level, lastDate } = req.body;

    if (!title || !description || !location || !lastDate) {

      return res.status(400).json({ message: 'Missing required fields' });

    }


 

    function generateJobId() {

      return `JOB-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    }


 

    const job = new Job({

      jobId: generateJobId(), // Function to generate unique job ID

      title,

      description,

      department,

      skillsRequired,

      location,

      level,

      postedBy: req.user.userId,

      postedDate: new Date(),

      lastDate: new Date(lastDate),

      updatedAt: new Date(),

      isActive: true,

      applicants: []

    });


 

    await job.save();

    res.status(201).json({ message: 'Job created successfully', job });

  } catch (error) {

    res.status(500).json({ message: 'Server error', error: error.message });

  }

};


 

// Update a job (Manager only)

exports.updateJob = async (req, res) => {

  try {

    const { jobId } = req.params;

    const updateData = req.body;


 

    const job = await Job.findById(jobId);

    if (!job) return res.status(404).json({ message: 'Job not found' });


 

    if (job.postedBy.toString() !== req.user.userId) {

      return res.status(403).json({ message: 'You can only update your own job postings' });

    }


 

    Object.assign(job, updateData);

    job.updatedAt = new Date();


 

    await job.save();

    res.json({ message: 'Job updated successfully', job });

  } catch (error) {

    res.status(500).json({ message: 'Server error', error: error.message });

  }

};


 

// Delete a job (Manager only)

exports.deleteJob = async (req, res) => {

  try {

    const { jobId } = req.params;

    const job = await Job.findById(jobId);

    if (!job) return res.status(404).json({ message: 'Job not found' });

    console.log("job is ", job);

    console.log("user is ", req.user);


 

    if (job.postedBy.toString() !== req.user.userId && req.user.role !== 'hr') {

      return res.status(403).json({ message: 'You can only delete your own job postings' });

    }


 

    await job.deleteOne();

    res.json({ message: 'Job deleted successfully' });

  } catch (error) {

    res.status(500).json({ message: 'Server error', error: error.message });

  }

};


 

// List jobs with optional filters (any authenticated user)

exports.listJobs = async (req, res) => {

  try {

    const { skills, location, minSalary, maxSalary, isActive } = req.query;

    console.log("in list jobs");



 

    // Build filter query

    const filter = {};

    if (skills) filter.skillsRequired = { $all: skills.split(',') };

    if (location) filter.location = location;

    if (minSalary || maxSalary) {

      filter.salary = {};

      if (minSalary) filter.salary.$gte = Number(minSalary);

      if (maxSalary) filter.salary.$lte = Number(maxSalary);

    }

    if (isActive !== undefined) filter.isActive = isActive === 'true';


 

    const jobs = await Job.find(filter).sort({ postedDate: -1 });

    console.log("jobs in backend are", jobs);

    res.json({ jobs });

  } catch (error) {

    res.status(500).json({ message: 'Server error', error: error.message });

  }

};


 

exports.myListedJobs = async (req, res) => {

  try {

    const employeeId = req.user.userId; // This should be the employeeId stored in postedBy

    const jobs = await Job.find({ postedBy: employeeId }).sort({ postedDate: -1 });

    res.json({ jobs });

  } catch (error) {

    res.status(500).json({ message: 'Server error', error: error.message });

  }

};



 

exports.applyToJob = async (req, res) => {

  try {

    const { jobId } = req.params;

    const userId = req.user.userId;


 

    // Find the job

    const job = await Job.findById(jobId);

    if (!job || !job.isActive) {

      return res.status(404).json({ message: 'Job not found or inactive' });

    }


 

    // Check if user already applied

    const alreadyApplied = job.applicants.some(

      (applicant) => applicant.userId.toString() === userId

    );

    if (alreadyApplied) {

      return res.status(400).json({ message: 'You have already applied to this job' });

    }


 

    const user = await User.findOne({ authId: userId });

    if (!user) return res.status(404).json({ message: 'User not found' });


 

    // Add applicant snapshot to job

    job.applicants.push({

      userId: user.employeeId, // employeeId as string

      name: user.name,

      email: user.email,

      role: user.role,

      skills: user.skills,

      certifications: user.certifications,

      status: 'applied',

      appliedAt: new Date(),

    });

    await job.save();

    console.log("job after applying is", job);


 

    // Also update user's appliedJobs



 

    // Add job details to user's appliedJobs

    user.appliedJobs.push({

      jobId: job.jobId, // string

      title: job.title,

      location: job.location,

      status: 'applied',

      appliedAt: new Date(),

      notification: 'Application received',

    });

    await user.save();


 

    res.json({ message: 'Application submitted successfully' });

  } catch (error) {

    console.error('Error applying to job:', error);

    res.status(500).json({ message: 'Server error', error: error.message });

  }

};


 

// Withdraw from a job (Employee only)

exports.withdrawApplication = async (req, res) => {

  try {

    const { jobId } = req.params;

    const userId = req.user.userId;


 

    // Find the job

    const job = await Job.findById(jobId);

    if (!job) {

      return res.status(404).json({ message: 'Job not found' });

    }


 

    // Check if user has applied

    const applicantIndex = job.applicants.findIndex(

      applicant => applicant.userId.toString() === userId

    );

    if (applicantIndex === -1) {

      return res.status(400).json({ message: 'You have not applied to this job' });

    }


 

    // Remove applicant from job's applicants array

    job.applicants = job.applicants.filter(

      applicant => applicant.userId.toString() !== userId

    );

    await job.save();


 

    // Find user profile

    const user = await User.findOne({ authId: userId });

    if (!user) {

      return res.status(404).json({ message: 'User profile not found' });

    }


 

    // Remove job from user's appliedJobs

    user.appliedJobs = user.appliedJobs.filter(

      appliedJob => appliedJob.jobId.toString() !== jobId

    );

    await user.save();


 

    res.json({ message: 'Application withdrawn successfully' });

  } catch (error) {

    console.error('Error withdrawing application:', error);

    res.status(500).json({ message: 'Server error', error: error.message });

  }

};




 

// View applicants for a job (Manager only)

exports.viewApplicants = async (req, res) => {

  try {

    const { jobId } = req.params;


 

    const job = await Job.findById(jobId)

    if (!job) return res.status(404).json({ message: 'Job not found' });


 

    if (job.postedBy.toString() !== req.user.userId) {

      return res.status(403).json({ message: 'You can only view applicants for your own jobs' });

    }


 

    res.json({ applicants: job.applicants });

  } catch (error) {

    res.status(500).json({ message: 'Server error', error: error.message });

  }

};


 

// View application status & notifications for current user (Employee only)

exports.viewApplications = async (req, res) => {

  try {

    const userId = req.user.userId;


 

    // Find the user and populate appliedJobs

    const user = await User.findOne({ authId: userId }).populate({

      path: 'appliedJobs.jobId',

      select: 'title location'

    });

    if (!user) {

      return res.status(404).json({ message: 'User not found' });

    }


 

    res.json({ appliedJobs: user.appliedJobs });

  } catch (error) {

    console.error('Error fetching applications:', error);

    res.status(500).json({ message: 'Server error', error: error.message });

  }

};