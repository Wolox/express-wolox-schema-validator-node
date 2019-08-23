const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true, coerceTypes: 'number', v5: true });
const routeChecks = require('./checker');
const { supportedSchemaKeys, supportedHTTPMethods } = require('./constants');
const {
  throwError,
  unsupportedKeyError,
  unsupportedMethodError,
  emptySchema,
  alreadyExistingSchema,
  missingSchemaForRoute,
  middlewareSetupMissing
} = require('./errors');

// MAIN STATE
let routeSchemas = null;

const baseSchema = schema => {
  Object.keys(schema).forEach(k => {
    if (!supportedSchemaKeys.some(sk => sk === k))
      throwError(unsupportedKeyError(k));
  });
  return {
    type: 'object',
    required: Object.keys(schema),
    properties: {
      ...schema
    }
  };
};

const addSchema = (method, route, schema) => {
  if (routeSchemas === null) throwError(middlewareSetupMissing);
  if (!supportedHTTPMethods.some(s => s === method))
    throwError(unsupportedMethodError(route, method));

  if (schema === {})
    throwError(emptySchema(route, method));

  if (!routeSchemas[route]) routeSchemas[route] = {};
  if (routeSchemas[route][method])
    throwError(alreadyExistingSchema(route, method));

  routeSchemas[route][method] = {
    schema: ajv.compile(baseSchema(schema)),
    params: schema
  };
};

const middlewareFunction = (req, res, next) => {
  const { method, route: { path } } = req;
  if (!routeSchemas[path] || !routeSchemas[path][method])
    throwError(missingSchemaForRoute(path, method));

  const { schema } = routeSchemas[path][method];
  const valid = schema(req);
  if (valid) next();
  else
    res.status(400).send(ajv.errorsText(schema.errors));
};

/* eslint-disable no-underscore-dangle */
const setupMiddlewares = app => {
  routeSchemas = {};
  if (app._router)
    app._router.stack.forEach(r => {
      if (r.route && r.route.path)
        throwError(middlewareSetupMissing);
    });

  routeChecks(app, middlewareFunction, routeSchemas);
};
/* eslint-enable no-underscore-dangle */

module.exports = { addSchema, setupMiddlewares };
