function signUpValidate() {
    // const userName=document.getElementById('username')
    const number = document.getElementById('number')
    const email = document.getElementById('email')
    const password = document.getElementById('password')
    const repassword = document.getElementById('repassword')
    const error = document.getElementsByClassName('invalid-feedback')

    // if (userName.value.trim() === "" || userName.value.trim().match(/^[0-9]+$/)) {
    //     error[0].style.display = "block";
    //     error[0].innerHTML = "please enter valid username"
    //     userName.style.border = "2px solid red";
    //     return false;
    // } else {
    //     error[0].innerHTML = ""
    //     userName.style.border = "2px solid green";
    // }



    if (number.value.trim() === "" || number.value.length < 9) {
        error[0].style.display = "block";
        error[0].innerHTML = "Enter valid phone number";
        number.style.border = "2px solid red";
        return false;
    } else {
        error[0].innerHTML = ""
        number.style.border = "2px solid green";
    }

    if (!(email.value.trim().match(/^[a-zA-Z0-9.!#$%&'+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)$/))) {
        error[1].style.display = "block";
        error[1].innerHTML = "Enter correct email";
        email.style.border = "2px solid red";
        return false;
    } else {
        error[1].innerHTML = ""
        email.style.border = "2px solid green";
    }

    if (password.value.trim() === "" || password.value.length < 8) {
        error[2].style.display = "block";
        error[2].innerHTML = "password must be 8 character";
        password.style.border = "2px solid red";
        return false;
    } else {
        error[2].innerHTML = ""
        password.style.border = "2px solid green";
    }



    if (repassword.value === password.value) {
        error[3].innerHTML = ""
        repassword.style.border = "2px solid green";
    } else {
        error[3].style.display = "block";
        error[3].innerHTML = "Incorrect Password";
        repassword.style.border = "2px solid red";
        return false;
    }
    return true;
}

function logInValidate() {
    const email = document.getElementById('email')
    const password = document.getElementById('password')
    const error = document.getElementsByClassName('invalid-feedback')

    if (!(email.value.trim().match(/^[a-zA-Z0-9.!#$%&'+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)$/))) {
        error[0].style.display = "block";
        error[0].innerHTML = "Enter email";

        return false;
    } else {
        error[0].innerHTML = ""
        email.style.border = "2px solid none";
    }

    if (password.value.trim() === "") {
        error[1].style.display = "block";
        error[1].innerHTML = "Enter password";

        return false;
    } else {
        error[1].innerHTML = ""

    }

    return true;
}

function otpValidation() {
    let otp = document.getElementById('otp');
    let err = document.getElementsByClassName('error')

    if (otp.value.trim() === "" || otp.value.length === 5) {
        err.style.display = "block";
        err.innerHTML = "Enter OTP";
        return false;
    } else {
        err.innerHTML = ""
    }
    return true;
}

var options = {
    width: 300,
    zoomWidth: 900,
    offset: { vertical: 60, horizontal: 20 },
    scale: .5
};
new ImageZoom(document.getElementById("img-container"), options);