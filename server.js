const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const PORT = process.env.PORT || 6969;

const admin = require('firebase-admin');
const serviceAccount = require('./monitoringthesis-firebase-adminsdk-p0kb9-bf974f7aab.json');

const checkStaleLocationData = (req, res, next) => {
    if (req.session.locationData && Date.now() - req.session.locationData.timestamp > 600000) {
        delete req.session.locationData;
    }
    next();
};

let passengerCount = 0;
let locationData = null;
let lastGpsData = null;
let totalDistance = 0;
let coConcentration = null;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://monitoringthesis-default-rtdb.asia-southeast1.firebasedatabase.app" 
});

const db = admin.database();

app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: 'z9f3fdjgghdsn',  // Change this to a long random string!
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }  // Set to true if you're using HTTPS
}));

app.use(express.json());
app.use(express.static('layout'));
app.set('view engine', 'ejs');


function ensureAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        next();  // User session exists, proceed
    } else {
        res.redirect('/');  // No user session, redirect to login
    }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    return distance; 
}

io.on('connection', (socket) => {
    console.log('User connected');
    socket.emit('totalDistance', totalDistance);

    socket.on('rfidTapped', (data) => {
        // Broadcast the RFID tap event to all connected devices
        io.emit('updateData', data);
      });
    
      socket.on('disconnect', () => {
        console.log('user disconnected');
      });
});


app.post('/loginSession', (req, res) => {
    let data = '';
    req.on('data', chunk => {
        data += chunk;
    });
    req.on('end', () => {
        req.session.user = { id: data };
        res.send('Session set');
    });
});

app.post('/logoutSession', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            res.status(500).send({ status: 'error', message: 'Failed to logout' });
        } else {
            res.send({ status: 'logged out' });
        }
    });
});

app.use(checkStaleLocationData);

app.post('/submitLoc', (req, res) => {
    const locationData = {
        from: req.body.from,
        to: req.body.to,
        fromLat: req.body.fromLat,
        fromLon: req.body.fromLon,
        toLat: req.body.toLat,
        toLon: req.body.toLon
    };

    const currentTime = Date.now();
    req.session.locationData = {
        data: locationData,
        timestamp: currentTime
    };

    if (!locationData.from || !locationData.to || !locationData.fromLat || !locationData.fromLon || !locationData.toLat || !locationData.toLon) {
        return res.status(400).json({ status: 'error', message: 'Missing required fields' });
    }

    res.json({ status: 'success' });
});

app.post('/gpsData', (req, res) => {
    let data = '';
    req.on('data', chunk =>{
        data += chunk;
    });

    req.on('end', () => {
        console.log('Received data:', data);
        const [lat, lon,] = data.split(',').map(d => parseFloat(d));

        // Check if there is an active session and "to" location data
        if (req.session.locationData && req.session.locationData.data.toLat && req.session.locationData.data.toLon) {
            const destinationLat = parseFloat(req.session.locationData.data.toLat);
            const destinationLon = parseFloat(req.session.locationData.data.toLon);

            const currentLat = lat;
            const currentLon = lon;

            // Calculate the distance between the current location and the destination
            const distanceToDestination = calculateDistance(currentLat, currentLon, destinationLat, destinationLon);

            // Define a threshold for considering the destination reached
            const destinationThreshold = 0.1; // Adjust as needed

            if (distanceToDestination <= destinationThreshold) {
                // Destination reached, decrement passengerCount
                passengerCount -= 1;
                delete req.session.locationData;
            }
        }

        if(lastGpsData) {
            const distance = calculateDistance(lastGpsData.lat, lastGpsData.lon, lat, lon);
            totalDistance += distance;
        }
        lastGpsData = {lat, lon};

        io.emit('gpsData', {lat, lon,});
        io.emit('totalDistance', totalDistance);
        res.json({ status: 'success' });
    });
});

app.post('/coData', (req, res) => {
    let data = '';
    req.on('data', chunk => {
        data += chunk;
    });

    req.on('end', () => {
        console.log('Recieved data:', data);
        const coConcentration = parseFloat(data);

        io.emit('coData', {coConcentration});
        res.json({ status: 'success' });
    });
});

app.post('/rfidTap', (req, res) => {
    console.log("Received a request");
    let data = '';
    req.on('data', chunk => {
        data += chunk;
    });

    req.on('end', () => {
        console.log("Recieved data:", data);
        const rfid = data;
        
        const ref = db.ref("user");

        ref.once('value').then(snapshot => {
            let found = false;

            snapshot.forEach(childSnapshot => {
                if(childSnapshot.val().rfidHex === rfid) {
                    found = true;
                    return true; 
                }
            });

            if(found) {
                passengerCount += 1;
                io.emit('rfidTapped', {}); // Send a message to the client about the RFID tap
                res.json({ status: 'success' });
            } else {
                res.status(400).json({ status: 'error', message: 'RFID not found' });
            }
        }).catch(error => {
            res.status(500).json({ status: 'error', message: 'An error occurred while checking the RFID' });
        });
    });
});

app.post('/cancelSession', (req, res) => {  
        if(req.session && req.session.locationData) {
            delete req.session.locationData;
            res.send({ status: 'Cancel success' });
        } else {
            res.status(500).send({ status: 'error', message: 'Cancel failed' });
        }
});


app.get('/', (req, res) => {
    res.sendFile('./views/login.html' , {root: __dirname});
});

app.get('/dashboard', ensureAuthenticated, async (req, res) => {
    try{
        const studentid = req.session.user.id;
        const ref = db.ref("user/" + studentid);

        ref.once("value", (snapshot) => {
            const userData = snapshot.val();
            const rfidData = userData.rfidHex;

            if(userData){
                res.render('dashboard', { user: userData, passengers: passengerCount, coConcentration: coConcentration });
            }
            else{
                res.redirect('/')
            }
        });
    }
    catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).send("Error fetching user data");
    }
});

server.listen(PORT, () => {
    console.log('Server is running on' + PORT);
});
