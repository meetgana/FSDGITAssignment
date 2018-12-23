var LocalStrategy   = require('passport-local').Strategy;

var mysql = require('mysql');

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

pool.getConnection(function(err, connection) {
    console.log ("passport.js - Database Connected!!");
    connection.release();
});


// expose this function to our app using module.exports
module.exports = function(passport) {

   passport.use('local-signup', new LocalStrategy({
             usernameField : 'email',
             passwordField : 'password',
             passReqToCallback : true 
            },
        function(req, email, password, done) {
            pool.getConnection(function(err, connection) {
                connection.query("select * from customer where email = '"+email+"'",function(err,rows){
		    	console.log(rows);
			    if (err)
                    return done(err);
			    if (rows.length) {
                    return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                } else {
                    var newUserMysql = new Object();
				    newUserMysql.name    = name;
				    newUserMysql.email    = email;
                    newUserMysql.password = password;
			
	    			var insertQuery = "INSERT INTO users ( name, email, password ) values ('" + name +"','" + email +"','"+ password +"')";
		    		console.log(insertQuery);
			    	connection.query(insertQuery,function(err,rows){
				         newUserMysql.id = rows.insertId;
				
				         return done(null, newUserMysql);
                    });	
                }	
                connection.release();
            });
		});
    }));

    passport.use('local-login', new LocalStrategy(
        {
            usernameField : 'email',
            passwordField : 'pwd',
            passReqToCallback : true
        },
    function(req, email, password, done) { 
            console.log('checking login credentials');
            pool.getConnection(function(err, connection) {
            connection.query("SELECT * FROM `customer` WHERE `email` = '" + email + "'",function(err,rows){
	    		if (err)
                    return done(err);
			     if (!rows.length) {
                    return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash
                } 
			
			    if (!( rows[0].password == password))
                    return done(null, false, req.flash('Password incorrect.'));
			
                return done(null, rows[0]);			
		    });
            connection.release();
        });
    }));

    passport.serializeUser(function(user, done) {
        console.log ('inside serialize');
        console.log (user);

        done(null, user.email);
    });
    
  passport.deserializeUser(function(email, done) {
        console.log ('inside deserialize');
        pool.getConnection(function(err, connection) {
            connection.query("SELECT * FROM `customer` WHERE `email` = '" + email + "'", function(err,rows){	
                console.log ('rows' +rows);
                done(err, rows[0]);
            });
            connection.release();
        });
    });
};