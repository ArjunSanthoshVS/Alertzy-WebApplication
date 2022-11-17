//FORM VALIDATION
// Example starter JavaScript for disabling form submissions if there are invalid fields
(() => {
    'use strict'

    // Fetch all the forms we want to apply custiom Bootstrap validation styles to
    const forms = document.querySelectorAll('.needs-validation')

    // Loop over them and prevent submission
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault()
                event.stopPropagation()
            }

            form.classList.add('was-validated')
        }, false)
    })
})()

// //SIGNUP DATA VALIDATING
function signUpValidate() {
    // const userName=document.getElementById('username')
    const number = document.getElementById('number')
    const email = document.getElementById('email')
    const password = document.getElementById('password')
    const repassword = document.getElementById('repassword')
    const error = document.getElementsByClassName('invalid-feedback')

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


//MODAL LOGIN
$("#login-form").submit((e) => {
    e.preventDefault();
    $.ajax({
        url: '/modal-login',
        type: 'post',
        data: $('#login-form').serialize(),
        success: (response) => {
            console.log(response);
            if (response.status) {
                location.reload()
            } else {
                $('#login-Err').text(response.msg)
                $('#email').css('border-color', 'red')
                $('#password').css('border-color', 'red')
            }
        }
    })
})

//VALIDATING ADMIN LOGIN
function adminlogInValidate() {
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
$(document).ready(function () {
    $(".block__pic").imagezoomsl({
        zoomrange: [2, 2]
    });
});

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
function statusChange(prodId, orderId, status) {
    var status = document.getElementById(prodId + orderId).value;
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
                        prodId,
                        orderId,
                        status
                    },
                    method: 'post',
                    success: (response) => {
                        if (response.status) {
                            document.getElementById(orderId + prodId).innerHTML = status
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
function cancelOrder(orderId, prodId) {
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
                    url: '/cancel-order',
                    method: 'put',
                    data: {
                        orderId,
                        prodId
                    },
                    success: (response) => {
                        if (response.status) {
                            location.reload()
                        }
                    }
                })
            }
        }
    );
}


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
                document.getElementById('placedOrders').innerHTML = response.placedOrders
                document.getElementById('deliveredOrders').innerHTML = response.deliveredOrders
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


//DELETE PRODUCT
function deleteProduct(prodId) {
    swal({
        title: "Are you sure?",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "red",
        confirmButtonText: "Yes",
        cancelButtonText: "No",
        closeOnConfirm: false,
        closeOnCancel: true
    },
        function (isConfirm) {
            if (isConfirm) {
                $.ajax({
                    url: '/admin/delete-product/' + prodId,
                    method: 'get',
                    success: (response) => {
                        if (response) {
                            location.reload()
                        }
                    }
                })
            }
        }
    );
}

//DELETE PRODUCT OFFER
function deleteProductOffer(prodId) {
    $.ajax({
        url: '/admin/offer-management/delete-product-offer/' + prodId,
        type: 'post',
        success: (response) => {
            swal({
                title: "Are you sure?",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "red",
                confirmButtonText: "Yes",
                cancelButtonText: "No",
                closeOnConfirm: false,
                closeOnCancel: true
            },
                function (isConfirm) {
                    if (isConfirm) {
                        location.reload()
                    }
                }
            )
        }
    })
}

//CATEGORY CHECKING IF ALREADY EXISTS
$("#addCategory").submit((e) => {
    e.preventDefault();
    $.ajax({
        url: '/admin/category',
        method: 'post',
        data: $("#addCategory").serialize(),
        success: (response) => {
            if (response.status) {
                location.reload()
            } else {
                swal({
                    title: "There is Already a Category....!",
                    text: "Your will not be able to create an existing CATEGORY",
                    type: "warning",
                    confirmButtonColor: "red",
                    confirmButtonClass: "btn-danger",
                    confirmButtonText: "Ok",
                    closeOnConfirm: true
                })
            }
        }
    })
})

//EDIT CATEGORY
function editCategory(categoryId, categoryName) {
    let category = document.getElementById(categoryId).innerHTML
    swal({
        title: "Edit Category!",
        type: "input",
        showCancelButton: true,
        closeOnConfirm: true,
        animation: "slide-from-top",
        inputValue: category,
        inputPlaceholder: "Edit Category"
    },
        function (inputValue) {
            if (inputValue === null)
                return false;
            if (inputValue === "") {
                return false
            }
            $.ajax({
                url: '/admin/edit-category',
                method: 'put',
                data: {
                    categoryId,
                    inputValue,
                    categoryName
                },
                success: (response) => {
                    if (response.status) {
                        document.getElementById(categoryId).innerHTML = inputValue.toUpperCase()
                    } else {
                        return false
                    }
                }
            })
        });
}


