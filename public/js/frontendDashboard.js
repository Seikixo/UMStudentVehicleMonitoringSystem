//Logout
document.getElementById('logout').addEventListener('click', async function() {
    try {
        const response = await fetch('/logoutSession', { method: 'POST' });
        const data = await response.json();
        if (data.status === 'logged out') {
            window.location.href = "/";
        } else {
            alert("Failed to log out!");
        }
    } catch (error) {
        console.error("Error logging out: ", error);
        alert("Error logging out!");
    }
});

//About
const openAbout = document.querySelector('.about');
const aboutModal = document.querySelector('.about-modal');
const closeAbout = document.getElementsByClassName('close-about')[0];

openAbout.addEventListener('click',()=>{   
    aboutModal.style.display = "block";
});

closeAbout.onclick = function() {
    aboutModal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target ===  aboutModal) {
        aboutModal.style.display = "none";
    }
}

//Destination
const openDestination = document.querySelector('.destination');
const destinationModal = document.querySelector('.destination-modal');
const closeDestination = document.getElementsByClassName('close-destination')[0];

openDestination.addEventListener('click',()=>{   
    destinationModal.style.display = "block";
});

closeDestination.onclick = function() {
    destinationModal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target ===  destinationModal) {
        destinationModal.style.display = "none";
    }
}

//Burger menu
const menuBtn = document.querySelector('.menu-btn')
const navLinks = document.querySelector('.links')

menuBtn.addEventListener('click',()=>{
    navLinks.classList.toggle('mobile-menu')
})

//Image Slides
var slides = document.querySelectorAll('.slide');
var buttons = document.querySelectorAll('.btn');
let currentSlide = 1;

var manualNav = function(manual){
    slides.forEach((slide) => {
        slide.classList.remove('active');

        buttons.forEach((btn) => {
            btn.classList.remove('active');
        });
    });

    slides[manual].classList.add('active');
    buttons[manual].classList.add('active');
}

buttons.forEach((btn, i) => {
    btn.addEventListener("click", () => {
    manualNav(i);
    currentSlide = i; 
    });
});

var autoNav = function(activeClass){
    let active = document.getElementsByClassName('active');
    let i = 1;

    var repeater = () => {
        setTimeout(function(){

            [...active].forEach((activeSlide) => {
                activeSlide.classList.remove('active');
            });

            slides[i].classList.add('active');
            buttons[i].classList.add('active'); 
            i++
            
            if(slides.length == i){
                i = 0;
            }

            if(i >= slides.length){
                return;
            }

            repeater();
        }, 10000);
    }
    repeater();
}
autoNav();

var socket = io.connect();  

//Vehicle Passenger
socket.on('rfidTapped', (data) => {
    const passengerCount = data.passengerCount;

    const passengerCountElement = document.getElementById('passenger-count');
    if (passengerCountElement) {
        passengerCountElement.textContent = passengerCount;
    }

});

//Distance Traveled
socket.on('totalDistance', (updateDistance) => {
    document.getElementById('distance-display').innerText = updateDistance;  
});

//Air Quality
socket.on('coData', (updateCO) => {
    document.getElementById('co-display').innerText = updateCO;
});

//Map
const map = L.map('map').setView([0, 0], 17);
       
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
maxZoom: 19,
attribution: '© OpenStreetMap'
}).addTo(map); 

const customIcon = L.icon({
    iconUrl: 'img/bus-stop.png',
    iconSize: [75, 80],
    iconAnchor: [41, 88],                       
});

let marker;
let circle;

socket.on('gpsData', (data) => {

    if (marker){
        map.removeLayer(marker);
    }

    if (circle){
        map.removeLayer(circle);
    }

    const latlng = [data.lat, data.lon];
    marker = L.marker(latlng, {icon: customIcon}).addTo(map);
    circle = L.circle(latlng, {
        color: 'red',      
        fillColor: '#FFD700', 
        fillOpacity: 0.5,  
        radius: 30        
    }).addTo(map);
    map.panTo([data.lat, data.lon]);
    map.setView(latlng, 17);
});       

//Peak Hours
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyAMYwrxpJqkVprEhcnCSgU7H3l4yPNKFIc",
    authDomain: "monitoringthesis.firebaseapp.com",
    databaseURL: "https://monitoringthesis-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "monitoringthesis",
    storageBucket: "monitoringthesis.appspot.com",
    messagingSenderId: "790682496758",
    appId: "1:790682496758:web:2dad0d5c6c9e8000dc86d7"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);        

async function fetchLoginData() {
const times = [];
const studentCounts = [];
for (let i = 0; i < 24; i++) { // For every hour of the day
    const hourRef = ref(db, 'login/' + i);
    const snapshot = await get(hourRef);
    times.push(i + ':00');
    studentCounts.push(snapshot.exists() ? snapshot.val() : 0);
}

// Now create the chart with fetched data
const ctx = document.getElementById('myBarChart').getContext('2d');
    new Chart(ctx, {
        type: 'horizontalBar',
        data: {
            labels: times,
            datasets: [{
                label: 'Number of Students',
                data: studentCounts,
                backgroundColor: Array(24).fill('rgba(75, 192, 192, 0.2)'), // Colors for the bars
                borderColor: Array(24).fill('rgba(75, 192, 192, 1)'), // Colors for the bar borders
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 40 
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Students'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Time per Hour'
                    }
                }
            }
            
        }
    });
}
fetchLoginData();