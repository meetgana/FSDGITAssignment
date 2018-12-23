var express = require ('express');
var session = require('express-session');
var router = express.Router();
var mysqlDb   = require('mysql');

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

router.get ('/', function (req, res, next) {
    console.log("inside prevOrders");
    console.log ('Id ' + req.session.email);

    pool.getConnection(function(err, connection) {
        if (req.session.userName === "Admin") {
            var ordStatus = "Placed";
            selectOrders = "select * from orders where status = '"+ ordStatus +"'";
        }
        else {
            selectOrders = "select * from orders where email = '"+req.session.email+"'";
        }
            connection.query(selectOrders,function(error, result)  {   
            console.log ('result : ');
            console.log (result);
            console.log (result.length);
            if (result.length > 0) {
                connection.release();
                res.render('prevOrders', {userName: req.session.userName, orders: result});
            }  
            else {
                connection.release();
                res.render('prevOrders', {userName: req.session.userName, orders: null});
            }                                                 
        });
    });
})

/* router.get ('/', function (req, res, next) {
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
*/

 router.get ('/cancel/:orderId', function (req, res, next) {
    console.log("/cancel");
    var orderId= req.params.orderId;
    console.log ('ordrId ' + req.params.orderId);

    pool.getConnection(function(err, connection) {
        var cancel= "Cancelled";
        var updateOrderStatus = "update orders set status = '"+ cancel +"' where orderId = "+ orderId +"";        
        connection.query(updateOrderStatus, function (error, results) {
            console.log("results :" + results); 
        })
        connection.release();
    })
    res.redirect('/prevOrders');
})

router.get ('/approve/:orderId', function (req, res, next) {
    console.log("/approve");
    var orderId= req.params.orderId;
    console.log ('ordrId ' + req.params.orderId);

    pool.getConnection(function(err, connection) {
        var approve= "Approved";
        var updateOrderStatus = "update orders set status = '"+ approve +"' where orderId = "+ orderId +"";        
        connection.query(updateOrderStatus, function (error, results) {
            console.log("results :" + results); 
        })
        connection.release();
    })
    res.redirect('/prevOrders');
})

router.get ('/modify/:orderId', function (req, res, next) {
    console.log("/modify");
    var orderId= req.params.orderId;
    console.log ('ordrId ' + req.params.orderId);

    pool.getConnection(function(err, connection) {
        var selectOrders = "select * from orders where orderId = "+ orderId +"";
        connection.query(selectOrders, function (error, results) {
            console.log(results); 

            if (results.length > 0) {
                connection.release();
                res.render('modifyOrder', {userName: req.session.userName, order: results});
            }  
            else {
                connection.release();
                res.redirect('/prevOrders');
            }                                                 
        })
    })
})


router.get ('/updateOrder/:orderId/:itemName/:quantity/:price/:total', function (req, res, next) {
    console.log("/updateOrder");
    var orderId= req.params.orderId;
    var itemName= req.params.itemName;
    var quantity= req.params.quantity;
    var price= req.params.price;
    var total = req.params.total;
    console.log ('ordrId ' + req.params.orderId);
    console.log ('itemName ' + req.params.itemName);
    console.log ('quantity ' + req.params.quantity);
    console.log ('price ' + req.params.price);

    var subTotal = Math.round ((quantity * price), 2);
    pool.getConnection(function(err, connection) {
        var updateItem = "update orders set quantity = "+ quantity +", subTotal = "+ subTotal +", total = "+ total +" where orderId = "+ orderId +" and itemName = '"+ itemName +"'";
        connection.query(updateItem, function (error, results) {
            console.log(results); 
        })
        connection.release();
    })

    res.redirect ("/prevOrders/modify/" + orderId);

 /*   pool.getConnection(function(err, connection) {
        var selectOrders = "select * from orders where orderId = "+ orderId +"";
        connection.query(selectOrders, function (error, results) {
            console.log(results); 
            connection.release();
            res.render('modifyOrder', {userName: req.session.userName, order: results});
        })
    })
/*
/*
    pool.getConnection(function(err, connection) {
        var selectOrders = "select * from orders where orderId = "+ orderId +"";
        connection.query(selectOrders, function (error, results) {
            console.log(results); 

            var total = 0;
            for (i = 0; i < results.length; i++) {
                total = total + (results[i].quantity * results[i].price);
                total = Math.round (total, 2);
            }

            var updateItem = "update orders set total = "+ total +" where orderId = "+ orderId +"";
            connection.query(updateItem, function (error, results) {
                console.log(results); 
            })
        })
        connection.release();
    })

    pool.getConnection(function(err, connection) {
        var selectOrders = "select * from orders where orderId = "+ orderId +"";
        connection.query(selectOrders, function (error, results) {
            console.log(results); 
            connection.release();
            res.render('modifyOrder', {userName: req.session.userName, order: results});
        })
    })
    */
})

module.exports = router;