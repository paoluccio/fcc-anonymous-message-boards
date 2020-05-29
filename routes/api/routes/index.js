const express = require('express');
const BoardController = require('../controllers/BoardController');
const {
  validateBoardFields,
  validateThreadFields,
  validateReplyFields,
  validateBoardId,
  validateThreadId,
  validateReplyId
} = require('../middlewares/validations');

const api = express.Router();

// Get
api.get('/boards', BoardController.get_boards);
api.get('/threads/:board', BoardController.get_threads);
api.get('/replies/:board', validateThreadId, BoardController.get_replies);

// Create
api.post('/boards', validateBoardFields, BoardController.create_board);
api.post('/threads/:board', validateThreadFields, BoardController.create_thread);
api.post('/replies/:board', validateThreadId, validateReplyFields, BoardController.create_reply);

// Report
api.put('/threads/:board', validateThreadId, BoardController.report_thread);
api.put('/replies/:board', validateThreadId, validateReplyId, BoardController.report_reply);

// Delete
api.delete('/boards', validateBoardId, BoardController.delete_board);
api.delete('/threads/:board', validateThreadId, BoardController.delete_thread);
api.delete('/replies/:board', validateThreadId, validateReplyId, BoardController.delete_reply);

module.exports = api;