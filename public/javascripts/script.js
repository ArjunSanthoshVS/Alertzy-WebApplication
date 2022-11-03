

//SIGNUP DATA VALIDATING
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

//VALIDATING LOGIN DATA
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

//MODAL LOGIN
$("#login-form").submit((e) => {
    e.preventDefault();
    const email = document.getElementById('email');
    const pass = document.getElementById('password');
    const error = document.getElementsByClassName('invalid-feedback');

    if (!(email.value.trim().match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/))) {
        error[0].style.display = "block";
        error[0].innerHTML = "Enter email";
        email.style.border = "2px solid red";
        return false;
    } else {
        error[0].innerHTML = ""
        email.style.border = "2px solid none";
    }

    if (pass.value.trim() === "") {
        error[1].style.display = "block";
        error[1].innerHTML = "Enter password";
        pass.style.border = "2px solid red";
        return false;
    } else {
        error[1].innerHTML = ""
        pass.style.border = "2px solid none";
    }
    console.log('Its not workinggggggggggggggg.............');
    $.ajax({
        url: '/modal-login',
        type: 'post',
        data: $('#login-form').serialize(),
        success: (response) => {
            console.log(response);
            if (response.status) {
                location.reload()
            } else {
                error[0].style.display = "block";
                error[0].innerHTML = "No user found! Enter valid email & password";
                email.style.border = "2px solid red";
            }
        }
    })
})

//VALIDATING ADMIN LOGIN
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


//VALIDATING OTP DETAILS
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

//IMAGE ZOOM
var options = {
    width: 300,
    zoomWidth: 900,
    offset: { vertical: 60, horizontal: 20 },
    scale: .5
};
new ImageZoom(document.getElementById("img-container"), options);

//ADD TO CART AJAX
function addToCart(prodId) {
    $.ajax({
        url: '/add-to-cart/' + prodId,
        method: 'get',
        success: (response) => {
            if (response.status) {
                let count = $('#cart-count').html()
                count = parseInt(count) + 1
                $("#cart-count").html(count)
                //popup
                document.getElementById('success').classList.remove('d-none')
                setTimeout(function () {
                    document.getElementById('success').classList.add('d-none')
                }, 1000)
            } else {
                location.href = '/login'
            }
        }
    })
}

//ADD TO WISHLIST
function addToWishlist(prodId) {
    $.ajax({
        url: '/add-to-wishlist/' + prodId,
        method: 'get',
        success: (response) => {
            if (response.status) {
                document.getElementById('add' + prodId).classList.add('d-none')
                document.getElementById('remove' + prodId).classList.remove('d-none')

            } else {
                document.getElementById('remove' + prodId).classList.add('d-none')
                document.getElementById('add' + prodId).classList.remove('d-none')
            }
        }
    })
}
//ADMIN ORDER STATUS
function statusChange(proId, orderId) {
    var status = document.getElementById(proId + orderId).value;
    swal({
        title: "Are you sure?",
        text: "Do you want to " + status + " the order",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "Yes, " + status + " it!",
        cancelButtonText: "No!",
        closeOnConfirm: true,
        closeOnCancel: true
    },
        function (isConfirm) {
            if (isConfirm) {
                $.ajax({
                    url: '/admin/order-status',
                    data: {
                        orderId,
                        status
                    },
                    method: 'post',
                    success: (response) => {
                        if (response.status) {
                            document.getElementById(orderId + proId).innerHTML = status
                            if (status == 'pending' || status == 'placed' || status == 'shipped' || status == 'delivered' || status == 'canceled') {
                                location.reload()
                            }
                        }
                    }
                })
            } else {
                location.reload()
            }
        }
    );
}

//USER ORDER CANCEL
function cancelOrder(orderId, proId) {
    swal({
        title: "Are you sure?",
        text: "Do you want to cancel the order",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "Yes, Cancel my order",
        cancelButtonText: "No, cancel please!",
        closeOnConfirm: true,
        closeOnCancel: true
    },
        function (isConfirm) {
            if (isConfirm) {
                $.ajax({
                    url: '/cancel-order/' + orderId,
                    method: 'get',
                    success: (response) => {
                        if (response.status) {
                            location.reload()
                            // document.getElementById(orderId + proId).innerHTML = 'canceled'
                            // document.getElementById("status-button").style.display = 'none'
                        }
                    }
                })
            }
        }
    );
}

//DELETE ADDRESS
// function deleteAddress(addressId) {
//     $.ajax
//         ({
//             url: '/delete-address',
//             method: 'get',
//             data: {
//                 addressId
//             },
//             success: (response) => {
//                 location.reload()
//             }
//         })
// }

//SALES REPORT
function salesReport(days, buttonId) {

    $.ajax({
        url: '/admin/sales-report/' + days,
        method: 'get',
        success: (response) => {
            if (response) {
                const buttons = document.querySelectorAll('button');
                buttons.forEach(button => {
                    button.classList.remove('active');
                });
                document.getElementById(buttonId).classList.add("active");
                document.getElementById('days').innerHTML = buttonId
                document.getElementById('deliveredOrders').innerHTML = response.deliveredOrders
                document.getElementById('shippedOrders').innerHTML = response.shippedOrders
                document.getElementById('placedOrders').innerHTML = response.placedOrders
                document.getElementById('canceledOrders').innerHTML = response.canceledOrders
                document.getElementById('cashOnDelivery').innerHTML = response.cashOnDelivery
                document.getElementById('onlinePayment').innerHTML = response.onlinePayment
                document.getElementById('users').innerHTML = response.users
            }
        }
    })
}

