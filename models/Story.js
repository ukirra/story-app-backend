const mongoose = require('mongoose');

const ChapterSchema = new mongoose.Schema({
  title: String,
  content: String,
  updatedAt: String,
});

const StorySchema = new mongoose.Schema({
  title: String,
  writers: String,
  synopsis: String,
  category: String,
  status: String,
  keyword: [String],
  cover: String,
  chapters: [ChapterSchema],
  lastUpdated: String,
}, {
  timestamps: true,
});

module.exports = mongoose.model('Story', StorySchema);