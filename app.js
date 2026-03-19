const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');

const authRouter = require('./routes/auth');
const AhorroRouter = require('./routes/Ahorro')
const inicioRouter = require('./routes/inicio')
const actualizaciondatosRouter = require('./routes/actualizaciondatos')
const productServicesRouter = require('./routes/productservices');
const combosRouter = require('./routes/combos')

const app = express();

const expressLayouts = require('express-ejs-layouts');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: "%J[vr2o@T%1{6mx.^#1w7M%dw?45u0R0B[Mxqj3>sl#:3#^zh=tTVh|,q(7+.Tu",
  saveUninitialized: false,
  resave: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: false,
    secure: false,
    sameSite: 'lax'
  }
}));

app.use(expressLayouts);
app.set('layout', 'layouts/main')

app.use('/auth', authRouter);
app.use('/ahorro', AhorroRouter);
app.use('/inicio', inicioRouter);
app.use('/actualizaciondatos', actualizaciondatosRouter);
app.use('/products-services', productServicesRouter);
app.use('/combos', combosRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.user = req.session.user || null; 
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
