/**
 * @description this file contains apply generic shipping pattern service methods
 */

const { BadRequest } = require("utils/api_response_utils");
const { validateInput } = require("./validateRequest");
const {
  applyGenericShippingPatternNStepStatus,
} = require("./genericShippingPattern");
const { prepareResponse } = require("./utils");

/**
 * @description Function to validate request, apply generic shipping pattern and return response
 * @param {Object} event - Lambda event
 * @returns {Promise<Object>} { message: "Successfully updated data." }
 */
async function applyGenericShippingPatternData(event) {
  try {
    const body = event?.body ? JSON.parse(event.body) : {};
    console.log("requestBody:", body);
    /**
     * @description Function to validate input request body
     * @param {Object} body: API input request body
     * @returns {Object} errorMessages - Validation errors if any
     * & scenarioData - scenario data by scenarioId
     */
    const { errorMessages, scenarioData } = await validateInput(body);
    /* Check for validation errors */
    if (errorMessages.length > 0) {
      throw new BadRequest(errorMessages);
    }
    /**
     * @description Apply generic shipping pattern data and update scenario step status
     * @param {Object} body - request body
     * @param {Object} scenarioData - scenario data for the given scenarioId
     */
    await applyGenericShippingPatternNStepStatus(body, scenarioData);
    /**
     * @description Prepare and return success response
     */
    return prepareResponse();
  } catch (err) {
    console.log("Error in applyGenericShippingPatternData:", err);
    throw err;
  }
}

module.exports = {
  applyGenericShippingPatternData,
};
