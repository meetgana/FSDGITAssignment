var express = require ('express');
var session = require('express-session');
var router = express.Router();
var mysqlDb   = require('mysql');
var math = require ('mathjs');

var pool      =    mysqlDb.createPool({
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

router.use(session({
    secret: 'fsdnodejsstationerycart',
    resave: true,
    saveUninitialized: true
  }));

router.post ('/buy', function (req, res, next) {
    console.log("buy/");
    var itemName= req.body.itemName;
    var price= req.body.price;
    var quantity= req.body.quantity;
    console.log ('Id ' + req.body.itemName);
    console.log ('Id ' + req.body.price);
    console.log ('qty ' + req.body.quantity);
    subTotal = math.round ((quantity * price), 2);
    
    if (req.session.cart == null) {
        req.session.cart = [
            {itemName: itemName, quantity: quantity, price:price, subTotal: subTotal}
        ];
    }
    else {
        req.session.cart.push ({
            itemName: itemName, quantity: quantity, price: price, subTotal: subTotal
        })
    }

    console.log ("cart length " + req.session.cart.length);
    var total=0;
    for (var i = 0; i < req.session.cart.length; i++) {
        total = math.round ((total + req.session.cart[i].subTotal), 2);
    }
    console.log ("Total " + total);
 
    console.log (req.session.cart);
    res.render('cart', {userName: req.session.userName, cartItems: req.session.cart, total: total});
})

router.get ('/', function (req, res, next) {
        console.log ('session.cart');
        console.log (session.cart);
    if (req.session.cart == undefined) {
        console.log ('inside if');
        res.render('cart', {userName: req.session.userName, cartItems: null, total: null});
    }
    else {
        console.log ("cart length " + req.session.cart.length);
        var total=0;
        for (var i = 0; i < req.session.cart.length; i++) {
            total = math.round ((total + req.session.cart[i].subTotal), 2);
        }
        console.log ("Total " + total);
 
        console.log (req.session.cart);
        res.render('cart', {userName: req.session.userName, cartItems: req.session.cart, total:total});
    }
})

router.post ('/delete', function (req, res, next) {
    console.log("/delete");
    var itemName= req.body.itemName;
    var price= req.body.price;
    var quantity= req.body.quantity;
    console.log ('ItemName ' + req.body.itemName);
    console.log ('price ' + req.body.price);
    console.log ('qty ' + req.body.quantity);

    for (var i = 0; i < req.session.cart.length; i++) {
        if (req.body.itemName === req.session.cart[i].itemName) {
    //       req.session.cart[i].itemName = req.session.cart[i+1].itemName;
            req.session.cart.splice(i, 1);
        }
    }

    var total = 0;
    for (var i = 0; i < req.session.cart.length; i++) {
        total = math.round ((total + req.session.cart[i].subTotal), 2);
    }

    console.log ("Total " + total);
 
    console.log (req.session.cart);
    res.render('cart', {cartItems: req.session.cart, userName: req.session.userName, total:total});
})

router.get ('/placeOrder', function(req, res, next){
        console.log ("Inside placeOrder");
        pool.getConnection(function(err, connection) {
        console.log ("Database Connected!!");
        
        var orderId = 0;
        connection.query('SELECT MAX(orderId) as lastOrdNo FROM orders', function (error, results) {
            console.log('Max Order Id : ' + results[0].lastOrdNo);
            if (results[0].lastOrdNo == 0) {
                orderId = 1000;
            }
            else {
                orderId = results[0].lastOrdNo + 1
            }

            console.log ("Order No: " + orderId);


        var total = 0;
        for (var i = 0; i < req.session.cart.length; i++)
        {
            total = total + req.session.cart[i].subTotal;
        }
        console.log ("Total Cost : " + total);
        console.log ("Cart Len: " + req.session.cart.length);
        console.log (req.session.cart);
        var Placed = "Placed";
        for (i = 0; i < req.session.cart.length; i++)
        {
            var insertOrder = "INSERT INTO orders values (" + orderId + ", '" + req.session.email +"','"+ req.session.cart[i].itemName +"', "+ req.session.cart[i].price +", " + req.session.cart[i].quantity +", " + req.session.cart[i].subTotal +", "+ total +", '"+ Placed +"')";        
            connection.query(insertOrder, function (error, results) {
                console.log("results :" + results); 
            })
        }
        connection.release();
        res.render ('orderPlaced', {orderNo: orderId, userName: req.session.userName});
    });
});
 

});

module.exports = router;