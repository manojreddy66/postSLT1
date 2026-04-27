/**
 * @description this file contains apply generic shipping pattern common utils
 */

const { addDays, formatDate } = require("utils/common_utils");
const { DAYS_OF_WEEK, DEFAULT_CARRIER } = require("constants/customConstants");

/**
 * @description Function to prepare success response for apply generic shipping pattern api
 * @returns {Object} response - success response
 */
function prepareResponse() {
  return {
    message: "Successfully updated data.",
  };
}

/**
 * @description Generate shipping pattern data from the generic pattern
 * based on the determined timeframe (entire plan or partial).
 * For entire plan: uses full scenario start to end date range.
 * For partial: uses dates beyond the last existing shipping pattern vanning date.
 * @param {Object} body - request payload with generic pattern data and vanningCenter
 * @param {Object} scenarioData - scenario data with start_month_year, end_month_year, namc
 * @param {Array} existingShippingData - existing shipping pattern rows (empty if entire plan)
 * @param {Array} calendarData - TMC working day calendar data for the scenario
 * @returns {Array} computed shipping pattern rows ready for upsert
 */
function generateShippingPatternData(
  body,
  scenarioData,
  existingShippingData,
  calendarData
) {
  /**
   * @description Determine the start and end dates for the shipping pattern generation
   */
  const { startDate, endDate } = getTimeframeDates(
    body.entirePlanDuration,
    scenarioData,
    existingShippingData
  );
  console.log("startDate:", startDate);
  console.log("endDate:", endDate);

  /**
   * @description Build a lookup map: weekday index (0-6) -> { loadDay, loadToArrivalDays }
   */
  const genericPatternMap = new Map();
  body.data.forEach((item) => {
    genericPatternMap.set(item.vanningDay, {
      loadDay: item.loadDay,
      loadToArrivalDays: item.loadToArrivalDays,
    });
  });

  /**
   * @description Build a O(1) lookup map: "YYYY-MM-DD" -> isWorkingDay (boolean)
   * from the TMC working day calendar data
   */
  const calendarMap = new Map(
    calendarData.map((row) => [
      formatDate(new Date(row.prodDate), "YYYY-MM-DD"),
      row.isWorkingDay,
    ])
  );

  /**
   * @description Iterate through each day in the timeframe and generate
   * shipping pattern rows for days that match a vanningDay in the generic pattern
   */
  const shippingPatternData = [];
  let timeFrameStart = new Date(startDate);
  const timeFrameEnd = new Date(endDate);

  const dateFormat = "YYYY-MM-DD";
  while (timeFrameStart <= timeFrameEnd) {
    const vanningDate = new Date(timeFrameStart);
    const vanningDayIndex = getWeekdayIndex(vanningDate);
    const pattern = genericPatternMap.get(vanningDayIndex);
    const vanningDateStr = formatDate(vanningDate, dateFormat);
    const dayOfWeek = DAYS_OF_WEEK[vanningDayIndex];
    const isWorkingDay = calendarMap.get(vanningDateStr);
    /**
     * @description Working day: calculate vessel load date and NAMC arrival date normally
     */
    const loadDayOffset = pattern.loadDay - vanningDayIndex;
    const vesselLoadDate = addDays(vanningDate, loadDayOffset);
    const namcArrivalDate = addDays(vesselLoadDate, pattern.loadToArrivalDays);
    shippingPatternData.push({
      namc: scenarioData.namc,
      vanningCenter: body.vanningCenter,
      vanningDate: vanningDateStr,
      vanningDay: dayOfWeek,
      carrier: DEFAULT_CARRIER,
      vesselLoadDate: formatDate(vesselLoadDate, dateFormat),
      namcArrivalDate: formatDate(namcArrivalDate, dateFormat),
      isWorkingDay: isWorkingDay || false,
    });
    timeFrameStart = addDays(timeFrameStart, 1);
  }
  console.log("Generated shipping pattern data:", shippingPatternData.length);
  return shippingPatternData;
}

/**
 * @description Determine the start and end dates for shipping pattern generation
 * based on entirePlanDuration flag and existing shipping data
 * @param {Boolean} entirePlanDuration - true for entire plan, false for partial
 * @param {Object} scenarioData - scenario data with start_month_year and end_month_year
 * @param {Array} existingShippingData - existing shipping pattern rows
 * @returns {Object} { startDate, endDate } as Date objects
 */
function getTimeframeDates(
  entirePlanDuration,
  scenarioData,
  existingShippingData
) {
  /**
   * @description Get scenario end date from end_month_year (YYYYMM format)
   * @returns {Date} last day of end month
   */
  const endDate = getScenarioEndDate(scenarioData);
  /* Check if provided generic pattern is for entire timeframe */
  if (entirePlanDuration) {
    return {
      startDate: getScenarioStartDate(scenarioData),
      endDate,
    };
  }

  /**
   * @description For partial timeframe, find the last vanning date in existing data
   * and start from the day after
   */
  if (existingShippingData && existingShippingData.length > 0) {
    const lastVanningDate = existingShippingData.reduce((latest, row) => {
      const vanningDate = new Date(row.vanning_date);
      return Math.max(vanningDate, latest);
    }, new Date(0));
    /* Add 1 day to last vanning date */
    const dayAfterLast = addDays(lastVanningDate, 1);
    return {
      startDate: dayAfterLast,
      endDate,
    };
  }

  /**
   * @description If no existing data for partial, fall back to entire scenario timeframe
   */
  return {
    startDate: getScenarioStartDate(scenarioData),
    endDate,
  };
}

/**
 * @description Get scenario start date from start_month_year (YYYYMM format)
 * @param {Object} scenarioData - scenario data with start_month_year
 * @returns {Date} first day of start month
 */
function getScenarioStartDate(scenarioData) {
  const yyyymm = String(scenarioData.start_month_year);
  const year = Number.parseInt(yyyymm.substring(0, 4), 10);
  const month = Number.parseInt(yyyymm.substring(4, 6), 10) - 1;
  return new Date(Date.UTC(year, month, 1));
}

/**
 * @description Get scenario end date from end_month_year (YYYYMM format)
 * @param {Object} scenarioData - scenario data with end_month_year
 * @returns {Date} last day of end month
 */
function getScenarioEndDate(scenarioData) {
  const yyyymm = String(scenarioData.end_month_year);
  const year = Number.parseInt(yyyymm.substring(0, 4), 10);
  const month = Number.parseInt(yyyymm.substring(4, 6), 10);
  return new Date(Date.UTC(year, month, 0));
}

/**
 * @description Get the index of the weekday (0 = Monday, 6 = Sunday)
 * @param {Date} date - The date object
 * @returns {number} Index of the weekday
 */
function getWeekdayIndex(date) {
  return date.getDay() === 0 ? 6 : date.getDay() - 1;
}

module.exports = {
  prepareResponse,
  generateShippingPatternData,
};
