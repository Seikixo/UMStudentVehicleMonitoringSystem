require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const PORT = process.env.PORT || 8081;

const admin = require('firebase-admin');
const { error } = require('console');

let lastGpsData1 = null;
let totalDistance1 = 0;
let coConcentration1 = null;
let lastUpdateTime1 = Date.now();

let lastGpsData2 = null;
let totalDistance2 = 0;
let coConcentration2 = null;
let lastUpdateTime2 = Date.now();

const places = [
    { name: 'FEA Building', lat: 7.06525551064501, lon: 125.59501217086209 },
    { name: 'BE Building', lat: 7.065487090855532, lon: 125.59622452928257 },
    { name: 'GET Building', lat: 7.0674072029982735, lon: 125.59653069205753 }, 
    { name: 'DPT Building', lat: 7.068249571701043, lon: 125.59571354849236 },
    { name: 'Matina Gate', lat: 7.065088643761288, lon: 125.59814362983917 },
    { name: 'PS Building', lat: 7.068326470685302, lon: 125.59466790296308 },
    { name: 'Maa Gate', lat: 7.067525260806721, lon: 125.59197362402965 },
  ];

admin.initializeApp({
    credential: admin.credential.cert({
        type: "service_account",
        project_id: "monitoringthesis",
        private_key_id: "bf974f7aab9aac67c0da87cb2d54ed889e0a05ed",
        private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC+hxFADb4FjkI1\ny8a4HG5wLMz/0OaKQPI0Y1OBstwB8RxPeL5fPJK5C2+TnGtazZioEeim7uCkKoJM\nz8q/pm91ab13TXvZ8K2FBwU3sBij4NnQiB3lNwcXjxSfCws854Ch+Di/fK6yNBFM\nT9xGKbM9LDhJActzUj5+ampE3pwCrVwbeFkZSRxM/qanDsLBKAarWwrQ2ild1XB1\nBjtDnTNScWocKm/06UgY03S7Ela8b6k9Y43PbSnwxjBq3E5NybcVoV6hr43NP4Ub\nSHB12lTKrPDDH00dp+RR9OgkN6PqxA4N1cbq+jyb2TfDazJiFYk8gL+fBNkUmrkh\nOQM+lW6PAgMBAAECggEAFVkuYPj+jmzO6mw3i1r+3OmIMYSHcH0FJphCkR5+HGbs\nfyh5Bv7TNJIddx1obLeWIARHB1LDhQw7pr5Zv3kMtXabA4qBEtMu/jWNK3I7MJGk\nllh00RbbX+kTrHEhBJAED8yvvx+0thmzc9OMS6hR1yGPT6Q4gbwjbdLKrtuAAPnt\n4uB+P01OgyM12HQHAS2CWVUL9gH2Gl/bWUr8m+/UyhrwXk7CQILp1EKeyiICGRTZ\nIcAEOyMthElASPt0nIGpuAnBwmbsElVaDkwNqV7Dsc4Jiw1MIG88+Y+uLG9iWal+\n6N9l2Ihn9Ub3/ctJxiQzfoU9KUEDH69VjpRast2BQQKBgQD8y1+sGw6p9rVfb1PA\nhTq7UHMoRoCAXgrNk2n9p4xDTOom/cGeoGk8kk86LzHBpsrcONrZ4JVmSsav4T4Q\nfHoH+gpZ78Y5dzDkcybNexERGOt8nPEVVm1YdnMYgkrKUDRml9wqd0kr0ydmZPIX\naN1KNtJGgk2aRBrVNXSfkEo8cQKBgQDA8Y/W/yxqX4XJbPrqz8S7ZN/AgIWg2mXr\nVHqjNeIa1XO/FujnG+/2Q/Y2bgIKmYbh2BSRbSHJkgHaTz7lzh4gU0U9fZJ2D8Xq\ngXpNeQRCcVdD0PkMO9/VevzJ41FRHoGA8Aa3n4P1+Y+5usPdFEvf0zMe63ZGBKLw\n5Hj5YVva/wKBgQC0ptmd8lAOYgHHS5V8dTk9dwZ0d72I/quVsY0C+eMgjSyf5KOj\nKltKL/xyRhu2me1KZ07ueLILQdCvC7YArhO+847GKrVrh6Pm/ety2EmgAED48mbO\nqs7FcxBZKXMtFRf9YPSzXD9sFB+J6wWeeQ/64yZtwNyYK6dJSkQna0PB4QKBgGdC\nYJrNofWj/bPZMUhtvXoU+HLL1bhKafVSFvg2JDX8Op/wIOFe4EPKB4EFyu3lUHyZ\n6hgScdyw2XD+rEjM0O634fyQscuhkWh5tvyzYYY1pmBS/JaBjL9xvMxHbgOd8e0R\niGbJZhREZZkezSgKbrjxDRDlLz01ygZmICBG7KP9AoGBAIwgy4+hA3LdOTOq/9YR\nxtqVzr4sE7CA1pkZtH3xbPNrZze3SMq0KihjyzeWFtvycBbYdpXQWJKoBDu705hT\nd8T5a0JvL/DPfREWtODc7giU8nhVih39LIrB5Z9IWwNZjRh12cJh+10bMtiVVFM5\nXLn8x426fuju1EU0XpeGc5qn\n-----END PRIVATE KEY-----\n",
        client_email: "firebase-adminsdk-p0kb9@monitoringthesis.iam.gserviceaccount.com",
        client_id: "105095020168626548225",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-p0kb9%40monitoringthesis.iam.gserviceaccount.com"
    }),
  databaseURL: "https://monitoringthesis-default-rtdb.asia-southeast1.firebasedatabase.app" 
});

