const { BaseService } = require("./BaseService");

class standardLeadTimeData extends BaseService {
  constructor(db) {
    super(db);
  } /**
   * @description Mock: Get standard lead time data by scenarioId and vanningCenter
   * @param {String} scenarioId - scenario id
   * @param {String} vanningCenter - vanning center
   * @returns {Array} standard lead time rows
   */

  async getStandardLeadTimeData(scenarioId, vanningCenter) {
    try {
      console.log(
        "*********query***********",
        `select apply_to_all as "entirePlanDuration", lead_time as "leadTime" from supply_planning.standard_lead_time where scenario_id = ${scenarioId}::uuid and vanning_center = ${vanningCenter};`
      );
      if (process.env.VALIDATION === "standarddberror") {
        throw new Error("getStandardLeadTimeData DB error");
      }
      if (process.env.VALIDATION === "nodata") {
        return [];
      }

      return [
        {
          entirePlanDuration: true,
          leadTime: 7,
        },
      ];
    } catch (err) {
      console.log("Error in getStandardLeadTimeData:", err);
      throw err;
    }
  }
}

module.exports.standardLeadTimeData = standardLeadTimeData;
