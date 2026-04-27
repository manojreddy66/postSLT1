/**
 * @description this file contains request validation methods
 */

const { dbConnect } = require("prismaORM/index");
const { scenariosData } = require("prismaORM/services/scenariosService");
const {
  getValidationSchema,
  customValidation,
} = require("schemaValidator/supplyPlanning/shippingPattern/postGenericShippingPatternSchema");
const { emptyInputCheck } = require("utils/common_utils");

/**
 * @description Function to validate input request body
 * @param {Object} body: API input request body
 * @returns {Promise<Object>} errorMessages - Validation errors if any
 * & scenarioData - scenario data by scenarioId
 */
async function validateInput(body) {
  const errorMessages = [];
  /**
   * @description Function to check if request body is empty
   * @param {Object} body: Input request
   */
  emptyInputCheck(body);
  /**
   * @description Validate request body using Joi schema
   */
  validateParams(body, errorMessages);
  /**
   * @description Custom validation - check completeness of data items
   */
  customValidation(body, errorMessages);
  let scenarioData = null;
  /**
   * @description If Joi validation passed, perform DB validations
   */
  if (errorMessages.length === 0) {
    /**
     * @description Validate scenario exists (DB validation)
     */
    scenarioData = await checkForInvalidScenario(body, errorMessages);
  }
  return { errorMessages: [...new Set(errorMessages)], scenarioData };
}

/**
 * @description Function to validate request params using Joi schema
 * @param {Object} reqBody - request body
 * @param {Array} errorMessages - array to collect validation errors
 */
function validateParams(reqBody, errorMessages) {
  const schema = getValidationSchema();
  const { error } = schema.validate(reqBody, { abortEarly: false });
  if (error?.details?.length) {
    error.details.forEach((e) => errorMessages.push(e.message));
  }
}

/**
 * @description Function to check if a scenario exists
 * @param {Object} reqBody - request body
 * @param {Array} errorMessages - array to collect validation errors
 * @returns {Promise<Object|null>} scenario row if exists else null
 */
async function checkForInvalidScenario(reqBody, errorMessages) {
  const rdb = await dbConnect();
  const scenariosService = new scenariosData(rdb);
  try {
    /**
     * @description Get scenario data by scenarioId
     */
    const scenarioData = await scenariosService.getScenarioDataById(
      reqBody.scenarioId
    );
    /**
     * @description If scenario doesn't exist, add validation error and return null
     */
    if (!scenarioData || scenarioData.length === 0) {
      errorMessages.push("ValidationError: Scenario doesn't exist.");
      return null;
    }
    return scenarioData[0];
  } catch (err) {
    console.log("Error in checkForInvalidScenario:", err);
    throw err;
  }
}

module.exports = {
  validateInput,
};
