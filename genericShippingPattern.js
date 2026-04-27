/**
 * @description DB operations to insert generic pattern, generate and upsert shipping pattern,
 * and update scenario step status
 */

const { dbConnect } = require("prismaORM/index");
const {
  tmcWorkingDayCalendarData,
} = require("prismaORM/services/tmcWorkingDayCalendarService");
const {
  genericPatternData,
} = require("prismaORM/services/genericPatternService");
const {
  shippingPatternData,
} = require("prismaORM/services/shippingPatternService");
const {
  scenarioStepStatusData,
} = require("prismaORM/services/scenarioStepStatusService");
const { scenariosData } = require("prismaORM/services/scenariosService");
const { VALID_STEP_NAMES } = require("constants/customConstants");
const { updateScenarioNStepStatus } = require("utils/common_utils");
const { BadRequest } = require("utils/api_response_utils");
const { generateShippingPatternData } = require("./utils");

/**
 * @description Function to apply generic shipping pattern and update scenario step status.
 * Inserts generic pattern, generates shipping pattern rows from the generic pattern,
 * upserts shipping pattern, and updates step & scenario status.
 * @param {Object} body - request payload
 * @param {Object} scenarioData - scenario row for the given scenarioId
 * @returns {Promise<Object>} Response object
 */
async function applyGenericShippingPatternNStepStatus(body, scenarioData) {
  const rdb = await dbConnect();
  const tmcWorkingDayCalendarDataService = new tmcWorkingDayCalendarData(rdb);
  const genericPatternDataService = new genericPatternData(rdb);
  const shippingPatternDataService = new shippingPatternData(rdb);
  const scenarioStepStatusDataService = new scenarioStepStatusData(rdb);
  const scenariosDataService = new scenariosData(rdb);
  try {
    await rdb.prisma.$transaction(async (tx) => {
      const calendarData =
        await tmcWorkingDayCalendarDataService.getTmcWorkingDayCalendarByScenarioIdVc(
          body
        );
      if (calendarData?.length === 0) {
        throw new BadRequest(
          `ValidationError: No TMC working day calendar data found for scenarioId ${body.scenarioId} and vanningCenter ${body.vanningCenter}`
        );
      }
      /**
       * @description Upsert generic pattern data for the scenario
       * @param {Object} body - request payload with generic pattern data
       * @param {Object} tx - database transaction object
       */
      await Promise.all([
        genericPatternDataService.upsertGenericPattern(
          body.scenarioId,
          body.vanningCenter,
          body.userEmail,
          body.data,
          tx
        ),
        /**
         * @description Generate shipping pattern rows from the generic pattern and upsert into the database
         * @param {Object} body - request payload with generic pattern data
         * @param {Object} scenarioData - scenario data with start/end month year
         * @param {Object} shippingPatternDataService - instance of shipping pattern data service for DB operations
         * @param {Object} tx - database transaction object
         */
        upsertShippingPatternData(
          body,
          scenarioData,
          calendarData,
          shippingPatternDataService,
          tx
        ),
        /**
         * @description Function to upsert scenario step status to In Progress
         * and update scenario status if not already In Progress
         * @param {Object} body - request payload containing scenarioId and userEmail
         * @param {Object} scenarioData - scenario row for the given scenarioId
         * @param {*} scenarioStepName - Shipping Pattern step name
         * @param {Object} scenarioStepStatusService - scenarioStepStatusData service instance for DB operations on scenario_step_status table
         * @param {Object} scenariosDataService - scenariosData service instance for DB operations on scenarios table
         * @param {Object} tx - transaction object for DB operations
         */
        updateScenarioNStepStatus(
          body,
          scenarioData,
          VALID_STEP_NAMES[3],
          scenarioStepStatusDataService,
          scenariosDataService,
          tx
        ),
      ]);
    });
  } catch (err) {
    console.log("Error in applyGenericShippingPatternNStepStatus:", err);
    throw err;
  }
}

/**
 * @description Function to upsert scenario step status to In Progress
 * and update scenario status if not already In Progress
 * @param {Object} body - request payload containing scenarioId and userEmail
 * @param {Object} scenarioData - scenario row for the given scenarioId
 * @returns {Promise<Object>} Response object
 */
async function upsertShippingPatternData(
  body,
  scenarioData,
  calendarData,
  shippingPatternDataService,
  tx
) {
  /**
   * @description Determine the timeframe for shipping pattern generation.
   * If entirePlanDuration is true, use entire scenario timeframe.
   * If false (partial), fetch existing shipping pattern to identify remaining timeframe.
   */
  let existingShippingData = [];
  if (!body.entirePlanDuration) {
    /**
     * @description Fetch existing shipping pattern data for the scenario to determine the remaining timeframe for pattern generation
     */
    existingShippingData =
      await shippingPatternDataService.getShippingPatternByScenarioId(
        body.scenarioId,
        tx
      );
  }
  /**
   * @description Generate shipping pattern rows from generic pattern
   * based on the determined timeframe
   * @param {Object} body - request payload with generic pattern data
   * @param {Object} scenarioData - scenario data with start/end month year
   * @param {Array} existingShippingData - existing shipping pattern data (empty if entire plan)
   * @param {Array} calendarData - TMC working day calendar data for the scenario
   * @returns {Array} shippingPatternData - computed shipping pattern data ready for upsert
   */
  const shippingPatternData = generateShippingPatternData(
    body,
    scenarioData,
    existingShippingData,
    calendarData
  );
  console.log(
    "Generated shipping pattern data - first record:",
    shippingPatternData[0]
  );
  console.log(
    "Generated shipping pattern data - last record:",
    shippingPatternData.at(-1)
  );
  /**
   * @description Throw error if no rows were generated
   * (e.g. partial mode and existing data already covers the full scenario range)
   */
  if (shippingPatternData.length === 0) {
    throw new BadRequest(
      "ValidationError: Shipping pattern data already exists for the entire scenario duration. No update was performed."
    );
  }
  /**
   * @description Upsert shipping pattern rows into the database
   */
  await shippingPatternDataService.upsertShippingPattern(
    body.scenarioId,
    body.userEmail,
    shippingPatternData,
    tx
  );
}

module.exports = {
  applyGenericShippingPatternNStepStatus,
};
