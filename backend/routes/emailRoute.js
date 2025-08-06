const express = require('express');
const multer = require('multer');
const router = express.Router();
const upload = multer();

router.post('/inbound-email', upload.none(), (req, res) => {
  const emailData = req.body;
  console.log('í³¨ Inbound email received:', emailData);

  // TODO: Add logic to store, forward, or trigger workflows
  res.status(200).send('OK');
});

module.exports = router;
