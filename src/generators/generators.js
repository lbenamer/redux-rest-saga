import axios from "axios";
import { put, takeEvery, call, all, fork } from "redux-saga/effects";

/* Actions */
export const actionTypeGenerator = (actionName, nameSpace, status) => {
  const actionType = `${actionName.toUpperCase()}_${nameSpace.toUpperCase()}`;
  return status ? actionType + `_${status.toUpperCase()}` : actionType;
};

export const actionFnGenerator = (actionType) => (actionParams) => ({
  type: actionType,
  ...actionParams,
});

export const actionGenerator = (actionName, nameSpace, status) => {
  const actionType = actionTypeGenerator(actionName, nameSpace, status);
  const actionFn = actionFnGenerator(actionType);
  return [actionFn, actionType];
};

/* Reducer */
export const reducerGenerator = (conditionFn, mutationFn, init = null) => (
  state = init,
  action
) => (conditionFn(action.type) ? mutationFn(state, action) : state);

/* Selectors  */
export const selectorGenerator = (field, path) => (state) => {
  const fullPath = path ? `${path}.${field}` : field;
  return fullPath
    .split(".")
    .reduce((acc, curr) => (acc && acc[curr] ? acc[curr] : null), state);
};

/* Saga */
export const actionSagaGenerator = (sagaFn) =>
  function* saga(action) {
    yield sagaFn(action);
  };

export const sagaGenerator = (actionType, actionSaga, sagaEffect = takeEvery) =>
  function* saga() {
    yield sagaEffect(actionType, actionSaga);
  };

/* Http */
export const httpRequestGenerator = (request) => ({ id, params, body } = {}) =>
  axios({
    url: id || id === 0 ? `${request.url}/${id}` : request.url,
    method: request.method,
    headers: request.headers,
    data: body,
    params,
  }).then((res) => res);

export const httpParserGenerator = (parser = {}) => (res) =>
  Object.entries(parser).reduce((acc, [key, value]) => {
    if (!res) return res;
    if (res[value] || res[value] === 0) acc[key] = res[value];
    delete acc[value];
    return acc;
  }, res);

export const serializerGenerator = (serializer) => (payload) =>
  Object.entries(serializer).reduce((acc, [key, value]) => {
    if (!payload) return payload;
    if (payload[key] || payload[key] === 0) acc[value] = payload[key];
    delete acc[key];
    return acc;
  }, payload);

export const httpSerializerGenerator = (serializer = {}) => (payload) =>
  Object.entries(serializer).reduce((acc, [key, value]) => {
    if(!payload) return payload;
    acc[key] = serializerGenerator(value)(payload[key]);
    return acc;
  }, payload);
