const custom = require('@/controllers/pdfController');
const mongoose = require('mongoose');
const path = require('path');

module.exports = downloadPdf = async (req, res, { directory, id }) => {
  try {
    const modelName = directory.slice(0, 1).toUpperCase() + directory.slice(1);
    if (!mongoose.models[modelName]) {
      return res.status(404).json({
        success: false,
        result: null,
        message: `Model '${modelName}' does not exist`,
      });
    }

    const Model = mongoose.model(modelName);
    const result = await Model.findOne({
      _id: id,
    }).exec();

    if (!result) {
      throw { name: 'ValidationError' };
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
          message: "Couldn't find file",
          error: error.message,
        });
      }
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        result: null,
        error: error.message,
        message: 'Required fields are not supplied',
      });
    } else if (error.name === 'BSONTypeError') {
      return res.status(400).json({
        success: false,
        result: null,
        error: error.message,
        message: 'Invalid ID',
      });
    } else {
      return res.status(500).json({
        success: false,
        result: null,
        error: error.message,
        message: error.message,
        controller: 'downloadPDF.js',
      });
    }
  }
};