const db = admin.database();

app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET,  
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }  
}));

app.use(express.json());
app.use(express.static('layout'));
app.use(express.static('public'));
app.set('view engine', 'ejs');

async function fetchLoginDataFromDatabase() {
    const times = [];
    const studentCounts = [];
    for (let i = 0; i < 24; i++) { // For every hour of the day
        const hourRef = db.ref('login/' + i);
        const snapshot = await hourRef.once('value');
        times.push(i + ':00');
        studentCounts.push(snapshot.exists() ? snapshot.val() : 0);
    }
    return { times, studentCounts };
}

async function fetchVehicle1Data() {
    try {
        const snapshot = await db.ref('vehicle1Traveled').once('value');
        return snapshot.val() || {};
    } catch (error) {
        console.error('Error fetching vehicle 1 data:', error);
        throw error;
    }
}

async function fetchVehicle2Data() {
    try {
        const snapshot = await db.ref('vehicle2Traveled').once('value');
        return snapshot.val() || {};
    } catch (error) {
        console.error('Error fetching vehicle 2 data:', error);
        throw error;
    }
}

function ensureAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        next();  
    } 
    else {
        res.redirect('/');  
    }
}

function ensureAuthAdmin(req, res, next) {
    if (req.session && req.session.admin) {
        next();
    } 
    else {
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

const passengerCountRef1 = db.ref("passengerCount1");
const passengerCountRef2 = db.ref("passengerCount2");
const userRef = db.ref("user");

io.on('connection', (socket) => {
    console.log('User connected');

    socket.emit('totalDistance1', totalDistance1);
    socket.emit('totalDistance2', totalDistance2);

    userRef.once('value', (snapshot) => {
        const data = snapshot.val();
        let totalRideCount = 0;

        Object.values(data || {}).forEach((user) => {
            totalRideCount += user.rideCount || 0;
        });

        const totalVehicleUseRef = db.ref('totalVehicleUse');
        totalVehicleUseRef.set(totalRideCount);

        io.emit('totalRideCountUpdate', totalRideCount);
    });

    passengerCountRef1.once('value', (snapshot) => {
        const currentCount = snapshot.val() || 0;
        socket.emit('rfidTapped1', { passengerCount1: currentCount });
    });

    passengerCountRef2.once('value', (snapshot) => {
        const currentCount = snapshot.val() || 0;
        socket.emit('rfidTapped2', { passengerCount2: currentCount });
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

app.post('/adminSession', (req, res) => {
    let data = '';
    req.on('data', chunk => {
        data += chunk;
    });
    req.on('end', () => {
        req.session.admin = { id: data };
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

app.post('/gpsData1', (req, res) => {
    let data = '';
    req.on('data', chunk => {
        data += chunk;
    });

    req.on('end', () => {
        console.log('Received data:', data);
        const [lat, lon] = data.split(',').map(d => parseFloat(d));
        const currentTime = Date.now();

        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0'); 
        const day = String(currentDate.getDate()).padStart(2, '0');

        const currentDateKey = `${year}-${month}-${day}`;

        if (lastGpsData1 && (currentTime - lastUpdateTime1 >= 10000)) { 
            const distance = calculateDistance(lastGpsData1.lat, lastGpsData1.lon, lat, lon);
            totalDistance1 += distance;
            console.log(`Total Distance: ${totalDistance1} km`);

            lastUpdateTime1 = currentTime;

            db.ref('vehicle1Traveled').once('value', snapshot => {
                if (!snapshot.exists()) {
                    db.ref('vehicle1Traveled').set({});
                }
            });

            const adjustedDistance1 = (totalDistance1 * 10).toFixed(3);
            db.ref(`vehicle1Traveled/${currentDateKey}`).set(adjustedDistance1);

            io.emit('totalDistance1', adjustedDistance1);
        }

        lastGpsData1 = { lat, lon };
        io.emit('gpsData1', { lat, lon });
        res.json({ status: 'GPS success', totalDistance1 });
    });
});

app.post('/gpsData2', (req, res) => {
    let data = '';
    req.on('data', chunk => {
        data += chunk;
    });

    req.on('end', () => {
        console.log('Received data:', data);
        const [lat, lon] = data.split(',').map(d => parseFloat(d));
        const currentTime = Date.now(); 

        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0'); 
        const day = String(currentDate.getDate()).padStart(2, '0');

        const currentDateKey = `${year}-${month}-${day}`;

        if (lastGpsData2 && (currentTime - lastUpdateTime2 >= 10000)) { 
            const distance = calculateDistance(lastGpsData2.lat, lastGpsData2.lon, lat, lon);
            totalDistance2 += distance;
            console.log(`Total Distance: ${totalDistance2} km`);

            lastUpdateTime2 = currentTime;

            db.ref('vehicle2Traveled').once('value', snapshot => {
                if (!snapshot.exists()) {
                    db.ref('vehicle2Traveled').set({});
                }
            });

            const adjustedDistance2 = (totalDistance2 * 10).toFixed(3);
            db.ref(`vehicle2Traveled/${currentDateKey}`).set(adjustedDistance2);
  
            io.emit('totalDistance2', adjustedDistance2);
        }

        lastGpsData2 = { lat, lon };
        io.emit('gpsData2', { lat, lon });
        res.json({ status: 'GPS success', totalDistance2 });
    });
});

app.post('/coData1', (req, res) => {
    let data = '';
    req.on('data', chunk => {
        data += chunk;
    });

    req.on('end', () => {
        console.log('Recieved data:', data);
        const coConcentration1 = parseFloat(data);

        io.emit('coData1', coConcentration1);
        res.json({ status: 'CO success' });
    });
});

app.post('/coData2', (req, res) => {
    let data = '';
    req.on('data', chunk => {
        data += chunk;
    });

    req.on('end', () => {
        console.log('Recieved data:', data);
        const coConcentration2 = parseFloat(data);

        io.emit('coData2', coConcentration2);
        res.json({ status: 'CO success' });
    });
});

app.post('/rfidData1', (req, res) => {
    console.log("Received a request");
    let data = '';
    req.on('data', chunk => {
        data += chunk;
    });

    const dbRef = db.ref("user");
    const passengerCountRef = db.ref("passengerCount1");

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
    
                    passengerCountRef.once('value', countSnapshot => {
                        let passengerCount1 = countSnapshot.val() || 0;
    
                        if (user.isRiding) {
                            passengerCount1 = Math.max(0, passengerCount1 - 1);
                            userRef.update({ isRiding: false });
                        } else {
                            userRef.child('rideCount').transaction((rideCount) => {
                                return (rideCount || 0) + 1;
                            });  
                            passengerCount1 += 1;                           
                            userRef.update({ isRiding: true });
                        }
    
                        passengerCountRef.set(passengerCount1);
    
                        io.emit('rfidTapped1', { passengerCount1: passengerCount1, isRiding: user.isRiding }); 
                        res.json({ status: 'RFID success', passengerCount1: passengerCount1, isRiding: user.isRiding });
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

app.post('/rfidData2', (req, res) => {
    console.log("Received a request");
    let data = '';
    req.on('data', chunk => {
        data += chunk;
    });

    const dbRef = db.ref("user");
    const passengerCountRef = db.ref("passengerCount2");

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
    
                    passengerCountRef.once('value', countSnapshot => {
                        let passengerCount2 = countSnapshot.val() || 0;
    
                        if (user.isRiding) {
                            passengerCount2 = Math.max(0, passengerCount2 - 1);
                            userRef.update({ isRiding: false });
                        } else {
                            userRef.child('rideCount').transaction((rideCount) => {
                                return (rideCount || 0) + 1;
                            });  
                            passengerCount2 += 1;                           
                            userRef.update({ isRiding: true });
                        }
                   
                        passengerCountRef.set(passengerCount2);
                           
                        io.emit('rfidTapped2', { passengerCount2: passengerCount2, isRiding: user.isRiding }); 
                        res.json({ status: 'RFID success', passengerCount2: passengerCount2, isRiding: user.isRiding });
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

app.get('/student', ensureAuthenticated, async (req, res) => {
    try{
        const studentid = req.session.user.id;
        const ref = db.ref("user/" + studentid);

        ref.once("value", (snapshot) => {
            const userData = snapshot.val();
            const isRiding = userData.isRiding;

            if(userData){
                res.render('student', { user: userData, isRiding: isRiding });
            }
            else{
                res.redirect('/');
            }
        });
    }
    catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).send("Error fetching user data");
    }
});

app.get('/admin', ensureAuthAdmin, async (req, res) => {
    try {
        const adminid = req.session.admin.id;
        const ref = db.ref("admin/" + adminid);

        ref.once("value", (snapshot) => {
            const userData = snapshot.val();
            if (userData){
                res.render('admin', { admin: userData});
            }
            else{
                res.redirect('/');
            }
        });
    }
    catch {
        console.error("Error fetching user data:", error);
        res.status(500).send("Error fetching user data");
    }
});

app.get('/login-data', async (req, res) => {
    try {
        const loginData = await fetchLoginDataFromDatabase();
        res.json(loginData);
    } catch (error) {
        console.error("Error fetching login data:", error);
        res.status(500).send("Error fetching login data");
    }
});

app.get('/vehicle1-data', async (req, res) => {
    try{
        const vehicle1Data = await fetchVehicle1Data();
        res.json({vehicle1Data});
    } catch (error) {
        console.error("Error fetching vehicle1 data", error);
        res.status(500).send("Error fetching vehicle1 data");
    }
});

app.get('/vehicle2-data', async (req, res) => {
    try{
        const vehicle2Data = await fetchVehicle2Data();
        res.json({vehicle2Data});
    } catch (error) {
        console.error("Error fetching vehicle1 data", error);
        res.status(500).send("Error fetching vehicle2 data");
    }
});

app.get('/places', (req, res) => {
    res.json(places);
  });

server.listen(PORT, () => {
    console.log('Server is running on' + PORT);
});
