import { combineReducers } from "redux";

import {
  actionGenerator,
  sagaGenerator,
  actionSagaGenerator,
  reducerGenerator,
  selectorGenerator,
  httpParserGenerator,
  httpSerializerGenerator,
  httpRequestGenerator,
} from "../generators";

/* Actions */
export const actionFactory = (actionName, nameSpace, cycles) => {
  const actions = {};
  cycles.forEach((cycle) => {
    const [action, actionType] = actionGenerator(actionName, nameSpace, cycle);
    actions[cycle] = {
      event: action,
      type: actionType
    };
  });
  return actions;
};

/* Reducer */
export const reducerFactory = (store) => {
  const reducer = {};
  Object.entries(store).forEach(([state, { condition, mutation, init }]) => {
    reducer[state] = reducerGenerator(condition, mutation, init);
  });

  return combineReducers(reducer);
};

/* Selectors  */
export const selectorFactory = (keys, path) => {
 const selectors = keys.reduce((obj, key) => {
   obj[key] = selectorGenerator(key, path);
   return obj;
 }, {});

 return selectors;
};

/* Saga */
export const sagaFactory = (actionType, saga) => {
  const actionSaga = actionSagaGenerator(saga);
  return sagaGenerator(actionType, actionSaga);
};

/* Http */
const httpErrorParser = (error) => ({
  message: error.message,
  log: JSON.parse(JSON.stringify(error)),
});

export const httpFactory = (request) => ({
  request: request.request || httpRequestGenerator(request),
  parser: request.parser && typeof request.parser === 'function' ?
    request.parser : httpParserGenerator(request.parser),
  serializer: request.serializer && typeof request.serializer === 'function' ?
    request.serializer : httpSerializerGenerator(request.serializer),
  errorParser: request.errorParser || httpErrorParser,
});
