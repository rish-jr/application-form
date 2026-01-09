const mongoose = require("mongoose");

/*
  Using strict:false so all dynamic
  form fields are stored safely
*/
const ApplicationSchema = new mongoose.Schema(
  {},
  {
    strict: false,
    timestamps: true
  }
);

module.exports = mongoose.model("Application", ApplicationSchema);
