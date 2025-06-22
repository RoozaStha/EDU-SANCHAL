const LeaveRequest = require('../models/leaveRequest.model');
const Student = require('../models/student.model');
const Teacher = require('../models/teacher.model');
const mongoose = require('mongoose');

// Submit a new leave request
exports.submitLeaveRequest = async (req, res) => {
    try {
        const { startDate, endDate, reason } = req.body;
        const user = req.user;
        
        if (!startDate || !endDate || !reason) {
            return res.status(400).json({
                success: false,
                message: "Start date, end date and reason are required"
            });
        }

        const newLeave = new LeaveRequest({
            requester: user.id,
            requesterModel: user.role === 'STUDENT' ? 'Student' : 'Teacher',
            school: user.schoolId,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            reason
        });

        const savedLeave = await newLeave.save();

        res.status(201).json({
            success: true,
            data: savedLeave,
            message: "Leave request submitted successfully"
        });
    } catch (error) {
        console.error("Submit leave error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to submit leave request",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get leave requests for current user
exports.getMyLeaveRequests = async (req, res) => {
    try {
        const user = req.user;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const leaveRequests = await LeaveRequest.find({
            requester: user.id,
            school: user.schoolId
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

        const total = await LeaveRequest.countDocuments({
            requester: user.id,
            school: user.schoolId
        });

        res.status(200).json({
            success: true,
            data: leaveRequests,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Get my leaves error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get leave requests",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get pending leave requests for approval (for teachers/school)
exports.getPendingLeaveRequests = async (req, res) => {
    try {
        const user = req.user;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // For teachers, only show student leaves from their class
        let filter = {
            school: user.schoolId,
            status: 'PENDING'
        };

        if (user.role === 'TEACHER') {
            // Get class teacher's class
            const teacher = await Teacher.findById(user.id).populate('class');
            if (!teacher || !teacher.class) {
                return res.status(200).json({
                    success: true,
                    data: [],
                    pagination: { total: 0, page: 1, pages: 1 }
                });
            }

            // Get students in the teacher's class
            const students = await Student.find({
                student_class: teacher.class._id
            }).select('_id');

            filter.requester = { $in: students.map(s => s._id) };
            filter.requesterModel = 'Student';
        }

        const leaveRequests = await LeaveRequest.find(filter)
            .populate({
                path: 'requester',
                select: 'name email student_class',
                populate: {
                    path: 'student_class',
                    select: 'class_text',
                    options: { strictPopulate: false }  // ADDED THIS
                }
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await LeaveRequest.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: leaveRequests,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Get pending leaves error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get pending leave requests",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};


// Update leave request status
exports.updateLeaveStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, rejectedReason } = req.body;
        const user = req.user;

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status value"
            });
        }

        if (status === 'REJECTED' && !rejectedReason) {
            return res.status(400).json({
                success: false,
                message: "Rejection reason is required"
            });
        }

        const leaveRequest = await LeaveRequest.findById(id);

        if (!leaveRequest) {
            return res.status(404).json({
                success: false,
                message: "Leave request not found"
            });
        }

        // Authorization check
        if (user.role === 'TEACHER') {
            // Teacher can only approve student leaves from their class
            const teacher = await Teacher.findById(user.id).populate('class');
            if (!teacher.class) {
                return res.status(403).json({
                    success: false,
                    message: "You are not a class teacher"
                });
            }

            // For teacher leaves, only school can approve
            if (leaveRequest.requesterModel === 'Teacher') {
                return res.status(403).json({
                    success: false,
                    message: "Not authorized to update teacher leave requests"
                });
            }

            const student = await Student.findOne({
                _id: leaveRequest.requester,
                student_class: teacher.class._id
            });

            if (!student) {
                return res.status(403).json({
                    success: false,
                    message: "Not authorized to update this leave request"
                });
            }
        }

        leaveRequest.status = status;
        leaveRequest.updatedAt = new Date();

        if (status === 'APPROVED') {
            leaveRequest.approvedBy = user.id;
        } else {
            leaveRequest.rejectedReason = rejectedReason;
        }

        const updatedLeave = await leaveRequest.save();

        res.status(200).json({
            success: true,
            data: updatedLeave,
            message: "Leave status updated successfully"
        });
    } catch (error) {
        console.error("Update leave status error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update leave status",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Update leave request by owner
exports.updateLeaveRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate, reason } = req.body;
        const user = req.user;

        if (!startDate || !endDate || !reason) {
            return res.status(400).json({
                success: false,
                message: "Start date, end date and reason are required"
            });
        }

        const leaveRequest = await LeaveRequest.findById(id);

        if (!leaveRequest) {
            return res.status(404).json({
                success: false,
                message: "Leave request not found"
            });
        }

        // Check ownership
        if (leaveRequest.requester.toString() !== user.id) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to update this leave request"
            });
        }

        // Check if the leave request is pending
        if (leaveRequest.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: "Only pending leave requests can be updated"
            });
        }

        // Check if the school matches
        if (leaveRequest.school.toString() !== user.schoolId) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to update this leave request"
            });
        }

        // Update the leave request
        leaveRequest.startDate = new Date(startDate);
        leaveRequest.endDate = new Date(endDate);
        leaveRequest.reason = reason;
        leaveRequest.updatedAt = new Date();

        const updatedLeave = await leaveRequest.save();

        res.status(200).json({
            success: true,
            data: updatedLeave,
            message: "Leave request updated successfully"
        });
    } catch (error) {
        console.error("Update leave request error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update leave request",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Delete leave request by owner
exports.deleteLeaveRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const leaveRequest = await LeaveRequest.findById(id);

        if (!leaveRequest) {
            return res.status(404).json({
                success: false,
                message: "Leave request not found"
            });
        }

        // Check ownership
        if (leaveRequest.requester.toString() !== user.id) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to delete this leave request"
            });
        }

        // Check if the leave request is pending
        if (leaveRequest.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: "Only pending leave requests can be deleted"
            });
        }

        await LeaveRequest.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Leave request deleted successfully"
        });
    } catch (error) {
        console.error("Delete leave request error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete leave request",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get leave analytics for school
// ... (previous code)

// Get leave analytics for school
exports.getLeaveAnalytics = async (req, res) => {
  try {
    const { schoolId } = req.user;
    const { year, month } = req.query;
   
    // Validate schoolId format
    if (!mongoose.Types.ObjectId.isValid(schoolId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid school ID format"
      });
    }

    const schoolObjectId = new mongoose.Types.ObjectId(schoolId);

    // Convert year to number safely
    let targetYear = new Date().getFullYear();
    if (year) {
      const parsedYear = parseInt(year);
      if (!isNaN(parsedYear)) {
        targetYear = parsedYear;
      }
    }

    // Base match query
    const baseMatch = {
      school: schoolObjectId,
      startDate: { $exists: true, $ne: null },
      endDate: { $exists: true, $ne: null }
    };

    // Handle date range
    let dateMatch = {};
    if (year) {
      const yearStart = new Date(targetYear, 0, 1);
      const yearEnd = new Date(targetYear + 1, 0, 1);
      dateMatch.startDate = { $gte: yearStart, $lt: yearEnd };
    }

    if (month) {
      const monthNum = parseInt(month);
      if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
        const monthStart = new Date(targetYear, monthNum - 1, 1);
        const monthEnd = new Date(targetYear, monthNum, 1);
        dateMatch.startDate = { $gte: monthStart, $lt: monthEnd };
      }
    }

    // Combine matches
    const match = { ...baseMatch, ...dateMatch };

    // Analytics pipeline with robust duration calculation
    const pipeline = [
      { $match: match },
      {
        $addFields: {
          // Convert dates to milliseconds for safe calculation
          startMs: { $toLong: "$startDate" },
          endMs: { $toLong: "$endDate" }
        }
      },
      {
        $addFields: {
          // Calculate duration in days
          durationDays: {
            $cond: [
              { $and: [{ $gt: ["$endMs", "$startMs"] }] },
              {
                $add: [
                  { $ceil: { $divide: [{ $subtract: ["$endMs", "$startMs"] }, 86400000] } },
                  1
                ]
              },
              1 // Default to 1 day if dates are invalid
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          approved: {
            $sum: {
              $cond: [{ $eq: ["$status", "APPROVED"] }, 1, 0]
            }
          },
          rejected: {
            $sum: {
              $cond: [{ $eq: ["$status", "REJECTED"] }, 1, 0]
            }
          },
          pending: {
            $sum: {
              $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0]
            }
          },
          avgDuration: { $avg: "$durationDays" }
        }
      },
      {
        $project: {
          _id: 0,
          totalRequests: 1,
          approved: 1,
          rejected: 1,
          pending: 1,
          approvalRate: {
            $cond: [
              { $eq: ["$totalRequests", 0] },
              0,
              { $divide: ["$approved", "$totalRequests"] }
            ]
          },
          avgDuration: {
            $cond: [
              { $eq: ["$avgDuration", null] },
              0,
              { $round: ["$avgDuration", 1] }
            ]
          }
        }
      }
    ];

    // Monthly trend pipeline
    const monthlyPipeline = [
      { $match: baseMatch },
      {
        $addFields: {
          year: { $year: "$startDate" },
          month: { $month: "$startDate" }
        }
      },
      { $match: { year: targetYear } },
      {
        $group: {
          _id: "$month",
          count: { $sum: 1 },
          approved: {
            $sum: {
              $cond: [{ $eq: ["$status", "APPROVED"] }, 1, 0]
            }
          }
        }
      },
      { $sort: { "_id": 1 } },
      {
        $project: {
          _id: 0,
          month: "$_id",
          count: 1,
          approved: 1
        }
      }
    ];

    // By requester type pipeline
    const typePipeline = [
      { $match: match },
      {
        $group: {
          _id: "$requesterModel",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          type: "$_id",
          count: 1
        }
      }
    ];

    // Recent leaves (last 5)
    const recentLeaves = await LeaveRequest.find(match)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({
        path: 'requester',
        select: 'name student_class',
        populate: {
          path: 'student_class',
          select: 'class_text',
          model: 'Class',
          options: { strictPopulate: false }  // ADDED THIS
        }
      })
      .lean();

    const [analytics, monthlyTrend, typeDistribution] = await Promise.all([
      LeaveRequest.aggregate(pipeline),
      LeaveRequest.aggregate(monthlyPipeline),
      LeaveRequest.aggregate(typePipeline)
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: analytics[0] || {
          totalRequests: 0,
          approved: 0,
          rejected: 0,
          pending: 0,
          approvalRate: 0,
          avgDuration: 0
        },
        monthlyTrend: monthlyTrend || [],
        typeDistribution: typeDistribution || [],
        recentLeaves: recentLeaves || []
      }
    });
  } catch (error) {
    console.error("Get leave analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get leave analytics",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ... (rest of the code remains the same)

// Get leave calendar events
exports.getLeaveCalendar = async (req, res) => {
    try {
        const { schoolId } = req.user;
        const { start, end } = req.query;
        
        if (!start || !end) {
            return res.status(400).json({
                success: false,
                message: "Start and end dates are required"
            });
        }

        const leaves = await LeaveRequest.find({
            school: schoolId,
            startDate: { $gte: new Date(start) },
            endDate: { $lte: new Date(end) },
            status: 'APPROVED'
        })
        .populate({
            path: 'requester',
            select: 'name'
        })
        .lean();

        const events = leaves.map(leave => ({
            id: leave._id,
            title: `${leave.requester.name} - Leave`,
            start: leave.startDate,
            end: leave.endDate,
            allDay: true,
            extendedProps: {
                type: 'leave',
                status: leave.status
            }
        }));

        res.status(200).json({
            success: true,
            data: events
        });
    } catch (error) {
        console.error("Get leave calendar error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get leave calendar",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get all leave requests for school
exports.getAllLeaveRequests = async (req, res) => {
    try {
        const user = req.user;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        if (user.role !== 'SCHOOL') {
            return res.status(403).json({
                success: false,
                message: "Only school admins can access all leave requests"
            });
        }

        const filter = {
            school: user.schoolId
        };

        const leaveRequests = await LeaveRequest.find(filter)
            .populate({
                path: 'requester',
                select: 'name email student_class',
                populate: {
                    path: 'student_class',
                    select: 'class_text',
                    options: { strictPopulate: false }  // ADDED THIS
                }
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await LeaveRequest.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: leaveRequests,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Get all leaves error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get leave requests",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};