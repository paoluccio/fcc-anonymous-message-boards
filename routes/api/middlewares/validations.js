const mongoose = require('mongoose');

const validateBoardFields = (req, res, next) => {
  if (!req.body.board) {
    return res.status(400).json({ error: 'Board name is required' });
  } else if (!req.body.delete_password) {
    return res.status(400).json({ error: 'Delete password to this board is required' });
  }
  next();
}

const validateThreadFields = (req, res, next) => {
  if (!req.body.thread_name) {
    return res.status(400).json({ error: 'Thread name is required' });
  } else if (!req.body.delete_password) {
    return res.status(400).json({ error: 'Delete password to this thread is required' });
  }
  next();
}

const validateReplyFields = (req, res, next) => {
  if (!req.body.reply_text) {
    return res.status(400).json({ error: 'Reply text is required' });
  } else if (!req.body.delete_password) {
    return res.status(400).json({ error: 'Delete password to this reply is required' });
  }
  next();
}

const validateBoardId = (req, res, next) => {
  const { _id } = req.body;
  if (!_id) {
    return res.status(400).json({ error: 'Board ID is required' });
  } else if (!isValidId(_id)) {
    return res.status(400).json({ error: 'Invalid board ID' });
  }
  next();
};

const validateThreadId = (req, res, next) => {
  const thread_id = req.query.thread_id || req.body.thread_id;
  if (!thread_id) {
    return res.status(400).json({ error: 'Thread ID is required' });
  } else if (!isValidId(thread_id)) {
    return res.status(400).json({ error: 'Invalid thread ID' });
  }
  next();
};

const validateReplyId = (req, res, next) => {
  const { reply_id } = req.body;
  if (!reply_id) {
    return res.status(400).json({ error: 'Reply ID is required' });
  } else if (!isValidId(reply_id)) {
    return res.status(400).json({ error: 'Invalid reply ID' });
  }
  next();
};

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

module.exports = {
  validateBoardFields,
  validateThreadFields,
  validateReplyFields,
  validateBoardId,
  validateThreadId,
  validateReplyId
};