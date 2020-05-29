const express = require('express');
const path = require('path');
const api = require('./api/routes/index');

const router = express.Router();

// API routes
router.use('/api', api);

// Index page (List of boards)
router.get('/', (req, res, next) => res.sendFile(path.resolve('views/index.html')));

// Threads page (List of threads)
router.get('/:board', (req, res, next) => res.sendFile(path.resolve('views/threads.html')));

// Replies page (List of replies)
router.get('/:board/:thread/:id', (req, res, next) => res.sendFile(path.resolve('views/replies.html')));

// Error handler
router.use((err, req, res, next) => {
  if (err) res.status(err.status || 500).json({ error: err.message || 'SERVER ERROR' });
});

// Handle non existing routes
router.use((req, res) => res.redirect('/'));

module.exports = router;