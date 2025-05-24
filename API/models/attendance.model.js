const mongoose = require("mongoose");
const moment = require("moment");

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    date: {
      type: Date,
      required: true,
      get: (v) => moment(v).format("YYYY-MM-DD"),
    },
    status: {
      type: String,
      enum: ["present", "absent", "late", "half_day", "excused"],
      default: "present",
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    remarks: {
      type: String,
      maxlength: 200,
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

attendanceSchema.index(
  { student: 1, date: 1, school: 1 },
  { unique: true }
);

attendanceSchema.virtual("formattedDate").get(function () {
  return moment(this.date).format("MMMM Do, YYYY");
});

attendanceSchema.pre("save", function (next) {
  if (this.isModified("date")) {
    this.date = moment(this.date).startOf("day").toDate();
  }
  next();
});

module.exports = mongoose.model("Attendance", attendanceSchema);