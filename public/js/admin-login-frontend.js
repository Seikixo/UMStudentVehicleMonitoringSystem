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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

document.getElementById("login-admin").addEventListener('click', async function(e) {
    e.preventDefault();

    const adminid = document.getElementById("adminid").value;
    const adminpass = document.getElementById("adminpass").value;

    try {
        const snapshot = await get(ref(db, 'admin/' + adminid));
        if (snapshot.exists()) {
            const userData = snapshot.val();
            if (userData.adminpass === adminpass) {
                const response = await fetch('/adminSession', { method: 'POST', body: adminid});
                if(response.ok) {
                    alert("WELCOME ADMIN!");
                    window.location.href = "/admin";                 
                }
                else {
                    alert("Error setting session");
                }
            }
            else {
                alert("Incorrect password!"); 
            }
        }
        else {
            alert("User does not exists!");
        }
    } catch (error) {
        console.error("Error checking credentials: ", error);
        alert("Error checking credentials!");
    }
});