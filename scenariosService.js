const { BaseService } = require("./BaseService");
const {
  SCENARIO_TYPES,
  SCENARIO_STATUSES,
} = require("constants/customConstants");
const { formatScenarioCycle } = require("utils/common_utils");

class scenariosData extends BaseService {
  constructor(db) {
    super(db);
  }

  /**
   * @description Function to get scenario data by type, namc, line & cycle
   */
  async getScenarioData(scenarioName) {
    try {
      console.log(
        "************query************",
        `select * from supply_planning.scenarios where where scenario_name like '${scenarioName}%';`
      );
      if (process.env.VALIDATION === "error") {
        throw new Error("getScenarioData DB error");
      }
      if (process.env.VALIDATION === "inactivescenarios") {
        return [
          { scenario_name: "AP/TMMI/Line1_Jan25_V1", is_active: false },
          { scenario_name: "AP/TMMI/Line1_Jan25_V2", is_active: false },
        ];
      }
      if (process.env.VALIDATION === "activescenarios") {
        return [{ scenario_name: "AP/TMMI/Line1_Jan25_V1", is_active: true }];
      }
      return [];
    } catch (err) {
      console.log("Error in getScenarioData:", err);
      throw err;
    }
  }

  /**
   * @description Function to create scenario
   */
  async createScenario(
    input,
    scenarioName,
    cycle,
    startMonthYear,
    endMonthYear,
    tx
  ) {
    try {
      let getsudoMonth = null;
      let apMonth = null;
      if (input.type === SCENARIO_TYPES.GETSUDO) {
        getsudoMonth = formatScenarioCycle(cycle);
      } else {
        apMonth = formatScenarioCycle(cycle);
      }
      console.log(
        "************query************",
        `INSERT INTO supply_planning.scenarios (user_email, user_name, scenario_name,
                    namc,
                    line,
                    plan_type,
                    start_month_year,
                    end_month_year,
                    scenario_cycle,
                    getsudo_month,
                    ap_month,
                    scenario_status,
                    created_by,
                    created_date_timestamp) 
                    VALUES (${input.userEmail},${input.userName},${scenarioName},
                    ${input.namc}, ${input.line},${input.type}, ${startMonthYear},
                    ${endMonthYear}, ${cycle}, ${getsudoMonth}, ${apMonth},
                    ${SCENARIO_STATUSES.NOT_STARTED}, ${input.userEmail}, CURRENT_TIMESTAMP)
                    returning scenario_id;`
      );
      if (process.env.VALIDATION === "dberror") {
        throw new Error("createScenario DB error");
      }
      return "success";
    } catch (err) {
      console.log("Error in createScenario:", err);
      throw err;
    }
  }

  /**
   * @description Function to get scenario data count for table
   */
  async getScenarioTableDataCount(query) {
    try {
      console.log("************query************", query);
      if (process.env.FLAG === "DBERROR") {
        throw new Error("DB ERROR");
      }
      if (process.env.FLAG === "NO DATA") {
        return [{ count: 0 }];
      }
      if (query.includes("Getsudo")) {
        return [{ count: 3 }];
      }
      return [{ count: 3 }];
    } catch (err) {
      console.log("Error in getScenarioTableDataCount:", err);
      throw err;
    }
  }

  /**
   * @description Function to get scenario data for table
   */
  async getScenarioTableData(query, limit, offSet) {
    try {
      console.log("************query************", query);
      if (process.env.FLAG === "NO DATA") {
        return [];
      }
      if (query[0].includes("Getsudo")) {
        return [
          {
            scenario_name: "Getsudo/TMMI/Line1_Cycle_V1",
            scenario_id: "uniqueuuid_1234567890",
            plan_type: "Getsudo",
            namc: "TMMI",
            line: "Line1",
            scenario_cycle: "Jan25",
            user_name: "Priyadarshini Gangone",
            last_updated_timestamp: "2025-8-20",
            scenario_status: "Not Started",
          },
        ];
      }
      return [
        {
          scenario_name: "AP/TMMI/Line1_Cycle_V1",
          scenario_id: "uniqueuuid_1234567891",
          plan_type: "AP",
          namc: "TMMI",
          line: "Line1",
          scenario_cycle: "Jan25",
          user_name: "Priyadarshini Gangone",
          last_updated_timestamp: null,
          scenario_status: "Completed",
        },
        {
          scenario_name: "Getsudo/TMMK/Line1_Cycle_V1",
          scenario_id: "uniqueuuid_1234567892",
          plan_type: "Getsudo",
          namc: "TMMK",
          line: "Line1",
          scenario_cycle: "Jan25",
          user_name: "Priyadarshini Gangone",
          last_updated_timestamp: "2025-8-20",
          scenario_status: "In Progress",
        },
        {
          scenario_name: "AP/TMMC/Line1_Cycle_V1",
          scenario_id: "uniqueuuid_1234567893",
          plan_type: "AP",
          namc: "TMMC",
          line: "Line1",
          scenario_cycle: "Jan25",
          user_name: "Priyadarshini Gangone",
          last_updated_timestamp: "2025-8-20",
          scenario_status: "Not Started",
        },
      ];
    } catch (err) {
      console.log("Error in getScenarioTableData:", err);
      throw err;
    }
  }

