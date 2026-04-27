const { BaseService } = require("./BaseService");

class vanningLeadTimeData extends BaseService {
  constructor(db) {
    super(db);
  }

  /**
   * @description Mock: Check if all vanning centers have Vanning Lead Time data
   * @param {String} scenarioId - scenario UUID
   * @param {Array} vanningCenters - expected vanning center strings
   * @returns {boolean} true if all VCs have data
   */
  async isVanningLeadTimeDataComplete(scenarioId, vanningCenters) {
    try {
      console.log(
        "*********query***********",
        `SELECT COUNT(DISTINCT vanning_center) = ${vanningCenters.length} AS is_complete FROM supply_planning.vanning_lead_time WHERE scenario_id = ${scenarioId}::uuid AND vanning_center = ANY(${vanningCenters}::text[]) AND vanning_date <= (SELECT MAX(tmc_date) FROM supply_planning.tmc_working_day_calendar WHERE scenario_id = ${scenarioId}::uuid)`
      );
      if (process.env.COMPLETENESS === "nodata") {
        return false;
      }
      if (process.env.COMPLETENESS === "partialvc") {
        return false;
      }
      if (process.env.COMPLETENESS === "dberror") {
        throw new Error("isVanningLeadTimeDataComplete DB error");
      }
      return true;
    } catch (error) {
      console.log("Error in isVanningLeadTimeDataComplete:", error);
      throw error;
    }
  }

  /**
   * @description Mock: Get vanning lead time data by scenarioId, vanningCenter and yearMonth
   * @param {String} scenarioId - scenario id
   * @param {String} vanningCenter - vanning center
   * @param {String} yearMonth - year-month in YYYY-MM format
   * @returns {Array} vanning lead time rows
   */
  async getVanningLeadTimeData(scenarioId, vanningCenter, yearMonth) {
    try {
      console.log(
        "*********query***********",
        `select order_date as "orderDate", order_day as "orderDay", vanning_date as "vanningDate", vanning_day as "vanningDay", lead_time as "leadTime" from supply_planning.vanning_lead_time where scenario_id = ${scenarioId}::uuid and vanning_center = ${vanningCenter} and vanning_date::text like '${yearMonth}%' order by vanning_date;`
      );
      if (process.env.VALIDATION === "dberror") {
        throw new Error("getVanningLeadTimeData DB error");
      }
      if (process.env.VALIDATION === "nodata") {
        return [];
      }
      if (process.env.VALIDATION === "nulldates") {
        return [
          {
            orderDate: null,
            orderDay: "Monday",
            vanningDate: null,
            vanningDay: "Thursday",
            leadTime: 9,
          },
        ];
      }
      return [
        {
          orderDate: "2025-01-01",
          orderDay: "Monday",
          vanningDate: "2025-01-10",
          vanningDay: "Thursday",
          leadTime: 9,
        },
        {
          orderDate: "2025-01-02",
          orderDay: "Tuesday",
          vanningDate: "2025-01-11",
          vanningDay: "Friday",
          leadTime: 9,
        },
      ];
    } catch (err) {
      console.log("Error in getVanningLeadTimeData:", err);
    }
  }
  
  /**
   * @description Mock function to update VLT for dates changed from working to non-working
   * @param {String} scenarioId - scenario UUID
   * @param {String} vanningCenter - vanning center code
   * @param {String} userEmail - user email for audit
   * @param {Array} dates - array of date strings
   * @param {Boolean} isWorking - boolean indicating if the update is for working or non-working day
   * @param {Object} tx - transaction handle
   * @returns {String} "success" or throws error
   */
  async updateVanningLeadTimeTmcWorking(
    scenarioId,
    vanningCenter,
    userEmail,
    dates,
    isWorking,
    tx = this.prisma
  ) {
    try {
      console.log(
        "*********query***********",
        `UPDATE supply_planning.vanning_lead_time SET tmc_working=${isWorking} for scenario ${scenarioId}, vc=${vanningCenter}, dates=${(dates || []).length}`
      );

      if (process.env.VALIDATION === "vlttmcerror") {
        throw new Error("updateVanningLeadTimeTmcWorking DB error");
      }

      return "success";
    } catch (err) {
      console.log("Error in updateVanningLeadTimeTmcWorking:", err);
      throw err;
    }
  }

  /**
   * @description Mock: Update vanning lead time data by scenarioId and vanningDate
   * @param {Object} input - input object containing scenarioId, userEmail, vanningCenter, and data
   * @param {Object} tx - prisma transaction client
   */
  async updateVanningLeadTimeData(input, tx = this.prisma) {
    try {
      console.log(
        "*********query***********",
        `UPDATE supply_planning.vanning_lead_time vlt SET order_date = src.order_date, order_day = src.order_day, lead_time = src.lead_time, updated_by = ${input.userEmail}::text, last_updated_timestamp = NOW() FROM (VALUES ...) AS src(vanning_date, order_date, order_day, lead_time) WHERE vlt.scenario_id = ${input.scenarioId}::uuid AND vlt.vanning_center = ${input.vanningCenter}::text AND vlt.vanning_date = src.vanning_date`
      );

      if (
        process.env.VALIDATION === "vltupserterror" ||
        process.env.VALIDATION === "dberror"
      ) {
        throw new Error("updateVanningLeadTimeData DB error");
      }

      return "success";
    } catch (err) {
      console.log("Error in updateVanningLeadTimeData:", err);
      throw err;
    }
  }
}

module.exports.vanningLeadTimeData = vanningLeadTimeData;
