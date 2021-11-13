$(document).ready(function(){
    $('.message a').click(function(){
        $('form').animate({height: "toggle", opacity: "toggle"}, "slow");
    });

    let input = $("#phone");
    let errorMsg = $("#error-msg");
    let validMsg = $("#valid-msg");

    // initialise plugin
    input.intlTelInput({
        utilsScript: "../js/utils.js"
    });

    // here, the index maps to the error code returned from getValidationError for telephone input
    let errorMap = ["Invalid number", "Invalid country code", "Too short", "Too long", "Invalid number"];

    let reset = function() {
        input.removeClass("error");
        errorMsg.innerHTML = "";
        errorMsg.addClass("hide");
        validMsg.addClass("hide");
        if (input[0] !== undefined) {
            input[0].setCustomValidity("");
        }
    };

    // on keyup / change flag: reset
    input.on('change', reset);
    input.on('keyup', reset);

    // on blur: validate
    input.on('blur', function() {
        reset();
        if (input.intlTelInput('isValidNumber')) {
            validMsg.removeClass("hide");
            // prepend the country code to the phone number
            if (input.val().indexOf("+") == -1) {
                let fullNumber = "+" + input.intlTelInput('getSelectedCountryData').dialCode + input.val();
                input.val(fullNumber);
            }
        } else {
            input.addClass("error");
            var errorCode = input.intlTelInput('getValidationError');
            input[0].setCustomValidity(errorMap[errorCode]); // explicitly set this, so the field is marked as invalid, and submit will fail
            errorMsg.html(errorMap[errorCode]);
            errorMsg.removeClass("hide");
        }
    });


    // generate select option for year, month, and day input fields
    if (document.getElementsByClassName('yearSelect') !== null) {
        let yearElems = document.getElementsByClassName('yearSelect'),
            now = new Date(),
            yearsAhead = 30;
            if (document.getElementById('dobYYYYMMYear') !== null) {
                yearsAhead = 0;
            }
            maxYear = now.getFullYear() + yearsAhead;

        for (let i = 0; i < yearElems.length; i++) {
            let yearDf = document.createDocumentFragment();
            for (let i = maxYear; i >= 1930; i--) {
                let option = document.createElement('option');
                option.value = i.toString();
                option.appendChild(document.createTextNode(i.toString()));
                yearDf.appendChild(option);
            }
            yearElems[i].appendChild(yearDf);
        }
    }

    if (document.getElementsByClassName('monthSelect') !== null) {
        let monthElems = document.getElementsByClassName('monthSelect');
        for (let i = 0; i < monthElems.length; i++) {
            let monthDf = document.createDocumentFragment();
            for (let i = 1; i <= 12; i++) {
                let option = document.createElement('option');
                option.value = i.toString();
                option.appendChild(document.createTextNode(i.toString()));
                monthDf.appendChild(option);
            }
            monthElems[i].appendChild(monthDf);
        }
    }

    if (document.getElementsByClassName('daySelect') !== null) {
        let dayElems = document.getElementsByClassName('daySelect');
        for (let i = 0; i < dayElems.length; i++) {
            let dayDf = document.createDocumentFragment();
            for (let i = 1; i <= 31; i++) {
                let option = document.createElement('option');
                option.value = i.toString();
                option.appendChild(document.createTextNode(i.toString()));
                dayDf.appendChild(option);
            }
            dayElems[i].appendChild(dayDf);
        }
    }

    // generate iso date from YYYYMM or MMDD input fields
    $('.childValue').on('change', (event) => {
        let year;
        let mth = 1;
        let dt = 1;
        let yearStr = '0000';
        let monthStr, dateStr;
        let iso;

        $(event.target).closest($('div')).children('select').each((i,e) => {
            if ($(e).hasClass('year')) {
                if ($(e).val() !== null) {
                    year = $(e).val();
                }
            } else if ($(e).hasClass('month')) {
                if ($(e).val() !== null) {
                    mth = $(e).val();
                }
            } else if ($(e).hasClass('date')) {
                if ($(e).val() !== null) {
                    dt = $(e).val();
                }
            }
        });
        if (year !== undefined) {
            yearStr = year.toString();
        }
        monthStr = mth.toString().padStart(2, '0');
        dateStr = dt.toString().padStart(2, '0');
        iso = yearStr + '-' + monthStr + '-' + dateStr;
        $(event.target).closest('.groupedForm').find('.parentValue').val(iso);
    });

    // handles conversion to base64 string for type file
    let id = '';
    let imagePreviewId = '';
    let croppieInstances = {};

    // handles conversion to base64 string for file type
    $( "input[type='file']" ).change(function() {
        id = $(this).attr("id");

        // hide error message if any
        if (!$('#error-' + id).hasClass("d-none")) {
            $('#error-' + id).addClass("d-none");
        }

        // if we are dealing with image type then we want to load in Croppie, and set some other actions for preview
        if ($(this).attr("data-type") == "image") {
            imagePreviewId = "#croppie-" + id;

            // hide label selector
            $( "label[for='" + id +  "']" ).hide();

            // show 'upload another image link'
            $(imagePreviewId + ' > p > a.trigger-image-upload').removeClass("d-none");
        }

        // convert file to base64 if set
        if (this.files !== undefined && this.files.length > 0) {
            // init reader
            const reader = new FileReader();
            reader.onload = function(e) {
                // set the base64 string to the hidden input (which gets submitted to backend)
                $('#b64-' + id).attr('value', e.target.result);

                // in case of images, we want to load the cropper & preview
                if (imagePreviewId !== '') {
                    if (!croppieInstances.hasOwnProperty(id)) {
                        // store croppie instance in the array (only instantiate once)
                        croppieInstances[id] = $(imagePreviewId + ' .preview').croppie({
                            enableExif: true,
                            viewport: {
                                height: 250,
                                width: 250,
                            },
                            boundary: {
                                height: 480,
                                width: 480,
                            },
                            enableOrientation: true
                        });
                    }
                    // bind the uploaded image on
                    croppieInstances[id].croppie("bind", {
                        "url": e.target.result
                    });
                }
            };
            reader.onerror = function() {
                alert("Error loading file. Please try again.");
            };
            reader.readAsDataURL(this.files[0]);
        }
    });

    $('#submit-btn').on('click', function() {
        // explicitly need to check phone numbers are valid before submit (in case the user has a default value set on the field, i.e. a country code, and the field is never touched by the user).
        if (input[0] !== undefined && input.val() !== '') {
            reset();
            if (input.intlTelInput('isValidNumber')) {
                validMsg.removeClass("hide");
                // prepend the country code to the phone number
                if (input.val().indexOf("+") == -1) {
                    let fullNumber = "+" + input.intlTelInput('getSelectedCountryData').dialCode + input.val();
                    input.val(fullNumber);
                }
            } else {
                input.addClass("error");
                var errorCode = input.intlTelInput('getValidationError');
                input[0].setCustomValidity(errorMap[errorCode]); // explicitly set this, so the field is marked as invalid, and submit will fail
                errorMsg.html(errorMap[errorCode]);
                errorMsg.removeClass("hide");
            }
        }

        // only continue if form is valid
        if ($('#data-collection-form')[0].checkValidity()) {
            // we need to loop through all Croppie instances and get the base64 string of the cropped image.
            // the base64 version of the image will be set on the b64 hidden field that is sent to the backend
            const numOfCroppieInstances = Object.keys(croppieInstances).length;;

            if (numOfCroppieInstances > 0) {
                let promisesCompleted = 0;

                $.each(croppieInstances, function (id, instance) {
                    instance.croppie('result', {
                        type: 'base64',
                        size: {
                            width: 480,
                            height: 480
                        }
                    }).then(function (blob) {
                        $('#b64-' + id).attr('value', blob.split(',')[1]);
                        $('#croppie-output-' + id).attr('src', blob);

                        promisesCompleted++;

                        // if all promises have completed then submit form to the backend
                        if (numOfCroppieInstances == promisesCompleted) {
                            $("#submit-hidden").click();
                        }
                    });
                });
            } else {
                $("#submit-hidden").click();
            }
        } else {
            $( "input[type='file']").each(function() {
                if ($(this).is(":invalid")) {
                    $('#error-' + this.id).removeClass("d-none");
                }
            });
            // If the form is invalid, submit it. The form won't actually submit;
            // this will just cause the browser to display the native HTML5 error messages.
            $("#submit-hidden").click();
        }
    });


    $('.trigger-image-upload').on("click", function(e) {
        e.preventDefault();
        $($(this).attr('data-input-id')).click();
    });
});