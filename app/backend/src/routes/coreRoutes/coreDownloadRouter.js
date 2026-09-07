const express = require('express');
const mongoose = require('mongoose');
const downloadPdf = require('@/handlers/downloadHandler/downloadPdf');

const router = express.Router();

const ALLOWED_DIRECTORIES = ['invoice', 'quote', 'payment', 'offer'];

router.route('/:directory/:file').get(async function (req, res) {
  try {
    const { directory, file } = req.params;

    // Reject disabled or unauthorized accounts
    if (req.admin && req.admin.enabled === false) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'Account is unauthorized or disabled.',
      });
    }

    if (!directory || !ALLOWED_DIRECTORIES.includes(directory.toLowerCase())) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Invalid directory parameter.',
      });
    }

    let id = file || '';
    if (id.endsWith('.pdf')) {
      id = id.slice(0, -4);
    }
    const prefix = directory.toLowerCase() + '-';
    if (id.toLowerCase().startsWith(prefix)) {
      id = id.slice(prefix.length);
    }

    if (!mongoose.Types.ObjectId.isValid(id) || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Invalid document ID parameter.',
      });
    }

    return await downloadPdf(req, res, { directory: directory.toLowerCase(), id });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: 'An error occurred during file download.',
    });
  }
});

module.exports = router;
