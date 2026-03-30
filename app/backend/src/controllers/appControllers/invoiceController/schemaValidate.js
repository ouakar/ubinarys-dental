const Joi = require('joi');
const schema = Joi.object({
  client: Joi.alternatives().try(Joi.string(), Joi.object()).required(),
  number: Joi.number().optional(),
  year: Joi.number().optional(),
  status: Joi.string().optional().default('draft'),
  notes: Joi.string().allow('').optional(),
  expiredDate: Joi.alternatives().try(Joi.date(), Joi.string()).required(),
  date: Joi.alternatives().try(Joi.date(), Joi.string()).required(),
  discount: Joi.number().optional().default(0),
  // array cannot be empty
  items: Joi.array()
    .items(
      Joi.object({
        _id: Joi.string().allow('').optional(),
        itemName: Joi.string().required(),
        description: Joi.string().allow('').optional(),
        quantity: Joi.number().required(),
        price: Joi.number().required(),
        total: Joi.number().optional(), // backend recalculates this
      }).required()
    )
    .required(),
  taxRate: Joi.alternatives().try(Joi.number(), Joi.string()).optional().default(0),
});

module.exports = schema;
