const Schedule = require("../models/schedule.model");
const mongoose = require("mongoose");

async function checkTimeConflict({ school, teacher, class: classId, startTime, endTime }) {
  try {
    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(school) || 
        !mongoose.Types.ObjectId.isValid(teacher) || 
        !mongoose.Types.ObjectId.isValid(classId)) {
      throw new Error("Invalid ID format for school, teacher, or class");
    }

    if (!(startTime instanceof Date) || !(endTime instanceof Date)) {
      throw new Error("Invalid date objects provided");
    }

    if (startTime >= endTime) {
      throw new Error("End time must be after start time");
    }

    // Check for teacher conflicts
    const teacherConflicts = await Schedule.find({
      school,
      teacher,
      $or: [
        { 
          $and: [
            { startTime: { $lt: endTime } },
            { endTime: { $gt: startTime } }
          ]
        }
      ]
    })
    .populate('teacher subject class')
    .lean();

    // Check for class conflicts
    const classConflicts = await Schedule.find({
      school,
      class: classId,
      $or: [
        { 
          $and: [
            { startTime: { $lt: endTime } },
            { endTime: { $gt: startTime } }
          ]
        }
      ]
    })
    .populate('teacher subject class')
    .lean();

    // Format conflict data
    const formatConflictData = (conflicts, type) => {
      return conflicts.map(conflict => ({
        type,
        existingSchedule: {
          id: conflict._id,
          teacher: conflict.teacher?.name || 'Unknown Teacher',
          subject: conflict.subject?.subject_name || 'Unknown Subject',
          class: conflict.class?.className || 'Unknown Class',
          startTime: conflict.startTime,
          endTime: conflict.endTime
        },
        message: `${type} conflict: Already scheduled from ${conflict.startTime.toLocaleString()} to ${conflict.endTime.toLocaleString()}`
      }));
    };

    const allConflicts = [
      ...formatConflictData(teacherConflicts, 'teacher'),
      ...formatConflictData(classConflicts, 'class')
    ];

    return allConflicts.length > 0 ? allConflicts : null;
  } catch (error) {
    console.error("Error checking schedule conflict:", error);
    throw error;
  }
}

module.exports = { checkTimeConflict };