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
const authMiddleware = require('./middlewares/authMiddleware');

const app = express();

const expressLayouts = require('express-ejs-layouts');
const config = require('./config/config');
const { formatFechaHoy, formatUltimoIngreso } = require('./helpers/dateHelpers');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: config.sessionSecret,
  saveUninitialized: false,
  resave: false,
  cookie: { maxAge: config.sessionMaxAge },
}));

app.use(expressLayouts);
app.set('layout', 'layouts/main');

app.use('/auth', authRouter);
app.use('/ahorro', authMiddleware, AhorroRouter);
app.use('/inicio', authMiddleware, inicioRouter);
app.use('/actualizaciondatos', authMiddleware, actualizaciondatosRouter);
app.use('/products-services', authMiddleware, productServicesRouter);
app.use('/combos', authMiddleware, combosRouter);

// catch 404 and forward to error handler
app.use(function (_, _, next) {
  next(createError(404));
});

app.locals.formatFechaHoy = formatFechaHoy;
app.locals.formatUltimoIngreso = formatUltimoIngreso;

app.use((req, res, next) => {
  res.locals.title = "FONDOOPA | Servicios en Linea";
  next();
});

// error handler
app.use(function (err, req, res, _) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
