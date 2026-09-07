const custom = require('@/controllers/pdfController');
const mongoose = require('mongoose');
const path = require('path');

const downloadPdf = async (req, res, { directory, id }) => {
  try {
    const modelName = directory.slice(0, 1).toUpperCase() + directory.slice(1);
    if (!mongoose.models[modelName]) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Document not found',
      });
    }

    const Model = mongoose.model(modelName);
    let query = Model.findOne({
      _id: id,
    });
    if (typeof query.populate === 'function' && Model.schema?.paths?.client) {
      query = query.populate('client');
    }
    const result = typeof query.exec === 'function' ? await query.exec() : await query;

    if (!result) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Document not found',
      });
    }

    const fileId = modelName.toLowerCase() + '-' + result._id + '.pdf';
    const folderPath = modelName.toLowerCase();
    const targetLocation = path.join(__dirname, '../../public/download', folderPath, fileId);

    await custom.generatePdf(
      modelName,
      { filename: folderPath, format: 'A4', targetLocation },
      result
    );

    res.set('Content-Disposition', `attachment; filename="${fileId}"`);
    return res.download(targetLocation, fileId, (error) => {
      if (error && !res.headersSent) {
        return res.status(500).json({
          success: false,
          result: null,
          message: 'Unable to deliver generated PDF file',
        });
      }
    });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'BSONTypeError') {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Invalid parameters provided for download',
      });
    }

    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to generate or download document',
    });
  }
};

module.exports = downloadPdf;