//DELETE CATEGORY
function deleteCategory(catId) {
    $.ajax({
        url: '/admin/delete-category/' + catId,
        method: 'get',
        success: (response) => {
            swal({
                title: "Are you sure?",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "red",
                confirmButtonText: "Yes",
                cancelButtonText: "No",
                closeOnConfirm: false,
                closeOnCancel: true
            },
                function (isConfirm) {
                    if (isConfirm) {
                        location.reload()
                    }
                }
            )
        }
    })
}

//DELETE CATEGORY OFFER
function deleteCategoryOffer(category) {
    $.ajax({
        url: '/admin/offer-management/delete-category-offer/',
        type: 'post',
        data: ({ category }),
        success: (response) => {
            swal({
                title: "Are you sure?",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "red",
                confirmButtonText: "Yes",
                cancelButtonText: "No",
                closeOnConfirm: false,
                closeOnCancel: true
            },
                function (isConfirm) {
                    if (isConfirm) {
                        location.reload()
                    }
                }
            )
        }
    })
}

//BLOCK USER
function blockUser(userId) {
    $.ajax({
        url: '/admin/users/' + userId,
        method: 'get',
        success: (response) => {
            swal({
                title: "Are you sure?",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "red",
                confirmButtonText: "Yes",
                cancelButtonText: "No",
                closeOnConfirm: false,
                closeOnCancel: true
            },
                function (isConfirm) {
                    if (isConfirm) {
                        location.reload()
                    }
                }
            )
        }
    })
}

//UNBLOCK USER
function unblockUser(userId) {
    $.ajax({
        url: '/admin/users/' + userId,
        method: 'get',
        success: (response) => {
            swal({
                title: "Are you sure?",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "green",
                confirmButtonText: "Yes",
                cancelButtonText: "No",
                closeOnConfirm: false,
                closeOnCancel: true
            },
                function (isConfirm) {
                    if (isConfirm) {
                        location.reload()
                    }
                }
            )
        }
    })
}

//ADD COUPON
$("#addCoupon").submit((e) => {
    e.preventDefault();
    $.ajax({
        url: '/admin/add-coupon',
        method: 'post',
        data: $("#addCoupon").serialize(),
        success: (response) => {
            if (response.status) {
                location.reload()
            } else {
                swal({
                    title: "There is Already a Coupon....!",
                    text: "Your will not be able to create an existing COUPON",
                    type: "warning",
                    confirmButtonColor: "red",
                    confirmButtonClass: "btn-danger",
                    confirmButtonText: "Ok",
                    closeOnConfirm: true
                })
            }
        }
    })
})

//DELETE COUPON
function deleteCoupon(coupon) {
    $.ajax({
        url: '/admin/delete-coupon/',
        type: 'post',
        data: ({ coupon }),
        success: (response) => {
            swal({
                title: "Are you sure?",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "red",
                confirmButtonText: "Yes",
                cancelButtonText: "No",
                closeOnConfirm: false,
                closeOnCancel: true
            },
                function (isConfirm) {
                    if (isConfirm) {
                        location.reload()
                    }
                }
            )
        }
    })
}

//REDEEM COUPON
$('#redeem-coupon').submit((e) => {
    e.preventDefault()
    $.ajax({
        url: '/redeem-coupon',
        method: 'post',
        data: $('#redeem-coupon').serialize(),
        success: (response) => {
            if (!response.msg) {
                $('#coupon-condition').text("")
                $('#coupon-form').css('border-color', 'green')
                $('#final-amount').text(response.total)
                $('#coupon-offer').text(response.offer)
                $('#totalCheckoutAmount').val(response.total)
            } else {
                $('#coupon-condition').text(response.msg)
                $('#coupon-form').css('border-color', 'red')
                $('#final-amount').text(response.total)
                $('#coupon-offer').text(response.offer)
                $('#totalCheckoutAmount').val(response.total)
            }
        }
    })
})

//RETURN ORDER
// $('#returnReason').submit((e) => {
//     e.preventDefault()
//     $.ajax({
//         url: '/return-order',
//         method: 'post',
//         data: $('#returnReason').serialize(),
//         success: (response) => {
//             location.reload()
//         }
//     })
// })
function returnProduct(orderId, prodId) {
    swal({
        title: "What is the Reason..?",
        type: "input",
        showCancelButton: true,
        closeOnConfirm: true,
        animation: "slide-from-top",
        inputPlaceholder: "Please share with Us..."
    },
        function (inputValue) {
            if (inputValue === null)
                return false;
            if (inputValue === "") {
                return false
            }
            $.ajax({
                url: '/return-product',
                method: 'post',
                data: {
                    orderId,
                    prodId,
                },
                success: (response) => {
                    if (response.status) {
                        location.href = '/orders'
                    } else {
                        return false
                    }
                }
            })
        });
}