//PDF AND EXCEL
$(document).ready(function ($) {
    $(document).on('click', '.btn_print', function (event) {
        event.preventDefault();
        var element = document.getElementById('container_content');

        let randomNumber = Math.floor(Math.random() * (10000000000 - 1)) + 1;

        var opt =
        {
            margin: 0,
            filename: 'pageContent_' + randomNumber + '.pdf',
            html2canvas: { scale: 10 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    });
});

function export_data() {
    let data = document.getElementById('container_content');
    var fp = XLSX.utils.table_to_book(data, { sheet: 'vishal' });
    XLSX.write(fp, {
        bookType: 'xlsx',
        type: 'base64'
    });
    XLSX.writeFile(fp, 'test.xlsx');
}

//DASHBOARD CHART
// window.addEventListener('load', () => {
//     histogram(1, 'daily')
// })
// function histogram(days, buttonId) {
//     $.ajax({
//         url: '/admin/dashboard/' + days,
//         method: 'get',
//         success: (data) => {
//             if (data) {
//                 const buttons = document.querySelectorAll('button')
//                 buttons.forEach(button => {
//                     button.classList.remove('active')
//                 })
//                 document.getElementById(buttonId).classList.add('active')
//                 let totalOrder = data.deliveredOrders + data.shippedOrders + data.placedOrders
//                 console.log(totalOrder);
//                 document.getElementById('totalOrders').innerHTML = totalOrder
//                 document.getElementById('totalAmount').innerHTML = data.totalAmount

//                 var xValues = ["Pending", "Placed", "Shipped", "Delivered", "Cancelled"];
//                 var yValues = [data.pendingOrders, data.placedOrders, data.shippedOrders, data.deliveredOrders, data.canceledOrders];
//                 var barColors = ["red", "green", "blue", "orange", "brown"];
//                 new Chart("order", {
//                     type: "bar",
//                     data: {
//                         labels: xValues,
//                         datasets: [{
//                             backgroundColor: barColors,
//                             data: yValues
//                         }]
//                     }, options: {
//                         legend: { display: false },
//                         title: {
//                             display: true,
//                             text: "Orders"
//                         }
//                     }
//                 });

//             }
//         }
//     })
// }


window.addEventListener('load', () => {
    histogram(1, 'daily')
})


function histogram(days, buttonId) {

    $.ajax({
        url: '/admin/dashboard/' + days,
        method: 'get',
        success: (response) => {
            if (response) {
                const buttons = document.querySelectorAll('button');
                buttons.forEach(button => {
                    button.classList.remove('active');
                });
                document.getElementById(buttonId).classList.add("active");

                let totalOrder = response.deliveredOrders + response.shippedOrders + response.placedOrders

                document.getElementById('totalOrders').innerHTML = totalOrder
                document.getElementById('totalAmount').innerHTML = response.totalAmount

                var xValues = ["Delivered", "Shipped", "Placed", "Pending", "Canceled"];
                var yValues = [response.deliveredOrders, response.shippedOrders, response.placedOrders, response.pendingOrders, response.canceledOrders];
                var barColors = ["green", "blue", "orange", "brown", "red"];

                new Chart("order", {
                    type: "bar",
                    data: {
                        labels: xValues,
                        datasets: [{
                            backgroundColor: barColors,
                            data: yValues
                        }]
                    },
                    options: {
                        legend: { display: false },
                        title: {
                            display: true,
                            text: "Order Report"
                        }
                    }
                });


                var xValues = ["COD", "ONLINE"];
                var yValues = [response.codTotal, response.onlineTotal];

                var barColors = [
                    "#b91d47",
                    "#00aba9",
                ];

                new Chart("payment", {
                    type: "pie",
                    data: {
                        labels: xValues,
                        datasets: [{
                            backgroundColor: barColors,
                            data: yValues
                        }]
                    },
                    options: {
                        title: {
                            display: true,
                            text: "Payment Report"
                        }
                    }
                });



                // var xValues = [50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150];
                // var yValues = [0, response.users];

                // new Chart("user", {
                //     type: "line",
                //     data: {
                //         // labels: xValues,
                //         datasets: [{
                //             fill: true,
                //             lineTension: 0,
                //             // backgroundColor: "rgba(0,0,255,1.0)",
                //             borderColor: "rgba(0,0,255,0.1)",
                //             data: yValues
                //         }]
                //     },
                //     options: {
                //         legend: { display: false },
                //         scales: {
                //             yAxes: [{ ticks: { min: 0, max: 10 } }],
                //         },
                //         title: {
                //             display: true,
                //             text: "Users Signed"
                //         }
                //     }
                // });
            }
        }
    })
}

//PRODUCT OFFER
// $("#product-offer").submit((e) => {
//     e.preventDefault();
//     $.ajax({
//         url: '/admin/offer-management/product-offer',
//         type: 'post',
//         data: $('#product-offer').serialize(),
//         success: (response) => {
//             console.log(response);
//             location.reload()
//         }
//     })
// })