const update = async (Model, req, res) => {
  // Find document by id and updates with the required fields
  req.body.removed = false;
  
  // Safe finalization: If a manual full-form save sends clinicalNotes but omits the explicit draft payload, erase all drafts
  if (req.body.clinicalNotes !== undefined && req.body.draftClinicalNotes === undefined) {
    req.body.draftClinicalNotes = {};
  }
  // Remove protected fields from mass assignment
  delete req.body.createdBy;
  delete req.body.created;
  delete req.body.removed;
  delete req.body._id;

  const result = await Model.findOneAndUpdate(
    {
      _id: req.params.id,
      removed: false,
    },
    req.body,
    {
      new: true, // return the new result instead of the old one
      runValidators: true,
    }
  ).exec();
  if (!result) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'No document found ',
    });
  } else {
    return res.status(200).json({
      success: true,
      result,
      message: 'we update this document ',
    });
  }
};

module.exports = update;
