import { call, put, select } from "redux-saga/effects";
import {
  actionFactory,
  sagaFactory,
  reducerFactory,
  selectorFactory,
  exposedActionFactory,
} from "../factories";

/*  request def
ActionStartType = {
    params: {},
    body: {}
}
ActionSuccessType = {
    data: {},
    maxPage?: Number || null,
}
ParserType = {};
HttpResultType = {};
RequestType = {
    method: String,
    url: String,
    pagination: Boolean,
    startPage: Number,
    serializer (actionStartType) => SerializerType || SerializerType,
    request (SerializerType) => HttpResultType,
    parser (httpResultType) => ActionSuccessType || ParserType,
    config: {},

}
*/

const fetchTemplate = (nameSpace, request, reducerPath) => {
  /* Actions */
  const fetchAction = actionFactory(nameSpace, "fetch", [
    "start",
    "success",
    "failed",
    "more",
    "unshift",
    "push",
    "remove",
    "clear",
  ]);

  /* Reducer */
  const reducer = {
    data: {
      condition: () => true,
      mutation: (state, action) => {
        switch (action.type) {
          case fetchAction.success.type:
            return [...state, ...action.data];
          case fetchAction.clear.type:
          case fetchAction.start.type:
            return [];
          case fetchAction.unshift.type:
            return [...state, action.data];
          case fetchAction.push.type:
            return [action.data, ...state];
          case fetchAction.remove.type:
            return state.filter((item) => item !== action.data); // should use lodash isEqual
          default:
            return state;
        }
      },
      init: [],
    },
    page: {
      condition: () => true,
      mutation: (state, action) => {
        if (action.type === fetchAction.more.type) return state + 1;
        if (action.type === fetchAction.start.type)
          return request.startPage || null;
        return state;
      },
      init: request.startPage || null,
    },
    maxPage: {
      condition: (type) => type === fetchAction.success.type,
      mutation: (state, action) => action.maxPage || null,
      init: 0,
    },
    error: {
      condition: (type) => true,
      mutation: (state, action) => {
        if (action.type === fetchAction.failed.type) return action.error;
        if (action.type === fetchAction.success) return null;
        return state;
      },
    },
    payload: {
      condition: (type) => type === fetchAction.start.type,
      mutation: (state, action) => action.payload,
    },
    isLoading: {
      condition: (action) =>
        [
          fetchAction.start.type,
          fetchAction.success.type,
          fetchAction.failed.type,
        ].includes(action),
      mutation: (state, action) =>
        [fetchAction.start.type, fetchAction.more.type].includes(action.type),
    },
  };
  const fetchReducer = reducerFactory(reducer);
  /* Selectors  */
  const fetchSelector = selectorFactory(Object.keys(reducer), reducerPath);
  /* Http Saga */
  const httpConfig = {
    method: "get",
    pagination: false,
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

  function* saga(action) {
    try {
      const payload = yield select(fetchSelector.payload);
      if (request.pagination) {
        const page = yield select(fetchSelector.page);
        payload.params = { ...payload.params, page };
      }
      const serializedRequestParams = http.serializer(payload);
      const res = yield call(http.request, serializedRequestParams);
      yield put(fetchAction.success.event(http.parser(res)));
    } catch (error) {
      const { message, log } = http.errorParser(error);
      yield put(fetchAction.failed.event({ error: { message, log } }));
    }
  }
  const fetchSaga = sagaFactory(
    [fetchAction.start.type, fetchAction.more.type],
    saga
  );

  /* Interface */
  const fetch = (params, body) =>
    fetchAction.start.event({
      payload: {
        ...(params && { params }),
        ...(body & { body }),
      },
    });

  const actions = {
    fetch,
    more: fetchAction.more.event,
    push: (data) => fetchAction.push.event({ data }),
    unshift: (data) => fetchAction.unshift.event({ data }),
    remove: (data) => fetchAction.remove.event({ data }),
  };

  return [
    {
      actions,
      reducer: fetchReducer,
      selectors: fetchSelector,
      saga: fetchSaga,
    },
    {
      baseActions: fetchAction,
      reducerPath,
      request: httpConfig,
    },
  ];
};

export default fetchTemplate;
