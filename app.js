/**
 * @name apply-generic-shipping-pattern
 * @description Returns success message after applying generic shipping patterns
 * @createdOn Apr 1st, 2026
 * @modifiedBy
 * @modifiedOn
 * @modificationSummary
 */

const {
  sendResponse,
  BadRequest,
  HTTP_RESPONSE_CODES,
} = require("utils/api_response_utils");
const {
  applyGenericShippingPatternData,
} = require("./genericShippingPatternService");
const { API_ERROR_MESSAGE } = require("constants/customConstants");

/**
 * @description Lambda handler for Apply Generic Shipping Pattern POST API.
 * @param {Object} event: API event with request body:
  {
    "scenarioId": "uniqueScenarioId",
    "entirePlanDuration": true,
    "userEmail": "user@toyota.com",
    "vanningCenter": "RAV4",
    "data": [
      {
        "vanningDay": 0,
        "loadDay": 4,
        "loadToArrivalDays": 14
      }
    ]
  }
 * @returns {Promise<Object>}: response sample is detailed below.
 * Success response with status code 200:
 * {
    "message": "Successfully updated data."
   }
 * In-valid input error with status 400:
  {
    "errorMessage": [<"ValidationError: validation error message">]
  }
 * Internal server error with status code 500:
  {
    "errorMessage": "Internal Server Error"
  }
 */
exports.handler = async (event) => {
  try {
    /**
     * @description Function to validate input and apply generic shipping pattern.
     * @param {Object} event: Input parameters
     * @returns {Object} result - success response
     */
    const result = await applyGenericShippingPatternData(event);
    console.log("Apply Generic Shipping Pattern Response:", result);
    return sendResponse(HTTP_RESPONSE_CODES.SUCCESS, result);
  } catch (err) {
    console.log("Apply Generic Shipping Pattern Handler Error:", err);
    let errorMessage = API_ERROR_MESSAGE.INTERNAL_SERVER_ERROR;
    let statusCode = HTTP_RESPONSE_CODES.INTERNAL_SERVER_ERROR;
    /**
     * @description If error is BadRequest, return 400 with validation messages
     */
    if (err instanceof BadRequest) {
      statusCode = HTTP_RESPONSE_CODES.BAD_REQUEST;
      errorMessage = err.message
        .split(/,(?=ValidationError:)/)
        .map((e) => e.trim());
      console.log(
        "Validation error messages - Apply Generic Shipping Pattern:",
        errorMessage
      );
    }
    return sendResponse(statusCode, { errorMessage });
  }
};
