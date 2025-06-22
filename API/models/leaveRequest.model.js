const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'requesterModel'
    },
    requesterModel: {
        type: String,
        required: true,
        enum: ['Student', 'Teacher']
    },
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    reason: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING'
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        default: null
    },
    rejectedReason: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strictPopulate: false  // ADDED THIS LINE
});

// Virtual for duration in days
leaveRequestSchema.virtual('duration').get(function() {
    if (!this.startDate || !this.endDate || this.endDate < this.startDate) {
        return 0;
    }
    const diffTime = Math.abs(this.endDate - this.startDate);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
});

// Indexes for faster queries
leaveRequestSchema.index({ school: 1, status: 1 });
leaveRequestSchema.index({ requester: 1 });
leaveRequestSchema.index({ startDate: 1 });

// Enable virtuals for lean queries
leaveRequestSchema.set('toObject', { virtuals: true });
leaveRequestSchema.set('toJSON', { virtuals: true });

const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);

module.exports = LeaveRequest;