  /**
   * @description Function to get scenario data by scenarioId and scenarioName
   */
  async getScenarioDataByIdAndName(scenarioId, scenarioName) {
    try {
      console.log(
        "*********query***********",
        `select * from supply_planning.scenarios where scenario_id = ${scenarioId} 
                   and scenario_name = ${scenarioName} and is_active = true;`
      );
      if (scenarioName === "error") {
        throw new Error("getScenarioDataByIdAndName Error");
      }
      if (scenarioName === "nodata") {
        return [];
      }
      return [
        {
          scenario_name: scenarioName,
          scenario_id: scenarioId,
          plan_type: "Getsudo",
          namc: "TMMI",
          line: "Line1",
          scenario_cycle: "Jan25",
          user_name: "Priyadarshini Gangone",
          last_updated_timestamp: "2025-8-20",
          scenario_status: "Not Started",
        },
      ];
    } catch (err) {
      console.log("Error in getScenarioDataByIdAndName:", err);
      throw err;
    }
  }
  /**
   * @description Function to get scenario data by scenarioId
   */
  async getScenarioDataById(scenarioId) {
    try {
      console.log(
        "*********query***********",
        `select * from supply_planning.scenarios where scenario_id = ${scenarioId} and is_active = true;`
      );
      if (
        process.env.VALIDATION === "error" ||
        process.env.VALIDATION === "scenariofetcherror" ||
        scenarioId === "e2940022-37f7-46ba-9fac-11fdb213914c"
      ) {
        throw new Error("getScenarioDataById Error");
      }
      if (
        process.env.VALIDATION === "scenarionotfound" ||
        scenarioId === "a9240022-37f7-46ba-9fac-11fdb213914c" ||
        scenarioId === "err"
      ) {
        return [];
      }
      if (process.env.VALIDATION === "completed") {
        return [
          {
            scenario_id: scenarioId,
            scenario_name: "Getsudo/TMMI/Line1_Jan25_V1",
            user_email: "gangone.priyadarshini@toyota.com",
            user_name: "Priyadarshini Gangone",
            scenario_status: "Completed",
            is_active: true,
            last_updated_timestamp: "2025-08-20",
          },
        ];
      }
      if (process.env.VALIDATION === "notcreator") {
        return [
          {
            scenario_id: scenarioId,
            scenario_name: "Getsudo/TMMI/Line1_Jan25_V1",
            user_email: "gangone.priyadarshini@toyota.com",
            user_name: "Priyadarshini Gangone",
            scenario_status: "Not Started",
            is_active: true,
            last_updated_timestamp: "2025-08-20",
          },
        ];
      }
      if (process.env.VALIDATION === "inprogress" || process.env.VALIDATION === "alreadyinprogress") {
        return [
          {
            scenario_id: scenarioId,
            scenario_status: "In Progress",
            start_month_year: "202502",
            end_month_year: "202603",
            is_active: true,
            user_email: "gangone.priyadarshini@toyota.com",
          },
        ];
      }
      if (process.env.VALIDATION === "noprepopulateddata") {
        return [
          {
            scenario_id: scenarioId,
            scenario_name: "Getsudo/TMMI/Line1_Jan25_V1",
            user_email: "gangone.priyadarshini@toyota.com",
            plan_type: "Getsudo",
            namc: "TMMI",
            line: "Line1",
            scenario_cycle: "Jan25",
            start_month_year: "202502",
            end_month_year: "202603",
            user_name: "Priyadarshini Gangone",
            scenario_status: "Not Started",
            is_active: true,
            last_updated_timestamp: "2025-08-20",
          },
        ];
      }
      if (process.env.VALIDATION === "inactive") {
        return [
          {
            scenario_id: scenarioId,
            scenario_name: "Getsudo/TMMI/Line1_Jan25_V1",
            user_email: "gangone.priyadarshini@toyota.com",
            user_name: "Priyadarshini Gangone",
            scenario_status: "Not Started",
            is_active: false,
            last_updated_timestamp: "2025-08-20",
          },
        ];
      }
      return [
        {
          scenario_id: scenarioId,
          scenario_name: "Getsudo/TMMI/Line1_Jan25_V1",
          user_email: "gangone.priyadarshini@toyota.com",
          plan_type: "Getsudo",
          namc: "TMMI",
          line: "Line1",
          scenario_cycle: "Jan25",
          start_month_year: "202502",
          end_month_year: "202603",
          user_name: "Priyadarshini Gangone",
          scenario_status: "Not Started",
          is_active: true,
          last_updated_timestamp: "2025-08-20",
        },
      ];
    } catch (err) {
      console.log("Error in getScenarioDataById:", err);
      throw err;
    }
  }

  /**
   * @description function to update scenario status
   */
  async updateScenarioStatus(scenarioId, userEmail, scenarioStatus, tx) {
    try {
      console.log(
        "*********query***********",
        `UPDATE supply_planning.scenarios SET scenario_status=${scenarioStatus} WHERE scenario_id=${scenarioId}`
      );

      if (process.env.VALIDATION === "dberror" || process.env.VALIDATION === "scenariostatuserror") {
        throw new Error("updateScenarioStatus DB error");
      }

      return "success";
    } catch (err) {
      console.log("Error in updateScenarioStatus:", err);
      throw err;
    }
  }

  /**
   * @description Function to delete scenario in supply_planning.scenarios table.
   */
  async deleteScenario(input) {
    try {
      if (process.env.VALIDATION === "dberror") {
        throw new Error("deleteScenario DB error");
      }
      return "success";
    } catch (err) {
      console.log("Error in deleteScenario:", err);
      throw err;
    }
  }
}

module.exports.scenariosData = scenariosData;
