const mongoose = require("mongoose");

const ApplicationSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  phone: String,
  dob: String,
  address: String,
  qualification: String,
  skills: String,
  photo: String,
  resume: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Application", ApplicationSchema);
