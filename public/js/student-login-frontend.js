// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAMYwrxpJqkVprEhcnCSgU7H3l4yPNKFIc",
    authDomain: "monitoringthesis.firebaseapp.com",
    databaseURL: "https://monitoringthesis-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "monitoringthesis",
    storageBucket: "monitoringthesis.appspot.com",
    messagingSenderId: "790682496758",
    appId: "1:790682496758:web:2dad0d5c6c9e8000dc86d7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

document.getElementById("login-student").addEventListener('click', async function(e) {
    e.preventDefault();

    const studentid = document.getElementById("studentid").value;
    const studentpass = document.getElementById("studentpass").value;

    try {
        const snapshot = await get(ref(db, 'user/' + studentid));
        if (snapshot.exists()) {
            const userData = snapshot.val();
            if (userData.studentpass === studentpass) {
                const response = await fetch('/loginSession', { method: 'POST', body: studentid }); 
                if(response.ok) {   
                    const currentTime = new Date().getHours(); // get the current hour
                    const timeRef = ref(db, 'login/' + currentTime); // create a reference to the specific hour
                    const timeSnapshot = await get(timeRef);
                    let currentCount = timeSnapshot.exists() ? timeSnapshot.val() : 0;
                    await set(timeRef, currentCount + 1);      
                    alert("PLEASE TAP THE SCANNER WHEN ENTERING AND EXITING THE VEHICLE");
                    window.location.href = "/student";                               
                } 
                else {
                    alert("Error setting session.");
                }
            } 
            else {
                alert("Incorrect password!");
            }
        } 
        else {
            alert("User does not exist!");
        }
    } catch (error) {
        console.error("Error checking credentials: ", error);
        alert("Error checking credentials!");
    }
});