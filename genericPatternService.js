const { BaseService } = require("./BaseService");
const { Prisma } = require("@prisma/client");

class genericPatternData extends BaseService {
  constructor(db) {
    super(db);
  }

  /**
   * @description Function to get generic pattern by scenarioId and vanningCenter
   * @param {String} scenarioId - scenario id
   * @param {String} vanningCenter - vanning center
   * @returns {Array} generic pattern rows
   */
  async getGenericPatternByScenarioId(scenarioId, vanningCenter) {
    try {
      return await this.prisma.$queryRaw`
        select
        apply_to_all as "entirePlanDuration",
          vanning_day as "vanningDay",
          vessel_load_day as "loadDay",
          vessel_to_namc_days as "loadToArrivalDays"
        from supply_planning.generic_pattern
        where scenario_id = ${scenarioId}::uuid
        and vanning_center = ${vanningCenter}
        order by vanning_day;
      `;
    } catch (err) {
      console.log("Error in getGenericPatternByScenarioId:", err);
      throw err;
    }
  }

  /**
   * @description Function to upsert generic pattern rows for a scenario.
   * Stores the user-provided weekly vanning/load pattern.
   */
  async upsertGenericPattern(
    scenarioId,
    vanningCenter,
    userEmail,
    data,
    tx = this.prisma
  ) {
    try {
      return await tx.$executeRaw`
        INSERT INTO supply_planning.generic_pattern (
          scenario_id,
          vanning_day,
          vessel_load_day,
          vessel_to_namc_days,
          apply_to_all,
          vanning_center,
          created_by,
          created_date_timestamp
        )
        SELECT
          ${scenarioId}::uuid AS scenario_id,
          v.vanning_day,
          v.vessel_load_day,
          v.vessel_to_namc_days,
          v.apply_to_all,
          ${vanningCenter}::text AS vanning_center,
          ${userEmail}::text AS created_by,
          NOW() AS created_date_timestamp
        FROM (
          VALUES
          ${Prisma.join(
            data.map(
              (item) => Prisma.sql`(
                ${item.vanningDay}::integer,
                ${item.loadDay}::integer,
                ${item.loadToArrivalDays}::integer,
                TRUE::boolean
              )`
            )
          )}
        ) AS v(vanning_day, vessel_load_day, vessel_to_namc_days, apply_to_all)
        ON CONFLICT (scenario_id, vanning_center, vanning_day)
        DO UPDATE SET
          vessel_load_day = EXCLUDED.vessel_load_day,
          vessel_to_namc_days = EXCLUDED.vessel_to_namc_days,
          apply_to_all = EXCLUDED.apply_to_all,
          updated_by = ${userEmail}::text,
          last_updated_timestamp = NOW()
      `;
    } catch (err) {
      console.log("Error in upsertGenericPattern:", err);
      throw err;
    }
  }
}

module.exports.genericPatternData = genericPatternData;
