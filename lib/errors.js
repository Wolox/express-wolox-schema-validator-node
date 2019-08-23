const { logger } = require('express-wolox-logger');

exports.throwError = msg => {
  logger.error(`Parameter validator error: ${msg}`);
  throw new Error(msg);
};

exports.noRouteWithoutSchema = (route, method) =>
  `Cant set route ${route} for method ${method} without creating a schema first`;
exports.noRouteForExistingSchema = (route, method) =>
  `No route ${route} for method ${method} was defined but the schema was declared`;
exports.unsupportedKeyInSchema = key => `use of unsupported key ${key} in schema`;
exports.unsupportedMethodInSchema = (route, method) =>
  `Unsupported method ${method} in schema for route ${route}`;
exports.emptySchema = (route, method) =>
  `Schema for route ${route} and method ${method} cant be empty`;
exports.alreadyExistingSchema = (route, method) =>
  `There is already an schema set for path ${route} and method ${method}`;
exports.missingSchemaForRoute = (route, method) =>
  `No schema for route ${route} on method ${method}`;
exports.middlewareSetupMissing = 'This middleware needs to be added before setting any routes';
