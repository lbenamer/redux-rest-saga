import { selectorGenerator } from "../generators";
import {
  actionFactory,
  sagaFactory,
  reducerFactory,
  selectorFactory,
  httpFactory,
  httpErrorParser,
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

  describe("reducerFactory", () => {
    const reducer = reducerFactory({
      data: {
        condition: (type) => type === "POPULATE_DATA",
        mutation: (state, action) => action.data,
      },
      count: {
        condition: (type) => type === "INCREMENT_COUNT",
        mutation: (state, action) => state + 1,
        init: 0,
      },
    });

    it("should create a reducer Fn", () => {
      expect(typeof reducer).toEqual("function");
      expect(reducer({}, {})).toEqual({ data: null, count: 0 });
    });

    it("should muatate state regarding actions", () => {
      const store = { data: null, count: 0 };

      expect(
        reducer(store, { type: "POPULATE_DATA", data: "mutate" })
      ).toEqual({ ...store, data: "mutate" });
      expect(reducer(store, { type: "INCREMENT_COUNT" })).toEqual({
        ...store,
        count: 1,
      });
      expect(reducer(store, { type: "UNKOWN_REDUCER_ACTION" })).toEqual(store);
    });
  });

  describe('selectorFactory', () => {
    it('should create selector object', () => {
      const states = ['content', 'count', 'isLoading']
      const selector = selectorFactory(states, '');

      expect(Object.keys(selector)).toEqual(states)
    })

    it('should access selected state', () => {
      const states = ['content', 'count', 'isLoading']
      const selector = selectorFactory(states, 'store.data');
      const store = { store: { data: {
        content: 'some data',
        count: 42,
        isLoading: false,
      }}};

      expect(selector.content(store)).toEqual('some data');
      expect(selector.count(store)).toEqual(42);
      expect(selector.isLoading(store)).toEqual(false);
    })
  });

  describe('sagaFactory', () => {
    const saga = sagaFactory('TEST_SAGA', () => 'hello');

    expect(typeof saga).toEqual("function")
    expect(saga.constructor.name).toEqual("GeneratorFunction");
  })

  describe('httpFactory', () => {
    it('should generate a default http object', () => {
      const http = httpFactory({});

      expect(typeof http.request).toEqual("function");
      expect(typeof http.parser).toEqual("function");
      expect(typeof http.serializer).toEqual("function");
      expect(typeof http.errorParser).toEqual("function");
    })

    it('shoud return a custom http object', () => {
      const http = httpFactory({
        request: () => ({}),
        parser: () => ({}),
        serializer: () => ({}),
        errorParser: () => ({})
      })

      expect(typeof http.request).toEqual("function");
      expect(typeof http.parser).toEqual("function");
      expect(typeof http.serializer).toEqual("function");
      expect(typeof http.errorParser).toEqual("function");
    })
  })

  it('should parse axios error', () => {
    const fakeError = {
      message: 'error message',
      errorStatus: 404,
      extraInfo: 'blabla',
      responseHeaders: {
        content: 'json'
      }
    };
    const formattedError = httpErrorParser(fakeError);
    expect(formattedError).toMatchObject({
      message: 'error message',
      log: {
        errorStatus: 404,
        extraInfo: 'blabla',
        responseHeaders: {
          content: 'json'
        }
      }
    })
  })

});
