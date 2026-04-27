const lambda = require("../../../../../../../src/sp/shippingPattern/genericShippingPattern/postGenericShippingPattern/v1/1/app");
const assert = require("assert");

/** Valid 7-item data array covering all vanningDays 0-6 */
const VALID_DATA = [
  { vanningDay: 0, loadDay: 4, loadToArrivalDays: 21 },
  { vanningDay: 1, loadDay: 5, loadToArrivalDays: 22 },
  { vanningDay: 2, loadDay: 6, loadToArrivalDays: 23 },
  { vanningDay: 3, loadDay: 7, loadToArrivalDays: 24 },
  { vanningDay: 4, loadDay: 8, loadToArrivalDays: 25 },
  { vanningDay: 5, loadDay: 9, loadToArrivalDays: 26 },
  { vanningDay: 6, loadDay: 10, loadToArrivalDays: 27 },
];

describe("SP Apply Generic Shipping Pattern API Lambda Test Suite", () => {
  beforeEach(() => {
    jest.mock("utils/api_response_utils");
    jest.mock("utils/common_utils");
    jest.mock("constants/customConstants");
    jest.mock("prismaORM/index");
    jest.mock("prismaORM/services/scenariosService");
    jest.mock("prismaORM/services/genericPatternService");
    jest.mock("prismaORM/services/shippingPatternService");
    jest.mock("prismaORM/services/scenarioStepStatusService");
    jest.mock(
      "schemaValidator/supplyPlanning/shippingPattern/postGenericShippingPatternSchema"
    );
  });
  afterEach(() => {
    delete process.env.VALIDATION;
  });

  it("Unit Test Case 1: The API should return success message with status code 200 message with a 200 status code.", async () => {
    console.log(
      "*****************Unit Test Case 1: The API should return success message with status code 200 message with a 200 status code.*****************"
    );
    const event = {
      body: JSON.stringify({
        scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
        entirePlanDuration: true,
        userEmail: "test.user@toyota.com",
        vanningCenter: "KVC",
        data: VALID_DATA,
      }),
    };
    const expected = {
      message: "Successfully updated data.",
    };
    const result = await lambda.handler(event);
    assert.equal(result.statusCode, 200);
    assert.deepEqual(JSON.parse(result.body), expected);
  });

  it("Unit Test Case 2: The API should return success message with status code 200 for partial timeframe (entirePlanDuration = false).", async () => {
    console.log(
      "*****************Unit Test Case 2: The API should return success message with status code 200 for partial timeframe (entirePlanDuration = false).*****************"
    );
    const event = {
      body: JSON.stringify({
        scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
        entirePlanDuration: false,
        userEmail: "test.user@toyota.com",
        vanningCenter: "KVC",
        data: VALID_DATA,
      }),
    };
    const result = await lambda.handler(event);
    assert.equal(result.statusCode, 200);
    assert.deepEqual(JSON.parse(result.body), {
      message: "Successfully updated data.",
    });
  });

  it("Unit Test Case 3: The API should return success message with status code 200 for partial timeframe with no existing shipping data.", async () => {
    console.log(
      "*****************Unit Test Case 3: The API should return success message with status code 200 for partial timeframe with no existing shipping data.*****************"
    );
    process.env.VALIDATION = "noexistingshippingdata";
    const event = {
      body: JSON.stringify({
        scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
        entirePlanDuration: false,
        userEmail: "test.user@toyota.com",
        vanningCenter: "KVC",
        data: VALID_DATA,
      }),
    };
    const result = await lambda.handler(event);
    assert.equal(result.statusCode, 200);
    assert.deepEqual(JSON.parse(result.body), {
      message: "Successfully updated data.",
    });
  });

  it("Unit Test Case 4: The API should return success message with status code 200 when scenario is already In Progress.", async () => {
    console.log(
      "*****************Unit Test Case 4: The API should return success message with status code 200 when scenario is already In Progress.*****************"
    );
    process.env.VALIDATION = "inprogress";
    const event = {
      body: JSON.stringify({
        scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
        entirePlanDuration: true,
        userEmail: "test.user@toyota.com",
        vanningCenter: "KVC",
        data: VALID_DATA,
      }),
    };
    const result = await lambda.handler(event);
    assert.equal(result.statusCode, 200);
    assert.deepEqual(JSON.parse(result.body), {
      message: "Successfully updated data.",
    });
  });

  it("Unit Test Case 5: The API should return validation error with a 400 status code when accessed with an empty event.", async () => {
    console.log(
      "*****************Unit Test Case 5: The API should return validation error with a 400 status code when accessed with an empty event.*****************"
    );
    const event = {};
    const result = await lambda.handler(event);
    assert.equal(result.statusCode, 400);
    assert.deepEqual(JSON.parse(result.body), {
      errorMessage: ["ValidationError: Request body cannot be empty."],
    });
  });

  it("Unit Test Case 6: The API should return validation error with a 400 status code for empty request body object.", async () => {
    console.log(
      "*****************Unit Test Case 6: The API should return validation error with a 400 status code for empty request body object.*****************"
    );
    const event = {
      body: JSON.stringify({}),
    };
    const result = await lambda.handler(event);
    assert.equal(result.statusCode, 400);
    assert.deepEqual(JSON.parse(result.body), {
      errorMessage: ["ValidationError: Request body cannot be empty."],
    });
  });

  it("Unit Test Case 7: The API should return internal server error with status code 500 for malformed JSON.", async () => {
    console.log(
      "*****************Unit Test Case 7: The API should return internal server error with status code 500 for malformed JSON.*****************"
    );
    const event = {
      body: '{"scenarioId":',
    };
    const result = await lambda.handler(event);
    assert.equal(result.statusCode, 500);
    assert.equal(JSON.parse(result.body).errorMessage, "Internal Server Error");
  });

  it("Unit Test Case 8: The API should return validation error with status code 400 when scenarioId is missing.", async () => {
    console.log(
      "*****************Unit Test Case 8: The API should return validation error with status code 400 when scenarioId is missing.*****************"
    );
    const event = {
      body: JSON.stringify({
        entirePlanDuration: true,
        userEmail: "test.user@toyota.com",
        vanningCenter: "KVC",
        data: VALID_DATA,
      }),
    };
    const result = await lambda.handler(event);
    assert.equal(result.statusCode, 400);
    assert.deepEqual(JSON.parse(result.body), {
      errorMessage: [
        "ValidationError: scenarioId is required and must be a uuid.",
      ],
    });
  });

  it("Unit Test Case 9: The API should return validation error with status code 400 when invalid scenarioId is sent.", async () => {
    console.log(
      "*****************Unit Test Case 9: The API should return validation error with status code 400 when invalid scenarioId is sent.*****************"
    );
    const event = {
      body: JSON.stringify({
        scenarioId: "invalid_uuid",
        entirePlanDuration: true,
        userEmail: "test.user@toyota.com",
        vanningCenter: "KVC",
        data: VALID_DATA,
      }),
    };
    const result = await lambda.handler(event);
    assert.equal(result.statusCode, 400);
    assert.deepEqual(JSON.parse(result.body), {
      errorMessage: [
        "ValidationError: scenarioId is required and must be a uuid.",
      ],
    });
  });

  it("Unit Test Case 10: The API should return validation error with status code 400 when entirePlanDuration is missing.", async () => {
    console.log(
      "*****************Unit Test Case 10: The API should return validation error with status code 400 when entirePlanDuration is missing.*****************"
    );
    const event = {
      body: JSON.stringify({
        scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
        userEmail: "test.user@toyota.com",
        vanningCenter: "KVC",
        data: VALID_DATA,
      }),
    };
    const result = await lambda.handler(event);
    assert.equal(result.statusCode, 400);
    assert.deepEqual(JSON.parse(result.body), {
      errorMessage: [
        "ValidationError: entirePlanDuration must be either true or false.",
      ],
    });
  });

  it("Unit Test Case 11: The API should return validation error with status code 400 when entirePlanDuration is not a boolean.", async () => {
    console.log(
      "*****************Unit Test Case 11: The API should return validation error with status code 400 when entirePlanDuration is not a boolean.*****************"
    );
    const event = {
      body: JSON.stringify({
        scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
        entirePlanDuration: "yes",
        userEmail: "test.user@toyota.com",
        vanningCenter: "KVC",
        data: VALID_DATA,
      }),
    };
    const result = await lambda.handler(event);
    assert.equal(result.statusCode, 400);
    assert.deepEqual(JSON.parse(result.body), {
      errorMessage: [
        "ValidationError: entirePlanDuration must be either true or false.",
      ],
    });
  });

  it("Unit Test Case 12: The API should return validation error with status code 400 when userEmail is missing.", async () => {
    console.log(
      "*****************Unit Test Case 12: The API should return validation error with status code 400 when userEmail is missing.*****************"
    );
    const event = {
      body: JSON.stringify({
        scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
        entirePlanDuration: true,
        vanningCenter: "KVC",
        data: VALID_DATA,
      }),
    };
    const result = await lambda.handler(event);
    assert.equal(result.statusCode, 400);
    assert.deepEqual(JSON.parse(result.body), {
      errorMessage: [
        "ValidationError: userEmail is required and must be a string.",
      ],
    });
  });

  it("Unit Test Case 13: The API should return validation error with status code 400 when invalid userEmail is sent.", async () => {
    console.log(
      "*****************Unit Test Case 13: The API should return validation error with status code 400 when invalid userEmail is sent.*****************"
    );
    const event = {
      body: JSON.stringify({
        scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
        entirePlanDuration: true,
        userEmail: "not-an-email",
        vanningCenter: "KVC",
        data: VALID_DATA,
      }),
    };
    const result = await lambda.handler(event);
    assert.equal(result.statusCode, 400);
    assert.deepEqual(JSON.parse(result.body), {
      errorMessage: ["ValidationError: Invalid userEmail."],
    });
  });

  it("Unit Test Case 14: The API should return validation error with status code 400 when vanningCenter is missing.", async () => {
    console.log(
      "*****************Unit Test Case 14: The API should return validation error with status code 400 when vanningCenter is missing.*****************"
    );
    const event = {
      body: JSON.stringify({
        scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
        entirePlanDuration: true,
        userEmail: "test.user@toyota.com",
        data: VALID_DATA,
      }),
    };
    const result = await lambda.handler(event);
    assert.equal(result.statusCode, 400);
    assert.deepEqual(JSON.parse(result.body), {
      errorMessage: [
        "ValidationError: vanningCenter is required and must be a string.",
      ],
    });
  });

  it("Unit Test Case 15: The API should return validation error with status code 400 when data is missing.", async () => {
    console.log(
      "*****************Unit Test Case 15: The API should return validation error with status code 400 when data is missing.*****************"
    );
    const event = {
      body: JSON.stringify({
        scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
        entirePlanDuration: true,
        userEmail: "test.user@toyota.com",
        vanningCenter: "KVC",
      }),
    };
    const result = await lambda.handler(event);
    assert.equal(result.statusCode, 400);
    assert.deepEqual(JSON.parse(result.body), {
      errorMessage: [
        "ValidationError: data is required and must be an array with atleast 1 item.",
      ],
    });
  });

  it("Unit Test Case 16: The API should return validation error with status code 400 when data is an empty array.", async () => {
    console.log(
      "*****************Unit Test Case 16: The API should return validation error with status code 400 when data is an empty array.*****************"
    );
    const event = {
      body: JSON.stringify({
        scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
        entirePlanDuration: true,
        userEmail: "test.user@toyota.com",
        vanningCenter: "KVC",
        data: [],
      }),
    };
    const result = await lambda.handler(event);
    assert.equal(result.statusCode, 400);
    assert.deepEqual(JSON.parse(result.body), {
      errorMessage: [
        "ValidationError: data is required and must be an array with atleast 1 item.",
      ],
    });
  });

  it("Unit Test Case 17: The API should return validation error with status code 400 when vanningDay is missing in a data item.", async () => {
    console.log(
      "*****************Unit Test Case 17: The API should return validation error with status code 400 when vanningDay is missing in a data item.*****************"
    );
    const data = VALID_DATA.map((item) => ({ ...item }));
    delete data[0].vanningDay;
    const event = {
      body: JSON.stringify({
        scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
        entirePlanDuration: true,
        userEmail: "test.user@toyota.com",
        vanningCenter: "KVC",
        data,
      }),
    };
    const result = await lambda.handler(event);
    assert.equal(result.statusCode, 400);
    assert.deepEqual(JSON.parse(result.body), {
      errorMessage: [
        "ValidationError: vanningDay is required and must be a number between 0 to 6.",
        "ValidationError: vanningDay must include all days 0-6. Vanning Day 0 is missing.",
      ],
    });
  });

  it("Unit Test Case 18: The API should return validation error with status code 400 when vanningDay is out of range.", async () => {
    console.log(
      "*****************Unit Test Case 18: The API should return validation error with status code 400 when vanningDay is out of range.*****************"
    );
    const data = VALID_DATA.map((item) => ({ ...item }));
    data[0] = { vanningDay: 14, loadDay: 4, loadToArrivalDays: 21 };
    const event = {
      body: JSON.stringify({
        scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
        entirePlanDuration: true,
        userEmail: "test.user@toyota.com",
        vanningCenter: "KVC",
        data,
      }),
    };
    const result = await lambda.handler(event);
    assert.equal(result.statusCode, 400);
    assert.deepEqual(JSON.parse(result.body), {
      errorMessage: [
        "ValidationError: vanningDay is required and must be a number between 0 to 6.",
        "ValidationError: vanningDay must include all days 0-6. Vanning Day 0 is missing.",
      ],
    });
  });

  it("Unit Test Case 19: The API should return validation error with status code 400 when loadDay is missing in a data item.", async () => {
    console.log(
      "*****************Unit Test Case 19: The API should return validation error with status code 400 when loadDay is missing in a data item.*****************"
    );
    const data = VALID_DATA.map((item) => ({ ...item }));
    delete data[0].loadDay;
    const event = {
      body: JSON.stringify({
        scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
        entirePlanDuration: true,
        userEmail: "test.user@toyota.com",
        vanningCenter: "KVC",
        data,
      }),
    };
    const result = await lambda.handler(event);
    assert.equal(result.statusCode, 400);
    assert.deepEqual(JSON.parse(result.body), {
      errorMessage: [
        "ValidationError: loadDay is required and must be a number between 0 to 13.",
      ],
    });
  });

  it("Unit Test Case 20: The API should return validation error with status code 400 when loadDay is out of range.", async () => {
    console.log(
      "*****************Unit Test Case 20: The API should return validation error with status code 400 when loadDay is out of range.*****************"
    );
    const data = VALID_DATA.map((item) => ({ ...item }));
    data[0] = { vanningDay: 0, loadDay: 14, loadToArrivalDays: 21 };
    const event = {
      body: JSON.stringify({
        scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
        entirePlanDuration: true,
        userEmail: "test.user@toyota.com",
        vanningCenter: "KVC",
        data,
      }),
    };
    const result = await lambda.handler(event);
    assert.equal(result.statusCode, 400);
    assert.deepEqual(JSON.parse(result.body), {
      errorMessage: [
        "ValidationError: loadDay is required and must be a number between 0 to 13.",
      ],
    });
  });

  it("Unit Test Case 21: The API should return validation error with status code 400 when loadToArrivalDays is missing in a data item.", async () => {
    console.log(
      "*****************Unit Test Case 21: The API should return validation error with status code 400 when loadToArrivalDays is missing in a data item.*****************"
    );
    const data = VALID_DATA.map((item) => ({ ...item }));
    delete data[0].loadToArrivalDays;
    const event = {
      body: JSON.stringify({
        scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
        entirePlanDuration: true,
        userEmail: "test.user@toyota.com",
        vanningCenter: "KVC",
        data,
      }),
    };
    const result = await lambda.handler(event);
    assert.equal(result.statusCode, 400);
    assert.deepEqual(JSON.parse(result.body), {
      errorMessage: [
        "ValidationError: loadToArrivalDays is required and must be a non-negative number not more than 99.",
      ],
    });
  });

  it("Unit Test Case 22: The API should return validation error with status code 400 when loadToArrivalDays exceeds 99.", async () => {
    console.log(
      "*****************Unit Test Case 22: The API should return validation error with status code 400 when loadToArrivalDays exceeds 99.*****************"
    );
    const data = VALID_DATA.map((item) => ({ ...item }));
    data[0] = { vanningDay: 0, loadDay: 4, loadToArrivalDays: 100 };
    const event = {
      body: JSON.stringify({
        scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
        entirePlanDuration: true,
        userEmail: "test.user@toyota.com",
        vanningCenter: "KVC",
        data,
      }),
    };
    const result = await lambda.handler(event);
    assert.equal(result.statusCode, 400);
    assert.deepEqual(JSON.parse(result.body), {
      errorMessage: [
        "ValidationError: loadToArrivalDays is required and must be a non-negative number not more than 99.",
      ],
    });
  });

  it("Unit Test Case 23: The API should return validation error with status code 400 when loadToArrivalDays is negative.", async () => {
    console.log(
      "*****************Unit Test Case 23: The API should return validation error with status code 400 when loadToArrivalDays is negative.*****************"
    );
    const data = VALID_DATA.map((item) => ({ ...item }));
    data[0] = { vanningDay: 0, loadDay: 4, loadToArrivalDays: -1 };
    const event = {
      body: JSON.stringify({
        scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
        entirePlanDuration: true,
        userEmail: "test.user@toyota.com",
        vanningCenter: "KVC",
        data,
      }),
    };
    const result = await lambda.handler(event);
    assert.equal(result.statusCode, 400);
    assert.deepEqual(JSON.parse(result.body), {
      errorMessage: [
        "ValidationError: loadToArrivalDays is required and must be a non-negative number not more than 99.",
      ],
    });
  });

  it("Unit Test Case 24: The API should return validation error with status code 400 when scenario doesn't exist.", async () => {
    console.log(
      "*****************Unit Test Case 24: The API should return validation error with status code 400 when scenario doesn't exist.*****************"
    );
    process.env.VALIDATION = "scenarionotfound";
    const event = {
      body: JSON.stringify({
        scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
        entirePlanDuration: true,
        userEmail: "test.user@toyota.com",
        vanningCenter: "KVC",
        data: VALID_DATA,
      }),
    };
    const result = await lambda.handler(event);
    assert.equal(result.statusCode, 400);
    assert.deepEqual(JSON.parse(result.body), {
      errorMessage: ["ValidationError: Scenario doesn't exist."],
    });
  });

  it("Unit Test Case 25: The API should return internal server error with status code 500 when scenario fetch fails.", async () => {
    console.log(
      "*****************Unit Test Case 25: The API should return internal server error with status code 500 when scenario fetch fails.*****************"
    );
    process.env.VALIDATION = "scenariofetcherror";
    const event = {
      body: JSON.stringify({
        scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
        entirePlanDuration: true,
        userEmail: "test.user@toyota.com",
        vanningCenter: "KVC",
        data: VALID_DATA,
      }),
    };
    const result = await lambda.handler(event);
    assert.equal(result.statusCode, 500);
    assert.equal(JSON.parse(result.body).errorMessage, "Internal Server Error");
  });

  it("Unit Test Case 26: The API should return internal server error with status code 500 when generic pattern insertion fails.", async () => {
    console.log(
      "*****************Unit Test Case 26: The API should return internal server error with status code 500 when generic pattern insertion fails.*****************"
    );
    process.env.VALIDATION = "genericpatterninsertionerror";
    const event = {
      body: JSON.stringify({
        scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
        entirePlanDuration: true,
        userEmail: "test.user@toyota.com",
        vanningCenter: "KVC",
        data: VALID_DATA,
      }),
    };
    const result = await lambda.handler(event);
    assert.equal(result.statusCode, 500);
    assert.equal(JSON.parse(result.body).errorMessage, "Internal Server Error");
  });

  it("Unit Test Case 27: The API should return internal server error with status code 500 when shipping pattern fetch fails (partial timeframe).", async () => {
    console.log(
      "*****************Unit Test Case 27: The API should return internal server error with status code 500 when shipping pattern fetch fails.*****************"
    );
    process.env.VALIDATION = "shippingpatternfetcherror";
    const event = {
      body: JSON.stringify({
        scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
        entirePlanDuration: false,
        userEmail: "test.user@toyota.com",
        vanningCenter: "KVC",
        data: VALID_DATA,
      }),
    };
    const result = await lambda.handler(event);
    assert.equal(result.statusCode, 500);
    assert.equal(JSON.parse(result.body).errorMessage, "Internal Server Error");
  });

  it("Unit Test Case 28: The API should return internal server error with status code 500 when shipping pattern upsert fails.", async () => {
    console.log(
      "*****************Unit Test Case 28: The API should return internal server error with status code 500 when shipping pattern upsert fails.*****************"
    );
    process.env.VALIDATION = "shippingpatternupserterror";
    const event = {
      body: JSON.stringify({
        scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
        entirePlanDuration: true,
        userEmail: "test.user@toyota.com",
        vanningCenter: "KVC",
        data: VALID_DATA,
      }),
    };
    const result = await lambda.handler(event);
    assert.equal(result.statusCode, 500);
    assert.equal(JSON.parse(result.body).errorMessage, "Internal Server Error");
  });

  it("Unit Test Case 29: The API should return internal server error with status code 500 when step status update fails.", async () => {
    console.log(
      "*****************Unit Test Case 29: The API should return internal server error with status code 500 when step status update fails.*****************"
    );
    process.env.VALIDATION = "stepstatuserror";
    const event = {
      body: JSON.stringify({
        scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
        entirePlanDuration: true,
        userEmail: "test.user@toyota.com",
        vanningCenter: "KVC",
        data: VALID_DATA,
      }),
    };
    const result = await lambda.handler(event);
    assert.equal(result.statusCode, 500);
    assert.equal(JSON.parse(result.body).errorMessage, "Internal Server Error");
  });

  it("Unit Test Case 30: The API should return internal server error with status code 500 when scenario status update fails.", async () => {
    console.log(
      "*****************Unit Test Case 30: The API should return internal server error with status code 500 when scenario status update fails.*****************"
    );
    process.env.VALIDATION = "scenariostatuserror";
    const event = {
      body: JSON.stringify({
        scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
        entirePlanDuration: true,
        userEmail: "test.user@toyota.com",
        vanningCenter: "KVC",
        data: VALID_DATA,
      }),
    };
    const result = await lambda.handler(event);
    assert.equal(result.statusCode, 500);
    assert.equal(JSON.parse(result.body).errorMessage, "Internal Server Error");
  });

  it("Unit Test Case 31: The API should return success message with status code 200 for partial timeframe with out-of-order existing shipping data.", async () => {
    console.log(
      "*****************Unit Test Case 31: The API should return success message with status code 200 for partial timeframe with out-of-order existing shipping data.*****************"
    );
    process.env.VALIDATION = "shippingpatterndescorder";
    const event = {
      body: JSON.stringify({
        scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
        entirePlanDuration: false,
        userEmail: "test.user@toyota.com",
        vanningCenter: "KVC",
        data: VALID_DATA,
      }),
    };
    const result = await lambda.handler(event);
    assert.equal(result.statusCode, 200);
    assert.deepEqual(JSON.parse(result.body), {
      message: "Successfully updated data.",
    });
  });

  it("Unit Test Case 32: The API should return validation error with status code 400 when data has fewer than 7 items.", async () => {
    console.log(
      "*****************Unit Test Case 32: The API should return validation error with status code 400 when data has fewer than 7 items.*****************"
    );
    const event = {
      body: JSON.stringify({
        scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
        entirePlanDuration: true,
        userEmail: "test.user@toyota.com",
        vanningCenter: "KVC",
        data: [
          { vanningDay: 0, loadDay: 4, loadToArrivalDays: 21 },
          { vanningDay: 1, loadDay: 5, loadToArrivalDays: 22 },
          { vanningDay: 2, loadDay: 6, loadToArrivalDays: 23 },
        ],
      }),
    };
    const result = await lambda.handler(event);
    assert.equal(result.statusCode, 400);
    assert.deepEqual(JSON.parse(result.body), {
      errorMessage: ["ValidationError: Incomplete data provided."],
    });
  });

  it("Unit Test Case 33: The API should return validation error with status code 400 when data has more than 7 items.", async () => {
    console.log(
      "*****************Unit Test Case 33: The API should return validation error with status code 400 when data has more than 7 items.*****************"
    );
    const event = {
      body: JSON.stringify({
        scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
        entirePlanDuration: true,
        userEmail: "test.user@toyota.com",
        vanningCenter: "KVC",
        data: [
          ...VALID_DATA,
          { vanningDay: 0, loadDay: 4, loadToArrivalDays: 21 },
        ],
      }),
    };
    const result = await lambda.handler(event);
    assert.equal(result.statusCode, 400);
    assert.deepEqual(JSON.parse(result.body), {
      errorMessage: ["ValidationError: Incomplete data provided."],
    });
  });

  it("Unit Test Case 34: The API should return validation error with status code 400 when vanningDay values are not all unique 0-6.", async () => {
    console.log(
      "*****************Unit Test Case 34: The API should return validation error with status code 400 when vanningDay values are not all unique 0-6.*****************"
    );
    const event = {
      body: JSON.stringify({
        scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
        entirePlanDuration: true,
        userEmail: "test.user@toyota.com",
        vanningCenter: "KVC",
        data: [
          { vanningDay: 0, loadDay: 4, loadToArrivalDays: 21 },
          { vanningDay: 1, loadDay: 5, loadToArrivalDays: 22 },
          { vanningDay: 2, loadDay: 6, loadToArrivalDays: 23 },
          { vanningDay: 3, loadDay: 7, loadToArrivalDays: 24 },
          { vanningDay: 4, loadDay: 8, loadToArrivalDays: 25 },
          { vanningDay: 5, loadDay: 9, loadToArrivalDays: 26 },
          { vanningDay: 0, loadDay: 10, loadToArrivalDays: 27 },
        ],
      }),
    };
    const result = await lambda.handler(event);
    assert.equal(result.statusCode, 400);
    assert.deepEqual(JSON.parse(result.body), {
      errorMessage: [
        "ValidationError: vanningDay must include all days 0-6. Vanning Day 6 is missing.",
      ],
    });
  });

  it("Unit Test Case 35: The API should return validation error - No TMC working day calendar data found.", async () => {
    console.log(
      "*****************Unit Test Case 35: The API should return validation error - No TMC working day calendar data found.*****************"
    );
    const event = {
      body: JSON.stringify({
        scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
        entirePlanDuration: true,
        userEmail: "test.user@toyota.com",
        vanningCenter: "NoTMC",
        data: VALID_DATA,
      }),
    };
    const result = await lambda.handler(event);
    assert.equal(result.statusCode, 400);
    assert.deepEqual(JSON.parse(result.body), {
      errorMessage: [
        `ValidationError: No TMC working day calendar data found for scenarioId a2940022-37f7-46ba-9fac-11fdb213914c and vanningCenter NoTMC`,
      ],
    });
  });

  it("Unit Test Case 36: The API should return validation error with status code 400 for partial timeframe (entirePlanDuration = false) - Shipping Pattern Data Covered the whole timeframe already.", async () => {
    console.log(
      "*****************Unit Test Case 36: The API should return validation error with status code 400 for partial timeframe (entirePlanDuration = false) - Shipping Pattern Data Covered the whole timeframe already.*****************"
    );
    process.env.VALIDATION = "AlreadyCovered";
    const event = {
      body: JSON.stringify({
        scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
        entirePlanDuration: false,
        userEmail: "test.user@toyota.com",
        vanningCenter: "AlreadyCovered",
        data: VALID_DATA,
      }),
    };
    const result = await lambda.handler(event);
    assert.equal(result.statusCode, 400);
    assert.deepEqual(JSON.parse(result.body), {
      errorMessage: [
        "ValidationError: Shipping pattern data already exists for the entire scenario duration. No update was performed.",
      ],
    });
  });
});
