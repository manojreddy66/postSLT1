const { BaseService } = require("./BaseService");

class scenarioStepStatusData extends BaseService {
  constructor(db) {
    super(db);
  }

  /**
   * @description Function to upsert scenario step status by scenario_id and sub_step_name
   */
  async upsertScenarioStepStatus(
    scenarioId,
    userEmail,
    stepName,
    stepType,
    status,
    tx
  ) {
    try {
      console.log(
        "******query******",
        `insert into supply_planning.scenario_step_status (scenario_id, input_step_type, input_step_name, status, created_by, created_date_timestamp)
                                values (${scenarioId}::uuid, ${stepType}, ${stepName}, ${status}, ${userEmail}, now())
                                on conflict (scenario_id, input_step_name)
                                do update set status = ${status}, updated_by = ${userEmail}, last_updated_timestamp = now()
                                returning scenario_step_status_id::uuid;`
      );
      if ((stepName === "NAMC Allocation Plan" && process.env.VALIDATION_DB_ERROR==="true")|| process.env.VALIDATION === "stepstatuserror") {
        throw new Error("dbError");
      }
      return "success";
    } catch (err) {
      console.log("Error in upsertScenarioStepStatus:", err);
      throw err;
    }
  }

  /**
   * @description Function to update scenario step status by scenario_id and sub_step_name
   */
  async updateScenarioStepStatus(scenarioId, stepName, status, tx) {
    try {
      console.log(
        "******query******",
        `update supply_planning.scenario_step_status 
                                set status = ${status},
                                last_updated_timestamp = now()
                                where scenario_id = ${scenarioId}::uuid
                                and input_step_name = ${stepName};`
      );
      if (stepName === "dbError") {
        throw new Error("dbError");
      }
      return "success";
    } catch (err) {
      console.log("Error in updateScenarioStepStatus:", err);
      throw err;
    }
  }

  /**
   * @description Function to get scenario step status by scenario_id
   */
  async getScenarioStepStatusData(scenarioId) {
    try {
      console.log(
        "******query******",
        `select * from supply_planning.scenario_step_status where scenario_id = ${scenarioId}::uuid;`
      );

      // If you want to simulate "no rows found"
      if (process.env.VALIDATION === "nosteps") {
        return [];
      }

      if (process.env.VALIDATION === "pendingsteps") {
        return [
          {
            input_step_type: "Line Level Inputs",
            input_step_name: "Model Change Dates",
            status: "Completed",
          },
          {
            input_step_type: "Line Level Inputs",
            input_step_name: "NAMC Production Calendar",
            status: "Not Started",
          },
          {
            input_step_type: "Line Level Inputs",
            input_step_name: "NAMC Allocation Plan",
            status: "In Progress",
          },
        ];
      }

      if (process.env.VALIDATION === "stepstatusfetcherror") {
        throw new Error("Error in getScenarioStepStatusData");
      }

      // Default: return some rows
      return [
        {
          input_step_type: "Line Level Inputs",
          input_step_name: "Model Change Dates",
          status: "Completed",
        },
        {
          input_step_type: "Line Level Inputs",
          input_step_name: "NAMC Production Calendar",
          status: "Completed",
        },
        {
          input_step_type: "Line Level Inputs",
          input_step_name: "NAMC Allocation Plan",
          status: "Completed",
        },
        {
          input_step_type: "Vanning Center Inputs",
          input_step_name: "Shipping Pattern",
          status: "Completed",
        },
        {
          input_step_type: "Vanning Center Inputs",
          input_step_name: "Vanning Lead Time",
          status: "Completed",
        },
        {
          input_step_type: "Vanning Center Inputs",
          input_step_name: "TMC Working Day Calendar",
          status: "Completed",
        },
        {
          input_step_type: "Grouping Settings",
          input_step_name: "Grouping",
          status: "Completed",
        },
        {
          input_step_type: "Grouping Settings",
          input_step_name: "Min Max DoH",
          status: "Completed",
        },
        {
          input_step_type: "Grouping Settings",
          input_step_name: "Fluctuation Allowance",
          status: "Completed",
        },
      ];
    } catch (err) {
      console.log("Error in getScenarioStepStatusData:", err);
      throw err;
    }
  }

  /**
   * @description Function to create scenario step status data
   */
  async createScenarioStepStatusData(
    scenarioId,
    userEmail,
    initialStepStatusData
  ) {
    try {
      console.log(
        "******query******",
        `insert into supply_planning.scenario_step_status (...) values (...)`
      );

      // Simulate DB error when needed
      if (process.env.VALIDATION === "stepcreateerror") {
        throw new Error("dbError");
      }

      return "success";
    } catch (err) {
      console.log("Error in createScenarioStepStatusData:", err);
      throw err;
    }
  }
}

module.exports.scenarioStepStatusData = scenarioStepStatusData;
