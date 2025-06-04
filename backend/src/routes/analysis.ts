import Joi from 'joi';

const dealSchema = Joi.object({
  propertyTaxRate: Joi.number().required().min(0).max(10)
    .description('Annual property tax rate as a percentage of property value'),
  insuranceRate: Joi.number().required().min(0).max(5)
    .description('Annual insurance rate as a percentage of property value'),
});

export default dealSchema; 