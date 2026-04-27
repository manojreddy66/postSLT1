const { BaseService } = require("./BaseService");
const { Prisma } = require("@prisma/client");

class shippingPatternData extends BaseService {
  constructor(db) {
    super(db);
  }

  /**
   * @description Function to get shipping pattern by scenarioId, vanningCenter and yearMonth
   * @param {String} scenarioId - scenario id
   * @param {String} vanningCenter - vanning center
   * @param {String} yearMonth - year-month in YYYY-MM format
   * @returns {Array} shipping pattern rows
   */
  async getShippingPatternData(scenarioId, vanningCenter, yearMonth) {
    try {
      return await this.prisma.$queryRaw`
        select
          vanning_date as "vanningDate",
          vanning_day as "dayOfWeek",
          tmc_working as "isWorkingDay",
          carrier as "carrier",
          vessel_load_date as "loadDate",
          namc_arrival_date as "arrivalDate"
        from supply_planning.shipping_pattern
        where scenario_id = ${scenarioId}::uuid
          and vanning_center = ${vanningCenter}
          and vanning_date::text like ${`${yearMonth}%`}
          and tmc_working = true
        order by vanning_date;
      `;
    } catch (err) {
      console.log("Error in getShippingPatternData:", err);
      throw err;
    }
  }

  /**
   * @description Function to get existing shipping pattern data by scenarioId.
   * Used for partial timeframe to identify remaining dates.
   * @param {String} scenarioId - scenario UUID
   * @param {Object} tx - Prisma transaction client
   * @returns {Array} existing shipping pattern rows
   */
  async getShippingPatternByScenarioId(scenarioId, tx = this.prisma) {
    try {
      return await tx.$queryRaw`
        SELECT
          sp_id,
          scenario_id,
          namc,
          vanning_center,
          vanning_date,
          vanning_day,
          tmc_working,
          carrier,
          vessel_load_date,
          namc_arrival_date
        FROM supply_planning.shipping_pattern
        WHERE scenario_id = ${scenarioId}::uuid
        ORDER BY vanning_date;
      `;
    } catch (err) {
      console.log("Error in getShippingPatternByScenarioId:", err);
      throw err;
    }
  }

  /**
   * @description Function to upsert shipping pattern rows for a scenario.
   * Uses ON CONFLICT on (scenario_id, vanning_center, vanning_date) to update
   * existing rows or insert new ones.
   * @param {String} scenarioId - scenario UUID
   * @param {String} userEmail - created/updated by email
   * @param {Array} rows - computed shipping pattern rows from generic pattern
   * [{ namc, vanningCenter, vanningDate, vanningDay, carrier, vesselLoadDate, namcArrivalDate }]
   * @param {Object} tx - Prisma transaction client
   * @returns {Number} number of rows affected
   */
  async upsertShippingPattern(scenarioId, userEmail, rows, tx = this.prisma) {
    try {
      return await tx.$executeRaw`
        INSERT INTO supply_planning.shipping_pattern (
          scenario_id,
          namc,
          vanning_center,
          vanning_date,
          vanning_day,
          tmc_working,
          carrier,
          vessel_load_date,
          namc_arrival_date,
          created_by
        )
        SELECT
          ${scenarioId}::uuid AS scenario_id,
          v.namc,
          v.vanning_center,
          v.vanning_date,
          v.vanning_day,
          v.tmc_working,
          v.carrier,
          v.vessel_load_date,
          v.namc_arrival_date,
          ${userEmail}::text AS created_by
        FROM (
          VALUES
          ${Prisma.join(
            rows.map(
              (item) => Prisma.sql`(
                ${item.namc}::text,
                ${item.vanningCenter}::text,
                ${item.vanningDate}::date,
                ${item.vanningDay}::text,
                ${item.isWorkingDay}::boolean,
                ${item.carrier}::text,
                ${item.vesselLoadDate}::date,
                ${item.namcArrivalDate}::date
              )`
            )
          )}
        ) AS v(
          namc,
          vanning_center,
          vanning_date,
          vanning_day,
          tmc_working,
          carrier,
          vessel_load_date,
          namc_arrival_date
        )
        ON CONFLICT (scenario_id, vanning_center, vanning_date)
        DO UPDATE SET
          tmc_working = EXCLUDED.tmc_working,
          vessel_load_date = EXCLUDED.vessel_load_date,
          namc_arrival_date = EXCLUDED.namc_arrival_date,
          updated_by = ${userEmail}::text,
          last_updated_timestamp = NOW()
      `;
    } catch (err) {
      console.log("Error in upsertShippingPattern:", err);
      throw err;
    }
  }

