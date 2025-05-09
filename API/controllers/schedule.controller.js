const Schedule = require('../models/schedule.model');
const mongoose = require('mongoose');

/**
 * Create a new schedule
 */
exports.createSchedule = async (req, res) => {
  try {
    const { teacher, subject, class: classId, startTimeISO, endTimeISO } = req.body;

    // Debug logging
    console.log('User object:', req.user);
    console.log('Request body:', req.body);
    
    // Validate input
    if (!teacher || !subject || !classId || !startTimeISO || !endTimeISO) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    // Use schoolId from JWT token (renamed from what was originally expected)
    if (!req.user || !req.user.schoolId) {
      return res.status(400).json({
        success: false,
        message: 'School information is missing from authentication'
      });
    }

    const startTime = new Date(startTimeISO);
    const endTime = new Date(endTimeISO);

    // Check if dates are valid
    if (isNaN(startTime.getTime())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid start time' 
      });
    }

    if (isNaN(endTime.getTime())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid end time' 
      });
    }

    // Check if end time is after start time
    if (endTime <= startTime) {
      return res.status(400).json({ 
        success: false, 
        message: 'End time must be after start time' 
      });
    }

    // Improved conflict detection query
    const conflict = await Schedule.findOne({
      class: classId,
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    });

    if (conflict) {
      return res.status(400).json({
        success: false,
        message: 'Schedule conflict detected',
        data: {
          conflictingWith: {
            id: conflict._id,
            teacher: conflict.teacher,
            subject: conflict.subject,
            startTime: conflict.startTime,
            endTime: conflict.endTime
          }
        }
      });
    }

    const newSchedule = new Schedule({
      school: req.user.schoolId, // Use schoolId from user object
      teacher,
      subject,
      class: classId,
      startTime,
      endTime
    });

    const savedSchedule = await newSchedule.save();

    // Populate references for the response
    const populatedSchedule = await Schedule.findById(savedSchedule._id)
      .populate('teacher', 'name')
      .populate('subject', 'subject_name')
      .populate('class', 'class_text');

    res.status(201).json({
      success: true,
      message: 'Schedule created successfully',
      data: populatedSchedule
    });
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create schedule',
      error: error.message
    });
  }
};

/**
 * Update an existing schedule
 */
exports.updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { teacher, subject, class: classId, startTimeISO, endTimeISO } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid schedule ID' 
      });
    }

    const startTime = new Date(startTimeISO);
    const endTime = new Date(endTimeISO);

    // Check if end time is after start time
    if (endTime <= startTime) {
      return res.status(400).json({ 
        success: false, 
        message: 'End time must be after start time' 
      });
    }

    // Check for schedule conflicts (excluding the current schedule being updated)
    const conflict = await Schedule.findOne({
      _id: { $ne: id },
      class: classId,
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
      ]
    });

    if (conflict) {
      return res.status(400).json({
        success: false,
        message: 'Schedule conflict detected with existing period',
        conflictingSchedule: conflict
      });
    }

    const updatedSchedule = await Schedule.findByIdAndUpdate(
      id,
      { 
        teacher, 
        subject, 
        class: classId, 
        startTime, 
        endTime 
      },
      { 
        new: true, 
        runValidators: true 
      }
    )
    .populate('teacher', 'name')
    .populate('subject', 'subject_name')
    .populate('class', 'class_text');

    if (!updatedSchedule) {
      return res.status(404).json({ 
        success: false, 
        message: 'Schedule not found' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Schedule updated successfully',
      data: updatedSchedule
    });
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update schedule',
      error: error.message
    });
  }
};

/**
 * Delete a schedule
 */
exports.deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid schedule ID' 
      });
    }

    const deletedSchedule = await Schedule.findByIdAndDelete(id);

    if (!deletedSchedule) {
      return res.status(404).json({ 
        success: false, 
        message: 'Schedule not found' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Schedule deleted successfully',
      data: deletedSchedule
    });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete schedule',
      error: error.message
    });
  }
};

/**
 * Get schedules by class ID
 */
exports.getSchedulesByClass = async (req, res) => {
  try {
    const { classId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid class ID' 
      });
    }

    const schedules = await Schedule.find({ class: classId })
      .populate('teacher', 'name')
      .populate('subject', 'subject_name')
      .populate('class', 'class_text')
      .sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      message: 'Schedules retrieved successfully',
      data: schedules
    });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch schedules',
      error: error.message
    });
  }
};

/**
 * Get a single schedule by ID
 */
exports.getScheduleById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid schedule ID' 
      });
    }

    const schedule = await Schedule.findById(id)
      .populate('teacher', 'name')
      .populate('subject', 'subject_name')
      .populate('class', 'class_text');

    if (!schedule) {
      return res.status(404).json({ 
        success: false, 
        message: 'Schedule not found' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Schedule retrieved successfully',
      data: schedule
    });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch schedule',
      error: error.message
    });
  }
};