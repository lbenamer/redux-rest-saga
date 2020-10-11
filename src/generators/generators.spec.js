import {
  actionTypeGenerator,
  actionFnGenerator,
  actionGenerator,
  sagaGenerator,
  actionSagaGenerator,
  reducerGenerator,
  selectorGenerator,
  httpParserGenerator,
  httpSerializerGenerator,
  httpRequestGenerator,
} from "./generators";

describe("Generators Unit Testing", () => {
  describe("actionGenerators", () => {
    it("actionTypeGenerator should generate a formatted string type", () => {
      expect(actionTypeGenerator("test", "redux")).toEqual("TEST_REDUX");
      expect(actionTypeGenerator("test", "redux", "saga")).toEqual(
        "TEST_REDUX_SAGA"
      );
    });

    it("actionFnGenerator should generate an action function", () => {
      const actionType = "ACTION_TYPE";
      const actionFn = actionFnGenerator(actionType);
      isValidActionFn(actionFn, actionType);
    });

    it("actionGenerator should generate an action object", () => {
      const [actionFn, actionType] = actionGenerator("test", "redux");
      expect(actionType).toEqual("TEST_REDUX");
      isValidActionFn(actionFn, actionType);
    });
  });

  describe("reducerGenerator", () => {
    it("should generate a reducer function", () => {
      const condition = (type) => type === "TEST_REDUX";
      const mutation = (state, action) => state + 1;
      const state = 0;
      const reducer = reducerGenerator(condition, mutation, state);

      expect(typeof reducer).toEqual("function");
      expect(reducer(state, { type: "TEST_REDUX" })).toEqual(1);
      expect(reducer(undefined, { type: "TEST_REDUX" })).toEqual(1);
      expect(reducer(state, { type: "TYPE" })).toEqual(state);
      expect(reducer(undefined, { type: "TYPE" })).toEqual(state);
    });
    it('should use null as default state value', () => {
      const condition = (type) => type === "TEST_REDUX";
      const mutation = (state, action) => state;
      const reducer = reducerGenerator(condition, mutation)
      expect(reducer(undefined, { type: "RETURN_DEFAULT" })).toEqual(null);
    })
  });

  describe("selectorGenerator", () => {
    it("should generate a selector function", () => {
      const state = { data: { count: 42 } };
      const selector = selectorGenerator("count", "data");

      expect(typeof selector).toEqual("function");
      expect(selector(state)).toEqual(42);
      expect(selector({})).toEqual(null);
      expect(selector()).toEqual(null);
    });

    it('should accept empty path', () => {
      const state = { count: 42 };
      const selector = selectorGenerator("count");

      expect(typeof selector).toEqual("function");
      expect(selector(state)).toEqual(42);
      expect(selector({})).toEqual(null);
      expect(selector()).toEqual(null);
    })

    it("should access nested state level", () => {
      const selector = selectorGenerator("count", "reducer.content.data");
      expect(
        selector({ reducer: { content: { data: { count: 42 } } } })
      ).toEqual(42);
    });
  });

  describe("sagaGenerator", () => {
    it("actionSagaGenerator should generate a function generator", () => {
      const sagaFn = (action) => action;
      const actionSaga = actionSagaGenerator(sagaFn);
      isGeneratorFn(actionSaga);
      const gen = actionSaga("Hello 42");
      expect(gen.next().value).toEqual("Hello 42");
    });
    it("sagaGenerator should generate a saga function generator", () => {
      const saga = sagaGenerator(
        "REDUX_TEST",
        actionSagaGenerator(() => ({}))
      );
      isGeneratorFn(saga);
    });
    it("sagaGenerator should accepte list of actions as first argument", () => {
      const saga = sagaGenerator(
        ["REDUX_TEST", "REDUX_SAGA"],
        actionSagaGenerator(() => ({}))
      );
      isGeneratorFn(saga);
      const gen = saga();
      expect(gen).not.toEqual(undefined);
      expect(gen.next()).not.toEqual(undefined);
    });
  });

  describe("httpRequestGenerator", () => {
    const url = "https://jsonplaceholder.typicode.com/todos";
    it("should generate function to perform http request", async () => {
      const request = httpRequestGenerator({
        url,
        method: "get",
      });
      const result = await request();
      expect(result.status).toEqual(200);
      expect(result.config.url).toEqual(url);
      expect(result.config.method).toEqual("get");
    });

    it("generated function should inject id arg in url", async () => {
      const request = httpRequestGenerator({ url, method: "get" });
      const result = await request({ id: 1 });

      expect(result.status).toEqual(200);
      expect(result.config.url).toEqual(url + "/1");
      expect(result.config.method).toEqual("get");
    });

    it("generated function should inject params arg into query params (url)", async () => {
      const request = httpRequestGenerator({ url, method: "get" });
      const result = await request({ params: { completed: false, _page: 1 } });

      expect(result.status).toEqual(200);
      expect(result.config.params).toEqual({ completed: false, _page: 1 });
      expect(result.config.method).toEqual("get");
    });

    it("generated function should inject body arg into request body", () => {
      const request = httpRequestGenerator({ url, method: "patch" });

      const asyncTest = async () => {
        const result = await request({
          id: 42,
          body: { title: "edited by automatic test" },
        });
        expect(result.status).toEqual(200);
        expect(result.config.data).toEqual(
          JSON.stringify({
            title: "edited by automatic test",
          })
        );
        expect(result.config.method).toEqual("patch");
      };
      return asyncTest();
    });

    it("generated function should support all http method", async () => {
      const methods = ["get", "post", "patch", "put", "delete"];
      const requests = methods.map((method) =>
        httpRequestGenerator({ url, method })
      );

      const requestParams = (method) => ({
        id: method !== "post" ? 42 : undefined,
        body: method !== "get" ? { body: { title: "test" } } : undefined,
      });

      methods.forEach(async (method, index) => {
        const response = await requests[index](requestParams(method));
        if (method === "post") expect(response.status).toEqual(201);
        else expect(response.status).toEqual(200);
        expect(response.config.method).toEqual(method);
      });
    });
  });

  describe('httpParserGenerator', () => {
    it('should generate parser function according to parser object', () => {
      const parser = httpParserGenerator({ page: '_page' });
      expect(parser({ _page: 42})).toEqual({ page: 42 })
    })

    it('should only parse specified field', () => {
      const parser = httpParserGenerator({ page: '_page' });
      expect(parser({ _page: 42, other_data: "hello" }))
        .toEqual({ page: 42, other_data: "hello" })
    })

    it('should remove same key values entries', () => {
      const parser = httpParserGenerator({ page: '_page', toRemove: 'toRemove' });
      expect(parser({ _page: 42, other_data: "hello", toRemove: "unwanted data" }))
        .toEqual({ page: 42, other_data: "hello" })
    })

    it('should allow empty / undefined values', () => {
      expect(httpParserGenerator(undefined)({ page: 42 })).toEqual({ page: 42 });
      expect(httpParserGenerator({})({ page: 42 })).toEqual({ page: 42 });
      expect(httpParserGenerator({page: '_page'})({ _page: 0 })).toEqual({ page: 0 });
      expect(httpParserGenerator(undefined)()).toEqual();
      expect(httpParserGenerator(undefined)({})).toEqual({});
      expect(httpParserGenerator({})({})).toEqual({});
      expect(httpParserGenerator({})()).toEqual();
      expect(httpParserGenerator({})(null)).toEqual(null);
      expect(httpParserGenerator({page: '_page'})(undefined)).toEqual(undefined);
      // expect(httpParserGenerator({page: '_page'})(null)).toEqual(null);
    })
  });
  describe('serializerGenerator', () => {
    it('should generate serializer function', () => {
      const serializer = httpSerializerGenerator({ params: { page: '_page' } })
      expect(serializer({ params: { page: 42 } })).toEqual({ params: { _page: 42 } })
    })

    it('should only parse specified field', () => {
      const serializer = httpSerializerGenerator({ params: { page: '_page' } })
      expect(serializer({ params: { page: 42, token: 'abcd' } }))
        .toEqual({ params: { _page: 42, token: 'abcd' } })
    })

    it('should remove same key values entries', () => {
      const serializer = httpSerializerGenerator({ params: { page: '_page', date: 'date' } })
      expect(serializer({ params: { page: 42, token: 'abcd', date: 123432 } }))
        .toEqual({ params: { _page: 42, token: 'abcd' } })
    })

    it('should allow empty / undefined values', () => {
      expect(httpSerializerGenerator(undefined)({ page: 42 })).toEqual({ page: 42 });
      expect(httpSerializerGenerator({})({ page: 42 })).toEqual({ page: 42 });
      expect(httpSerializerGenerator({a:{page:'_page'}})({a:{page:0}})).toEqual({a:{_page: 0}});
      expect(httpSerializerGenerator(undefined)()).toEqual();
      expect(httpSerializerGenerator(undefined)({})).toEqual({});
      expect(httpSerializerGenerator({})({})).toEqual({});
      expect(httpSerializerGenerator({})()).toEqual();
      expect(httpSerializerGenerator({a:{page:'_page'}})(undefined)).toEqual(undefined);
    })

  })


});

const isValidActionFn = (actionFn, actionType) => {
  expect(typeof actionFn).toBe("function");
  expect(actionFn()).toEqual({ type: actionType });
  expect(actionFn({ payload: "test" })).toEqual({
    type: actionType,
    payload: "test",
  });
};

const isGeneratorFn = (fn) =>
  expect(fn.constructor.name).toEqual("GeneratorFunction");
