const router = require('express').Router();
const { chat } = require('../controllers/botController');

router.post('/chat', chat);

module.exports = router;
