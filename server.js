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
const { error } = require('console');

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
    secret: 'z9f3fdjgghdsn',  
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }  
}));

app.use(express.json());
app.use(express.static('layout'));
app.use(express.static('public'));
app.set('view engine', 'ejs');


function ensureAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        next();  
    } else {
        res.redirect('/');  
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

const passengerCountRef = db.ref("passengerCount");

io.on('connection', (socket) => {
    console.log('User connected');
    socket.emit('totalDistance', totalDistance);

    passengerCountRef.once('value', (snapshot) => {
        const currentCount = snapshot.val() || 0;
        socket.emit('rfidTapped', { passengerCount: currentCount });
    });

    socket.on('disconnect', () => {
    console.log('User disconnected');
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

app.post('/gpsData', (req, res) => {
    let data = '';
    req.on('data', chunk =>{
        data += chunk;
    });

    req.on('end', () => {
        console.log('Received data:', data);
        const [lat, lon,] = data.split(',').map(d => parseFloat(d));

        if(lastGpsData) {
            const distance = calculateDistance(lastGpsData.lat, lastGpsData.lon, lat, lon);
            totalDistance += distance;
        }
        lastGpsData = {lat, lon};

        io.emit('gpsData', {lat, lon,});
        io.emit('totalDistance', totalDistance);
        res.json({ status: 'GPS success' });
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

        io.emit('coData', coConcentration);
        res.json({ status: 'CO success' });
    });
});

app.post('/rfidTap', (req, res) => {
    console.log("Received a request");
    let data = '';
    req.on('data', chunk => {
        data += chunk;
    });

    const dbRef = db.ref("user");
    const passengerCountRef = db.ref("passengerCount");

    req.on('end', () => {
        console.log("Received data:", data);
        const receivedRfid = data;

        dbRef.once('value', snapshot => {
            let found = false;
    
            snapshot.forEach(childSnapshot => {
                const user = childSnapshot.val();

                if(user.rfidHex === receivedRfid) {
                    found = true;
                    const userId = childSnapshot.key;
                    const userRef = dbRef.child(userId);
    
                    // Retrieve the current passenger count
                    passengerCountRef.once('value', countSnapshot => {
                        let passengerCount = countSnapshot.val() || 0;
    
                        if (user.isRiding) {
                            // User is stepping out of the vehicle
                            passengerCount = Math.max(0, passengerCount - 1);
                            userRef.update({ isRiding: false });
                        } else {
                            // User is riding the vehicle
                            userRef.child('rideCount').transaction((rideCount) => {
                                return (rideCount || 0) + 1;
                            });  
                            passengerCount += 1;                           
                            userRef.update({ isRiding: true });
                        }
    
                        // Update the passenger count in Firebase
                        passengerCountRef.set(passengerCount);
    
                        // Emit the updated passenger count
                        io.emit('rfidTapped', { passengerCount: passengerCount, isRiding: user.isRiding }); 
                        res.json({ status: 'RFID success', passengerCount: passengerCount, isRiding: user.isRiding });
                    });
    
                    return true; 
                }
            });    
            if (!found) {
                res.status(400).json({ status: 'error', message: 'RFID not found' });
            }
        }).catch(error => {
            res.status(500).json({ status: 'error', message: 'An error occurred while checking the RFID' });
        });    
    });
});

app.get('/', (req, res) => {
    res.render('login');
});

app.get('/dashboard', ensureAuthenticated, async (req, res) => {
    try{
        const studentid = req.session.user.id;
        const ref = db.ref("user/" + studentid);

        ref.once("value", (snapshot) => {
            const userData = snapshot.val();
            const rideCount = userData.rideCount;

            if(userData){
                res.render('dashboard', { user: userData, rideCount: rideCount });
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
