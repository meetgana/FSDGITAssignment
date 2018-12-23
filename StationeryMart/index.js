var express = require ('express');
var mysql   = require('mysql');
var bodyParser = require('body-parser');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var session = require('express-session');
var flash = require('connect-flash');
var cart = require('./Modals/cart');
var prevOrders = require('./Modals/prevOrders');

var app = express();
const port=4200; 
app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(session({
    secret: 'fsdnodejsstationerycart',
    resave: true,
    saveUninitialized: true
  }));

app.use(flash());

// Passport init
app.use(passport.initialize());
app.use(passport.session());
require('./config/passport')(passport);


var pool      =    mysql.createPool({
        connectionLimit : 100,
        waitForConnections : true,
        queueLimit :0,
        host     : '127.0.0.1',
        port     : '3306',
        user     : 'root',
        password : 'rootpassword',
        database : 'stationeries',
        debug    :  true,
        wait_timeout : 28800,
        connect_timeout :10
    });

//rootuser, rootpassword - mySQL root admin credentials;
pool.getConnection(function(err, connection) {
    console.log ("Database Connected!!");

    var sql = "DROP TABLE items";
    connection.query(sql, function (err, result) {
        console.log ("Dropping items Table");
    });
    var sql = "CREATE TABLE items (id INT AUTO_INCREMENT PRIMARY KEY, itemName VARCHAR(255) UNIQUE KEY, count VARCHAR(255), price DECIMAL(10, 2))";
    connection.query(sql, function (err, result) {
        console.log ("Creating items Table");
    });

    var sql = "CREATE TABLE customer (name VARCHAR(255), email VARCHAR(255) PRIMARY KEY, password VARCHAR(60))";
    connection.query(sql, function (err, result) {
        console.log ("Creating Customer Table");
    });

    var sql = "CREATE TABLE orders (orderId INT, email VARCHAR(255), itemName VARCHAR(255), price DECIMAL(10, 2), quantity INT, subTotal DECIMAL(10, 2), total DECIMAL(10, 2), status VARCHAR(255))";
    connection.query(sql, function (err, result) {
        console.log ("Creating order Table");
    });

    console.log("Inserting into DB!");
    var sql = "INSERT INTO items (itemName, count, price) VALUES ?";
    var values = [
      ['A4 Paper', '100 pages', 5.99],
      ['A3 Paper', '100 pages', 8.98],
      ['Carbon Pencil', '10', 3.91],
      ['Lead Pencil', '10', 5.02],
      ['Eraser', '10', 3.10],
      ['Ball Point Pen', '5', 5.09],
      ['Gel Pen', '5', 7.89],
      ['Marker', '1', 3.90],
      ['Duster', '1', 2.65],
      ['Stapler', '1', 10.25],
      ['Stapler Pins', '100', 3.55]
    ];
    connection.query(sql, [values], function (err, result) {
        console.log("Records inserted");
    });

    connection.release();
})

function ensureAuthenticated(req, res, next) {
    if(req.isAuthenticated()) {
      next();
    } else {
      console.log('You must be logged in to see this page.');
      res.redirect('/login');
    }
  }
  
  app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash('error');
    res.locals.info = req.flash('info');
    next();
  });

app.use ('/cart', cart);
app.use ('/prevOrders', prevOrders);

app.get('/', function (req, res) {
    res.render ('index', {userName: req.session.userName});
 })

app.get ('/signUp', function(req, res){
    res.render ('signUp');
});

app.post ('/submit', passport.authenticate('local-signup'), function(req, res){
    console.log ('Rendering index page');
    res.redirect('login')
});

app.get ('/login', function(req, res){
    res.render ('login');
})

app.post ('/checkLogin', function(req, res, next){
    console.log('inside checkLogin');
    passport.authenticate('local-login', function(err, user, info) {
        if (err) { console.log ('err'); return next(err); }
        if (!user) { console.log ('no user'); return res.redirect('/login'); }
        req.logIn(user, function(err) {
          if (err) { return next(err); }
          console.log ('login successful')
            req.session.userName = req.user.name;
            req.session.email = req.user.email;
            console.log ('email : ' + req.user.email);
            return res.render ('./index', {userName: req.user.name})
        });
      })(req, res, next);
      
});

app.get ('/items', ensureAuthenticated, function(req, res){
    pool.getConnection(function(err, connection) {
        console.log ("Database Connected!!");
    
        connection.query('SELECT * FROM items', function (error, results) {
            console.log('No. of rows are : ' );
            console.log(results.length);
            if (results.length > 0) {
               res.render ('items', {data: results, userName: req.session.userName, error: null});
            }
            console.log('Results are : ' );
            results.forEach( (row) => {
            console.log (`${row.itemName} - ${row.count} - ${row.price}`);
            });
        });
        connection.release();
    });
});

app.get('/signout', function(req, res){
    console.log ('inside signout');
    req.logout();
    res.render('index', {userName: null});
  });

app.listen(port);
console.log ("Server running at port: " + port);