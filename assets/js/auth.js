// listen for auth status changes
auth.onAuthStateChanged(user => {
    if (user) {
        window.open("./lights.html", "_parent", "");
    }
});

// login
const loginForm = document.querySelector('#login-form');
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // get user info
    const email = loginForm['user-mail'].value;
    const password = loginForm['user-password'].value;

    // log the user in
    auth.signInWithEmailAndPassword(email, password).then((cred) => {
        loginForm.reset();
    });
});