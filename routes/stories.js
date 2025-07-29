const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const Story = require('../models/Story');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

router.post('/upload/cover', upload.single('cover'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const fileUrl = `/uploads/${req.file.filename}`;
  res.status(200).json({
    filename: req.file.filename,
    url: fileUrl,
  });
});

router.get('/', async (req, res) => {
  const { search = '', category = '', status = '' } = req.query;

  const query = {
    $and: [
      {
        $or: [
          { title: new RegExp(search, 'i') },
          { writers: new RegExp(search, 'i') },
        ],
      },
      category ? { category } : {},
      status ? { status } : {},
    ],
  };

  try {
    const stories = await Story.find(query);
    res.json(stories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ error: 'Not found' });
    res.json(story);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, writers, category, chapters } = req.body;

    if (!title || !writers || !category) {
      return res.status(400).json({ error: 'Title, Author, and Category are required.' });
    }

    if (!chapters || chapters.length === 0) {
      return res.status(400).json({ error: 'Story must have at least one chapter.' });
    }

    const chaptersWithDate = chapters.map(ch => ({
      ...ch,
      updatedAt: new Date().toLocaleDateString('en-GB', {
        day: '2-digit', month: 'long', year: 'numeric'
      })
    }));

    const story = new Story({
      ...req.body,
      chapters: chaptersWithDate,
      lastUpdated: new Date().toISOString(),
    });

    const saved = await story.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, writers, category, chapters } = req.body;

    if (!title || !writers || !category) {
      return res.status(400).json({ error: 'Title, Author, and Category are required.' });
    }

    if (!chapters || chapters.length === 0) {
      return res.status(400).json({ error: 'Story must have at least one chapter.' });
    }

    const chaptersWithDate = chapters.map(ch => ({
      ...ch,
      updatedAt: new Date().toLocaleDateString('en-GB', {
        day: '2-digit', month: 'long', year: 'numeric'
      })
    }));

    const updated = await Story.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        chapters: chaptersWithDate,
        lastUpdated: new Date().toISOString(),
      },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Story.findByIdAndDelete(req.params.id);
    res.json({ message: 'Story deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/chapters', async (req, res) => {
  try {
    const chapter = {
      ...req.body,
      updatedAt: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
    };

    const updatedStory = await Story.findByIdAndUpdate(
      req.params.id,
      {
        $push: { chapters: chapter },
        $set: { lastUpdated: new Date().toISOString() },
      },
      { new: true }
    );

    if (!updatedStory) return res.status(404).json({ error: 'Story not found' });
    res.status(200).json(updatedStory);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;