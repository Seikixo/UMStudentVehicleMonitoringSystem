//Logout
document.getElementById("logout").addEventListener('click', async function() {
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

//Select Destination Form
var socket = io.connect();  

//Vehicle Passenger
socket.on('rfidTapped', (data) => {
    // Assuming 'data' is an object that includes passengerCount
    const passengerCount = data.passengerCount;

    // Update the element in your HTML that displays the count
    const passengerCountElement = document.getElementById('passenger-count');
    if (passengerCountElement) {
        passengerCountElement.textContent = passengerCount;
    }
});

//Distance Traveled
socket.on('totalDistance', (distance) => {
    document.getElementById('distance-display').innerText = `${distance.toFixed(2)} km`;  
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
    iconSize: [85, 90],
    iconAnchor: [42.5, 90],                       
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
    //map.panTo([data.lat, data.lon]);
    map.setView(latlng, 17);
});       