  /**
   * @description Check if all vanning centers have Shipping Pattern data up to last vanning date
   * @param {String} scenarioId - scenario UUID
   * @param {Array} vanningCenters - expected vanning center strings
   * @returns {boolean} true if all VCs have data
   */
  async isShippingPatternDataComplete(scenarioId, vanningCenters) {
    try {
      const result = await this.prisma
        .$queryRaw`SELECT COUNT(DISTINCT vanning_center) = ${vanningCenters.length} AS is_complete
          FROM supply_planning.shipping_pattern
          WHERE scenario_id = ${scenarioId}::uuid
          AND vanning_center = ANY(${vanningCenters}::text[])
          AND vanning_date <= (
            SELECT MAX(tmc_date)
            FROM supply_planning.tmc_working_day_calendar
            WHERE scenario_id = ${scenarioId}::uuid
          );`;
      return result && result.length > 0 && result[0].is_complete === true;
    } catch (error) {
      console.log("Error in isShippingPatternDataComplete:", error);
      throw error;
    }
  }

  /**
   * @description Function to update shipping pattern data for a scenario.
   * @param {Object} input - input data containing scenarioId, vanningCenter, userEmail, and data array
   * @param {Object} tx - Prisma transaction client
   */
  async updateShippingPattern(input, tx) {
    try {
      const { scenarioId, vanningCenter, userEmail } = input;
      return await tx.$executeRaw`
      UPDATE supply_planning.shipping_pattern sp
      SET
        vessel_load_date = src.vessel_load_date,
        namc_arrival_date = src.namc_arrival_date,
        updated_by = ${userEmail}::text,
        last_updated_timestamp = NOW()
      FROM (
        VALUES
          ${Prisma.join(
            input.data.map(
              (item) => Prisma.sql`(
                ${vanningCenter}::text,
                ${item.vanningDate}::date,
                ${item.loadDate}::date,
                ${item.arrivalDate}::date
              )`
            )
          )}
      ) AS src(
        vanning_center,
        vanning_date,
        vessel_load_date,
        namc_arrival_date
      )
      WHERE sp.scenario_id = ${scenarioId}::uuid
        AND sp.vanning_center = ${vanningCenter}::text
        AND sp.vanning_date = src.vanning_date
    `;
    } catch (err) {
      console.log("Error in updateShippingPattern:", err);
      throw err;
    }
  }

  /**
   * @description Function to update tmc_working flag in shipping_pattern for given dates.
   * Used when TMC Working Day Calendar changes affect shipping pattern working day status.
   * @param {String} scenarioId - scenario UUID
   * @param {String} vanningCenter - vanning center code
   * @param {String} userEmail - user email for audit
   * @param {Array} dates - array of date strings (YYYY-MM-DD) to update
   * @param {Boolean} tmcWorking - new tmc_working value (true/false)
   * @param {Object} tx - Prisma transaction client
   * @returns {Number} number of rows affected
   */
  async updateShippingPatternTmcWorking(
    scenarioId,
    vanningCenter,
    userEmail,
    dates,
    tmcWorking,
    tx = this.prisma
  ) {
    try {
      return await tx.$executeRaw`
        UPDATE supply_planning.shipping_pattern
        SET
          tmc_working = ${tmcWorking}::boolean,
          updated_by = ${userEmail}::text,
          last_updated_timestamp = NOW()
        WHERE scenario_id = ${scenarioId}::uuid
          AND vanning_center = ${vanningCenter}::text
          AND vanning_date IN (${Prisma.join(dates.map((d) => Prisma.sql`${d}::date`))})
      `;
    } catch (err) {
      console.log("Error in updateShippingPatternTmcWorking:", err);
      throw err;
    }
  }
}

module.exports.shippingPatternData = shippingPatternData;
