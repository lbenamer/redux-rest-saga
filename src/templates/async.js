import { call, put, select } from "redux-saga/effects";
import {
  actionFactory,
  sagaFactory,
  reducerFactory,
  selectorFactory,
  httpFactory,
} from "../factories";

export const asyncTemplate = (actionName, nameSpace, request, reducerPath) => {
  /* Actions */
  const asyncAction = actionFactory(actionName, nameSpace, [
    "start",
    "success",
    "failed",
  ]);

  /* Reducer */
  const reducer = {
    data: {
      condition: (type) => type === asyncAction.success.type,
      mutation: (state, action) => action.data,
    },
    error: {
      condition: (type) => true,
      mutation: (state, action) => {
        if (action.type === asyncAction.failed.type) return action.error;
        if (action.type === asyncAction.success.type) return null;
        return state;
      },
    },
    payload: {
      condition: (type) => type === asyncAction.start.type,
      mutation: (state, action) => action.payload,
    },
    isLoading: {
      condition: (action) =>
        [
          asyncAction.start.type,
          asyncAction.success.type,
          asyncAction.failed.type,
        ].includes(action),
      mutation: (state, action) => action.type === asyncAction.start.type,
    },
  };
  const asyncReducer = reducerFactory(reducer);

  /* Selectors  */
  const asyncSelector = selectorFactory(Object.keys(reducer), reducerPath);

  /* Http Saga */
  const httpConfig = {
    method: "get",
    parser: {
      maxPage: "max_page",
      status: "status",
      statusText: "statusText",
      headers: "headers",
      config: "config",
      request: "request",
    },
    ...request,
  };
  const http = httpFactory(httpConfig);

  function* saga({ type, ...action }) {
    try {
      const serializedPayload = http.serializer(action.payload);
      const result = yield call(http.request, serializedPayload);
      yield put(asyncAction.success.event(http.parser(result)));
    } catch (error) {
      const { message, log } = http.errorParser(error);
      yield put(asyncAction.failed.event({ error: { message, log } }));
    }
  }
  const asyncSaga = sagaFactory(asyncAction.start.type, saga);

  // Interface
  const start = (id, params, body) =>
    asyncAction.start.event({
      payload: {
        id,
        ...(params && { params }),
        ...(body & { body }),
      },
    });

  return [
    {
      action: start,
      reducer: asyncReducer,
      selectors: asyncSelector,
      saga: asyncSaga,
    },
    {
      baseActions: asyncAction,
      reducerPath,
      request,
    },
  ];
};

export default asyncTemplate;
