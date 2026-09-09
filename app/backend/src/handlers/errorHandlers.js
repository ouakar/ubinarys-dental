/*
  Catch Errors Handler

  With async/await, you need some way to catch errors
  Instead of using try{} catch(e) {} in each controller, we wrap the function in
  catchErrors(), catch any errors they throw, and pass it along to our express middleware with next()
*/

exports.catchErrors = (fn) => {
  return function (req, res, next) {
    return fn(req, res, next).catch((error) => {
      if (error.name == 'ValidationError') {
        return res.status(400).json({
          success: false,
          result: null,
          message: 'Required fields are not supplied',
          controller: fn.name,
          error: process.env.NODE_ENV === 'development' ? error : undefined,
        });
      } else {
        // Server Error
        return res.status(500).json({
          success: false,
          result: null,
          message: error.message,
          controller: fn.name,
          error: process.env.NODE_ENV === 'development' ? error : undefined,
        });
      }
    });
  };
};

/*
  Not Found Error Handler

  If we hit a route that is not found, we mark it as 404 and pass it along to the next error handler to display
*/
exports.notFound = (req, res, next) => {
  return res.status(404).json({
    success: false,
    message: "Api url doesn't exist ",
  });
};

/*
  Development Error Handler

  In development we show good error messages so if we hit a syntax error or any other previously un-handled error, we can show good info on what happened
*/
exports.developmentErrors = (error, req, res, next) => {
  console.error('DEV ERROR:', error);
  error.stack = error.stack || '';
  return res.status(error.status || 500).json({
    success: false,
    message: error.message,
    error: error,
    stack: error.stack,
  });
};

/*
  Production Error Handler

  No stacktraces or raw internal errors are leaked in production
*/
exports.productionErrors = (error, req, res, next) => {
  console.error('PROD ERROR:', error.message);
  return res.status(error.status || 500).json({
    success: false,
    message: error.status ? error.message : 'Une erreur interne du serveur est survenue.',
  });
};
