const { supportedHTTPMethods } = require('./constants');
const { throwError, noRouteWithoutSchema, noRouteForExistingSchema } = require('./errors');

const getHandler = (routeSchemas, method, middlewareFunction) => ({
  apply: (target, thisArg, argList) => {
    if (argList.length === 1) return target.call(thisArg, ...argList);
    const [route] = argList;
    const routes = Object.keys(routeSchemas);
    if (!routes.some(r => r === route) || !routeSchemas[route][method])
      throwError(noRouteWithoutSchema(route, method));

    const [hd, ...tl] = argList;
    return target.call(thisArg, hd, middlewareFunction, ...tl);
  }
});

const listenHandler = (fn, routeSchemas) => new Proxy(fn, {
  apply: (target, thisArg, argList) => {
    /* eslint-disable no-underscore-dangle */
    Object.keys(routeSchemas).forEach(schemaPath => {
      Object.keys(routeSchemas[schemaPath]).forEach(method => {
        const layer = thisArg._router.stack.find(({ route: r }) => r && r.path === schemaPath && r.methods[method.toLowerCase()]);
        if (!layer)
          throwError(noRouteForExistingSchema(schemaPath, method));
      });
    });
    return target.call(thisArg, ...argList);
  }
});


const setupRouteChecks = (app, middlewareFunction, routeSchemas) => {
  supportedHTTPMethods.forEach(method => {
    const m = method.toLowerCase();
    app[m] = new Proxy(app[m], getHandler(routeSchemas, method, middlewareFunction));
  });
  app.listen = listenHandler(app.listen, routeSchemas);
};

module.exports = setupRouteChecks;
