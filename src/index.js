import { asyncTemplate, fetchTemplate } from "./templates";


const reduxRS = (templateName, nameSpace, request, reducerPath) => {
  if(templateName === 'get')
    return asyncTemplate(templateName, nameSpace, request, reducerPath);

  if(['create', 'edit', 'delete'].includes(templateName)) {
    const [reduxRS, extra] = asyncTemplate(templateName, nameSpace, request, reducerPath)
    reduxRS.action.start = (id, body, params) => reduxRS.action.start(id, params, body);
    return [reduxRS, extra];
  }

  if(templateName === 'fetch')
    return fetchTemplate(nameSpace, request, reducerPath);
}

export default reduxRS;
export * from './factories';
export * from './generators';
export * from './templates';
