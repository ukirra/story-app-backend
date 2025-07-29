const express = require('express');
const router = express.Router();
const Story = require('../models/Story');

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
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ error: 'Story not found' });
    res.json(story);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch story' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, writers, category, status, keyword, cover, chapters } = req.body;

    if (!title || !writers || !category || !status) {
      return res.status(400).json({ error: 'Title, Author, Category, and Status are required.' });
    }

    const story = new Story({
      title,
      writers,
      category,
      status,
      keyword: keyword || [],
      cover: cover || '',
      chapters: [],
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
    const { title, writers, category, status, keyword, cover, chapters } = req.body;

    if (!title || !writers || !category || !status) {
      return res.status(400).json({ error: 'Title, Author, Category, and Status are required.' });
    }

    const chaptersWithDate = (chapters || []).map((ch) => ({
      ...ch,
      updatedAt: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
    }));

    const updated = await Story.findByIdAndUpdate(
      req.params.id,
      {
        title,
        writers,
        category,
        status,
        keyword: keyword || [],
        cover: cover || '',
        chapters: chaptersWithDate,
        lastUpdated: new Date().toISOString(),
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Story not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Story.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Story not found' });
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