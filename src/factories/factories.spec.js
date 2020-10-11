import {
  actionFactory,
  sagaFactory,
  reducerFactory,
  selectorFactory,
  httpFactory,
} from "./factories";

describe("ReduxRS Factories Unit Test", () => {
  describe("actionFactory", () => {
    it("should create an action object", () => {
      const action = actionFactory("test", "redux-rs", ["start", "stop"]);
      expect(action.start.type).toEqual("TEST_REDUX-RS_START");
      expect(action.start.event({ params: { data: "content" } })).toEqual({
        type: "TEST_REDUX-RS_START",
        params: {
          data: "content",
        },
      });
    });
  });

  it('should create a reducer', () => {
    // TODO
  })
});
