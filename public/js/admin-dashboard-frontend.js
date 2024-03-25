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
socket.on('rfidTapped1', (updateRfid1) => {
    const passengerCount = updateRfid1.passengerCount1;

    const passengerCountElement = document.getElementById('passenger-count1');
    if (passengerCountElement) {
        passengerCountElement.textContent = passengerCount;
    }

});

socket.on('rfidTapped2', (updateRfid2) => {
    const passengerCount = updateRfid2.passengerCount2;

    const passengerCountElement = document.getElementById('passenger-count2');
    if (passengerCountElement) {
        passengerCountElement.textContent = passengerCount;
    }

});

//Distance Traveled
socket.on('totalDistance1', (updateDistance1) => {
    document.getElementById('distance-display1').innerText = updateDistance1;  
});

socket.on('totalDistance2', (updateDistance2) => {
    document.getElementById('distance-display2').innerText = updateDistance2;  
});

//Air Quality
socket.on('coData1', (updateCO1) => {
    document.getElementById('co-display1').innerText = updateCO1;
});

socket.on('coData2', (updateCO2) => {
    document.getElementById('co-display2').innerText = updateCO2;
});

socket.on('totalRideCountUpdate', (totalRideCount) => {
    document.getElementById('total-display').innerText = totalRideCount;
});

//Map
const map1 = L.map('map1').setView([0, 0], 17);
const map2 = L.map('map2').setView([0, 0], 17);
       
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
maxZoom: 19,
attribution: '© OpenStreetMap'
}).addTo(map1); 

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
maxZoom: 19,
attribution: '© OpenStreetMap'
}).addTo(map2); 

const customeIcon1 = L.icon({
    iconUrl: 'img/bus-stop.png',
    iconSize: [40, 41],
    iconAnchor: [20, 50],                      
});

const customeIcon2 = L.icon({
    iconUrl: 'img/bus-stop.png',
    iconSize: [40, 41],
    iconAnchor: [20, 50],                       
});

let marker1;
let circle1;
let marker2;
let circle2;

socket.on('gpsData1', (data) => {

    if (marker1){
        map1.removeLayer(marker1);
    }

    if (circle1){
        map1.removeLayer(circle1);
    }

    const latlng = [data.lat, data.lon];
    marker1 = L.marker(latlng, {icon: customeIcon1}).addTo(map1);
    circle1 = L.circle(latlng, {
        color: 'red',      
        fillColor: '#FFD700', 
        fillOpacity: 0.5,  
        radius: 10        
    }).addTo(map1);

    const focusVehicle1 = document.querySelector('.focus-vehicle1');
    focusVehicle1.addEventListener('click', ()=>{
        map1.panTo([data.lat, data.lon]);
        map1.setView(latlng, 17);
    });

});

socket.on('gpsData2', (data) => {

    if (marker2){
        map2.removeLayer(marker2);
    }

    if (circle2){
        map2.removeLayer(circle2);
    }

    const latlng = [data.lat, data.lon];
    marker2 = L.marker(latlng, {icon: customeIcon2}).addTo(map2);
    circle2 = L.circle(latlng, {
        color: 'yellow',      
        fillColor: '#C70039', 
        fillOpacity: 0.5,  
        radius: 10        
    }).addTo(map2);

    const focusVehicle2 = document.querySelector('.focus-vehicle2');
    focusVehicle2.addEventListener('click', ()=>{
        map2.panTo([data.lat, data.lon]);
        map2.setView(latlng, 17);
    });
}); 

//University Markers
async function addPlacesToMap() {
    const response = await fetch('/places');
    const places = await response.json();

    places.forEach(place => {
      const { name, lat, lon } = place;

      const marker1 = L.marker([lat, lon]).addTo(map1);
      const marker2 = L.marker([lat, lon]).addTo(map2);
      
      const popupContent = `<b>${name}</b>`;
      const popupOptions = { autoClose: false };

      marker1.bindPopup(popupContent, popupOptions).openPopup();
      marker2.bindPopup(popupContent, popupOptions).openPopup();

      const circle1 = L.circle([lat, lon], {
        color: 'blue',
        fillColor: 'lightblue',
        fillOpacity: 0.5,
        radius: 10
      }).addTo(map1);

      const circle2 = L.circle([lat, lon], {
        color: 'blue',
        fillColor: 'lightblue',
        fillOpacity: 0.5,
        radius: 10
      }).addTo(map2);
    });
}

addPlacesToMap();

async function fetchVehicle1Data() {
    try {
        const response = await fetch('/vehicle1-data');
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }

        const { vehicle1Data } = await response.json();
        const container = document.getElementById('vehicle1-traveled');

        container.innerHTML = '';

        for (const [key, value] of Object.entries(vehicle1Data)) {
            const div = document.createElement('div');
            div.textContent = `${key}: ${value}`;
            container.appendChild(div);
        }
    } catch (error) {
        console.error('Error fetching or displaying data:', error);
    }
}

fetchVehicle1Data();

async function fetchVehicle2Data() {
    try {
        const response = await fetch('/vehicle2-data');
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }

        const { vehicle2Data } = await response.json();
        const container = document.getElementById('vehicle2-traveled');

        container.innerHTML = '';

        for (const [key, value] of Object.entries(vehicle2Data)) {
            const div = document.createElement('div');
            div.textContent = `${key}: ${value}`;
            container.appendChild(div);
        }
    } catch (error) {
        console.error('Error fetching or displaying data:', error);
    }
}

fetchVehicle2Data();

//Peak Hours
// Fetching login data from the backend endpoint
async function fetchLoginData() {
    try {
        const response = await fetch('/login-data');
        if (!response.ok) {
            throw new Error('Failed to fetch login data');
        }
        const loginData = await response.json();
        return loginData;
    } catch (error) {
        console.error('Error fetching login data:', error);
        throw error;
    }
}

async function renderLoginData() {
    try {
        const loginData = await fetchLoginData();

        const ctx = document.getElementById('myBarChart').getContext('2d');
        new Chart(ctx, {
            type: 'horizontalBar',
            data: {
                labels: loginData.times,
                datasets: [{
                    label: 'Number of Students',
                    data: loginData.studentCounts,
                    backgroundColor: Array(24).fill('rgba(75, 192, 192, 0.2)'), 
                    borderColor: Array(24).fill('rgba(75, 192, 192, 1)'), 
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
    } catch (error) {
        console.error('Error rendering login data:', error);
    }
}

renderLoginData();
