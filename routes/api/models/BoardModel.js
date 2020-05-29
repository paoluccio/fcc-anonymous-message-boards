const mongoose = require('mongoose');

const ReplySchema = new mongoose.Schema({
  reply_text: { type: String, trim: true },
  created_on: { type: Date, default: Date.now },
  delete_password: { type: String, select: false },
  reported: { type: Boolean, default: false, select: false }
});

const ThreadSchema = new mongoose.Schema({
  thread_name: { type: String, trim: true },
  created_on: { type: Date, default: Date.now },
  bumped_on: { type: Date, default: Date.now },
  delete_password: { type: String, select: false },
  reported: { type: Boolean, default: false, select: false },
  replies: [ReplySchema],
});

const BoardSchema = new mongoose.Schema({
  board: { type: String, trim: true },
  delete_password: { type: String, select: false },
  threads: [ThreadSchema]
});

module.exports = mongoose.model('Board', BoardSchema);