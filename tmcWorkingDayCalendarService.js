const { BaseService } = require("./BaseService");

/**
 * @description Mock service for TMC Working Day Calendar API
 */

class tmcWorkingDayCalendarData extends BaseService {
  constructor(db) {
    super(db);
  }

  /**
   * @description Function to fetch TMC Working Day Calendar data by scenarioId, vanningCenter and monthNumber
   */
  async getTmcWorkingDayCalendarData(scenarioId, vanningCenter, monthNumber) {
    try {
      console.log(
        "*********query***********",
        `select * from supply_planning.tmc_working_day_calendar where scenario_id = ${scenarioId}::uuid and vanning_center = ${vanningCenter} and month_number = '${monthNumber}' and is_active = true;`
      );

      // Simulate DB error
      if (process.env.VALIDATION === "dberror") {
        throw new Error("getTmcWorkingDayCalendarData DB error");
      }

      // No data case
      if (process.env.VALIDATION === "nodata") {
        return [];
      }

      // Default sample rows
      return [
        {
          prodDate: "2025-01-01",
          dayOfWeek: "Wednesday",
          isWorkingDay: true,
          workDayPercentage: 100,
          week: "WK202601",
        },
        {
          prodDate: "2025-01-02",
          dayOfWeek: "Thursday",
          isWorkingDay: true,
          workDayPercentage: 50,
          week: "WK202601",
        },
        {
          prodDate: "2025-01-03",
          dayOfWeek: "Friday",
          isWorkingDay: false,
          workDayPercentage: 0,
          week: "WK202601",
        },
      ];
    } catch (err) {
      console.log("Error in getTmcWorkingDayCalendarData:", err);
      throw err;
    }
  }

  /**
   * @description Mock function to update TMC Working Day Calendar data
   */
  async updateTmcWorkingDayCalendarData(
    scenarioId,
    vanningCenter,
    userEmail,
    data,
    tx
  ) {
    try {
      console.log(
        "*********query***********",
        `UPDATE supply_planning.tmc_working_day_calendar SET work_day_percentage, is_working_day WHERE scenario_id = ${scenarioId}::uuid AND vanning_center = ${vanningCenter}, rows=${(data || []).length}`
      );

      if (process.env.VALIDATION === "dberror") {
        throw new Error("updateTmcWorkingDayCalendarData DB error");
      }

      if (process.env.VALIDATION === "upserterror") {
        throw new Error("updateTmcWorkingDayCalendarData error");
      }

      return "success";
    } catch (err) {
      console.log("Error in updateTmcWorkingDayCalendarData:", err);
      throw err;
    }
  }

  /**
   * @description Function to fetch TMC Working Day Calendar data by scenarioId and vanningCenter
   * @param {Object} body - request payload with scenarioId and vanningCenter
   * @returns {Array} TMC Working Day Calendar data for the scenario and vanning center
   */
  async getTmcWorkingDayCalendarByScenarioIdVc(body) {
    try {
      if (body.vanningCenter === "NoTMC") {
        return [];
      }
      // Default sample rows
      return [
        {
          prodDate: "2025-02-01",
          dayOfWeek: "Wednesday",
          isWorkingDay: true,
          workDayPercentage: 100,
          week: "WK202501",
        },
        {
          prodDate: "2025-02-02",
          dayOfWeek: "Thursday",
          isWorkingDay: true,
          workDayPercentage: 50,
          week: "WK202501",
        },
        {
          prodDate: "2025-02-03",
          dayOfWeek: "Friday",
          isWorkingDay: true,
          workDayPercentage: 10,
          week: "WK202501",
        },
        {
          prodDate: "2025-02-04",
          dayOfWeek: "Wednesday",
          isWorkingDay: true,
          workDayPercentage: 100,
          week: "WK202501",
        },
        {
          prodDate: "2025-02-05",
          dayOfWeek: "Thursday",
          isWorkingDay: true,
          workDayPercentage: 50,
          week: "WK202501",
        },
        {
          prodDate: "2025-02-06",
          dayOfWeek: "Friday",
          isWorkingDay: true,
          workDayPercentage: 10,
          week: "WK202501",
        },
        {
          prodDate: "2025-02-07",
          dayOfWeek: "Saturday",
          isWorkingDay: false,
          workDayPercentage: 0,
          week: "WK202501",
        },
      ];
    } catch (err) {
      console.log("Error in getTmcWorkingDayCalendarByScenarioIdVc:", err);
      throw err;
    }
  }

  /**
   * @description Mock: Check if all vanning centers have TMC Working Day Calendar data
   * @param {String} scenarioId - scenario UUID
   * @param {Array} vanningCenters - expected vanning center strings
   * @returns {boolean} true if all VCs have data
   */
  async isTmcWorkingDayCalDataComplete(scenarioId, vanningCenters) {
    try {
      console.log(
        "*********query***********",
        `SELECT COUNT(DISTINCT vanning_center) = ${vanningCenters.length} AS is_complete FROM supply_planning.tmc_working_day_calendar WHERE scenario_id = ${scenarioId}::uuid AND vanning_center = ANY(${vanningCenters}::text[])`
      );
      if (process.env.COMPLETENESS === "nodata") {
        return false;
      }
      if (process.env.COMPLETENESS === "partialvc") {
        return false;
      }
      if (process.env.COMPLETENESS === "dberror") {
        throw new Error("isTmcWorkingDayCalDataComplete DB error");
      }
      return true;
    } catch (error) {
      console.log("Error in isTmcWorkingDayCalDataComplete:", error);
      throw error;
    }
  }

  /**
   * @description Function to fetch TMC Working Day Calendar data by scenarioId, vanningCenter and vanningDates
   * @param {String} scenarioId - scenario id
   * @param {String} vanningCenter - vanning center code
   * @param {Array} vanningDates - array of vanning dates
   * @returns {Array} TMC Working Day Calendar data
   */
  async getTmcWorkingDaysByDates(scenarioId, vanningCenter, vanningDates) {
    try {
      if (process.env.VALIDATION === "tmccalfetcherror") {
        throw new Error("getTmcWorkingDaysByDates DB error");
      }
      if (process.env.VALIDATION === "nonworkingdays") {
        const response = (vanningDates || []).map((date) => ({
          prodDate: date,
          dayOfWeek: "Wednesday",
          isWorkingDay: true,
          workDayPercentage: 100,
          week: "WK202501",
        }));
        response.shift();
        return response;
      }
      if (process.env.VALIDATION === "dateobjectproddate") {
        const response = (vanningDates || []).map((date) => ({
          prodDate: new Date(date),
          dayOfWeek: "Wednesday",
          isWorkingDay: true,
          workDayPercentage: 100,
          week: "WK202501",
        }));
        response.shift();
        return response;
      }

      return (vanningDates || []).map((date) => ({
        prodDate: date,
        dayOfWeek: "Wednesday",
        isWorkingDay: true,
        workDayPercentage: 100,
        week: "WK202501",
      }));
    } catch (err) {
      console.log("Error in getTmcWorkingDaysByDates:", err);
      throw err;
    }
  }
}

module.exports.tmcWorkingDayCalendarData = tmcWorkingDayCalendarData;
