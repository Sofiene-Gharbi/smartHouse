var GPIOoutput = Array(0, 2, 4, 5, 12, 13, 14, 15, 16, 17, 18),
    GPIOinput = Array(19, 21, 22, 23, 25, 26, 27, 32, 33, 34, 35),
    GPIOmin = 1,
    GPIOmax = 35,
    interiorLightsKey = 0,
    interiorLightsCount = 0,
    exteriorLightsKey = 0,
    exteriorLightsCount = 0,
    GPIO = new Array(GPIOmax).fill(0),
    indexInteriorLightSwitch = [undefined],
    indexExteriorLightSwitch = [undefined],
    interiorLightAlreadyLoaded = false,
    exteriorLightAlreadyLoaded = false,
    timersTab = new Array(),
    timersCount = 0;

//setup the Lights DOM
const allOnOffInteriorLight = document.getElementById("allOnOff-InteriorLight"),
    allOnOffInteriorLightDOM = document.getElementById("allOnOff-InteriorLightDOM"),
    allOnOffExteriorLight = document.getElementById("allOnOff-ExteriorLight"),
    allOnOffExteriorLightDOM = document.getElementById("allOnOff-ExteriorLightDOM");



//<!-- Auth part-->
// if user not authentified open login window
auth.onAuthStateChanged((user) => {
    if (!user) {
        window.open("./login.html", "_parent", "");
    }
});


// logout
const logout = document.getElementById("logout");
logout.addEventListener("click", (e) => {
    e.preventDefault();
    auth.signOut();
});

/******************************************************************************************************/
/*** Other functions ***/
function switchlightKeys(Tab) {
    let keys = new Array(undefined);

    for (let i = 1; i < Tab.length; i++) {
        keys.push(Tab[i].key);
    }

    return keys;
}


//get data when the page is loaded
interiorLightsRef.orderByChild("Index").once('value', (snapshot) => {
    interiorLightsCount = snapshot.numChildren();
    interiorLightAlreadyLoaded = setupLights(snapshot, "interiorLight");
    //console.log(`**After call of interior setup lights interiorLightsKey: ${interiorLightsKey}`);

});
exteriorLightsRef.orderByChild("Index").once('value', (snapshot) => {
    exteriorLightsCount = snapshot.numChildren();
    exteriorLightAlreadyLoaded = setupLights(snapshot, "exteriorLight");
    //console.log(`**After call of exterior setup lights exteriorLightsKey: ${exteriorLightsKey}`);
});

/******************************************************************************************************/
/*** Timer Functions ***/

//the Timer Modal call variables
const timersList = document.getElementById("modal-listTimers"),
    timerModal = document.getElementById("modal-manageTimer"),
    timerForm = document.getElementById("manageTimerForm"),
    beginTimer = document.getElementById("beginTimer"),
    endTimer = document.getElementById("endTimer"),
    timerContent = document.getElementById("timerContent"),
    isTouchDevice = 'ontouchstart' in document.documentElement;

var endDateTimePicker = undefined,
    endTimePicker = undefined,
    beginDateTimePicker = undefined,
    beginTimePicker = undefined;


//function to convert a sring to a valid date
function stringToDate(ch) {
    let chDate = `${ch.substring(6,10)}-${ch.substring(3,5)}-${ch.substring(0,2)}T${ch.substring(12,20)}`;
    let date = new Date(chDate);
    return date;
}

//function to convert a date to a string 
function dateToString(date) {
    return `${date.getDate()<10?"0"+date.getDate():date.getDate()}/${(date.getMonth()+1)<10? "0"+(date.getMonth()+1):(date.getMonth()+1)}/${date.getFullYear()}, ${date.getHours()<10?"0"+date.getHours():date.getHours()}:${date.getMinutes()<10?"0"+date.getMinutes():date.getMinutes()}:${date.getSeconds()<10?"0"+date.getSeconds():date.getSeconds()}`;
}

//function to configure remaining time
function remainingTime(elet) {
    let targetElet = document.getElementById(elet),
        countDownDate = targetElet.children[0].getAttribute("timeVal");

    // Update the count down every 1 second
    var x = setInterval(function() {
        if (targetElet != undefined && targetElet != null) {

            // Get today's date and time
            var now = new Date().getTime();

            // Find the distance between now and the count down date
            var distance = countDownDate - now;

            // Time calculations for days, hours, minutes and seconds
            var days = Math.floor(distance / (1000 * 60 * 60 * 24));
            var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            var seconds = Math.floor((distance % (1000 * 60)) / 1000);

            // Output the result in an element with id="demo"
            targetElet.setAttribute("aria-label", days + "d " + hours + "h " +
                minutes + "m " + seconds + "s ");

            // If the count down is over, write some text 
            if (distance < 0) {
                clearInterval(x);
                targetElet.setAttribute("aria-label", "Already Started");
            }
        }
    }, 1000);
}

//listen to firebase if there is a new timer database instance is created
timerRef.on("child_added", (snapshot) => {
    if (interiorLightAlreadyLoaded && exteriorLightAlreadyLoaded) {
        //add the timer details to timers Array
        timersTab.push(snapshot);
        timersCount = parseInt(String(snapshot.key).substring(6));

        //set the timer button color to yellow
        document.getElementById(snapshot.val().switchKey + "-CRUDelement").children[0].children[0].style.color = "yellow";

        //update timers list modal
        if (timersList.style.display == "block") {
            showTimersListModal(snapshot.val().switchKey);
        }
    }
});

//function to show the timers list Modal
function showTimersListModal(id) {
    let html = ""
    for (let timer of timersTab) {
        if (timer.val().switchKey === id) {
            html += createNewTimerDOM(timer);
        }
    }
    if (html == "") {
        html = `<div class="card">
                    <ul class="list-group borderless" style="text-align: center;">
                        <p class="mb-2 mt-2">There is no timer for this switch</p>
                    </ul>
                </div>`;
    }

    document.getElementById("timersList").innerHTML = html;
    if (isTouchDevice) {
        // do mobile handling
        let buttonsHtml = ` <div class="d-flex flex-row justify-content-start">
                                <button type="button" class="btn btn-primary" id="addNewTimer" elet-target='${id}' onclick="showManageTimerModal(this.getAttribute('elet-target'), 'createBtn')">Create</button>
                                <button type="button" class="btn btn-secondary ml-4" onclick="closeModal('modal-listTimers')">Cancel</button>
                            </div>`;
        document.getElementById("timersListButtons").innerHTML = buttonsHtml;
    }
    document.getElementById("addNewTimer").setAttribute("elet-target", id);

    for (let timer of timersTab) {
        if (typeof(document.getElementById(String(timer.key) + "-Begin")) != undefined && document.getElementById(String(timer.key) + "-Begin") != null) {
            remainingTime(String(timer.key) + "-Begin");
        }
        if (typeof(document.getElementById(String(timer.key) + "-End")) != undefined && document.getElementById(String(timer.key) + "-End") != null) {
            remainingTime(String(timer.key) + "-End");
        }
    }

    timersList.classList.add("show");
    timersList.style.display = "block";
}

//function to create a new timer DOM and return  it
function createNewTimerDOM(snapshot) {
    let snapshopVal = snapshot.val(),
        html = "";

    switch (snapshot.numChildren()) {
        case 7:
            {
                html = `<p class="mb-1" style="color: rgba(15, 156, 230, .8)">${snapshopVal.endTimer}</p>
                        <span class="infobulle mb-1 ml-auto" id="${snapshot.key}-End" aria-label="">
                            <p class="mb-0 ml-auto" timeVal="${snapshopVal.endPickerTime}">${snapshopVal.endPicker}</p>
                        </span>`;
            }
            break;
        case 5:
            {
                html = `<p class="mb-1" style="color: rgba(15, 156, 230, .8)">Power Off At</p>
                        <p class="mb-0 ml-auto">${snapshopVal.endTimer}</p>`;
            }
            break;
    }

    let cardDom = `<div class="card">
                        <ul class="list-group borderless">
                            <li class="list-group-item d-flex flex-row justify-content-start pt-1 pb-0  m-0">
                                <p class="mb-1" style="color: rgba(15, 156, 230, .8)">${snapshopVal.beginTimer}</p>
                                <span class="infobulle mb-1 ml-auto" id="${snapshot.key}-Begin" aria-label="">
                                    <p timeVal="${snapshopVal.beginPickerTime}">${snapshopVal.beginPicker}</p>
                                </span>
                            </li>
                            <li class="list-group-item d-flex flex-row justify-content-start pt-0 pb-0 m-0">
                                ${html}
                            </li>
                        </ul>
                        <hr class="my-0">
                        <!-- CRUD part START -->
                        <div class="d-flex flex-row justify-content-start">
                            <button type="button" class="btn btn-link ml-auto" title="Edit" onclick="editTimerInstance('${snapshot.key}')">
                                <svg class="icon-sprit" style="width: 1rem;height: 1rem;"><use xlink:href="./assets/images/icons-sprite.svg#edit"/></svg>
                            </button>
                            <button type="button" class="btn btn-link ml-1" title="Delete" onclick="removeTimerInstance('${snapshot.key}')">
                                <svg class="icon-sprit" style="width: 1rem;height: 1rem;"><use xlink:href="./assets/images/icons-sprite.svg#delete"/></svg>
                            </button>
                        </div>
                    </div>`;



    return cardDom;
}

//function to show create new timer Modal
function showManageTimerModal(id, target) {
    if (target == 'createBtn') {
        selectBeginTimerDetails('Power On At');
        document.getElementById("modal-manageTimerTitle").innerText = "Create New Timer";
    } else {
        document.getElementById("modal-manageTimerTitle").innerText = "Edit Timer";
    }

    //    if (isTouchDevice) {
    //        // do mobile handling
    //        let html = `<input type="datetime-local" class="form-control custom-focus" required/>`;
    //        timerModal.getElementById("beginTimerDateTimePicker").innerHTML = html;
    //    }
    closeModal("modal-listTimers");
    document.getElementById("setBtn").setAttribute("elet-target", id);
    timerModal.classList.add("show");
    timerModal.style.display = "block";
}

//function to create a new datetime instance
function createNewDateTimeInstance(DOM, calendar, timerAct) {
    return tail.DateTime(DOM, {
        animate: true, // [0.4.0]          Boolean
        classNames: false, // [0.3.0]          Boolean, String, Array, null
        closeButton: true, // [0.4.5]          Boolean
        dateFormat: calendar ? "dd-mm-YYYY" : false, // [0.1.0]          String (PHP similar Date)
        dateStart: beginDateTimePicker != undefined ? beginDateTimePicker.select : false, // [0.4.0]          String, Date, Integer, False
        dateRanges: [], // [0.3.0]          Array
        dateBlacklist: true, // [0.4.0]          Boolean
        dateEnd: false, // [0.4.0]          String, Date, Integer, False
        locale: "en", // [0.4.0]          String
        position: "bottom", // [0.1.0]          String
        rtl: "auto", // [0.4.1]          String, Boolean
        startOpen: false, // [0.3.0]          Boolean
        stayOpen: true, // [0.3.0]          Boolean
        timerActivate: timerAct, //Boolean
        time12h: false, // [0.4.13][NEW]    Boolean
        timeFormat: "HH:ii:ss", // [0.1.0]          String (PHP similar Date)
        timeHours: 0, // [0.4.13][UPD]    Integer, Boolean, null
        timeMinutes: 0, // [0.4.13][UPD]    Integer, Boolean, null
        timeSeconds: 0, // [0.4.13][UPD]    Integer, Boolean, null
        timeIncrement: true, // [0.4.5]          Boolean
        timeStepHours: 1, // [0.4.3]          Integer
        timeStepMinutes: 1, // [0.4.3]          Integer
        timeStepSeconds: 1, // [0.4.3]          Integer
        today: true, // [0.4.0]          Boolean
        tooltips: [], // [0.4.0]          Array
        viewDefault: "days", // [0.4.0]          String
        viewDecades: true, // [0.4.0]          Boolean
        viewYears: true, // [0.4.0]          Boolean
        viewMonths: true, // [0.4.0]          Boolean
        viewDays: true, // [0.4.0]          Boolean
        weekStart: 0, // [0.1.0]          String, Integer
    });
}

//function to select the begin timer details
function selectBeginTimerDetails(selectValue) {
    let html = `<label id="beginTimer" for="beginTimerSelector" class="col-5 col-form-label" style="color: #08a1f3; padding-right: 0.5em;">Begin Timer
                    <select id="beginTimerSelector" class="form-control custom-focus" onchange="selectBeginTimerDetails(this.value)">
                        <option value="Power On At">Power On, At...</option>
                        <option value="Power Off At">Power Off, At...</option>
                        <option value="Power On After">Power On, After...</option>
                        <option value="Power Off After">Power Off, After...</option>
                    </select>
                </label>`;
    switch (selectValue) {
        case "Power On At":
            {
                //remove the uneeded datetime instance
                removeDatetimeInstances();

                html += `<label id="beginTimerDateTimePicker" class="col-7 col-form-label" style="color: #08a1f3; padding-left: 0.5em;">Date & Time *
                            <div class="input-group" id="beginDateTimePicker">
                                <input type="text" id="beginTimerDateTimeInput" class="form-control custom-focus" placeholder="Select date and time..." readonly/>
                                <button type="button" class="btn btn-link btn-DateTimePicker"> 
                                    <svg class="icon-sprit" style="width: 2em;height: 2em;padding:0.3em;"><use xlink:href="./assets/images/icons-sprite.svg#DateTime"/></svg>                                
                                </button>
                            </div>
                        </label>
                        <label id="endTimer" class="col-12 col-form-label" style="color: #08a1f3;">End Timer
                            <select id="endTimerSelector" class="form-control custom-focus" onchange="selectEndTimerDetails(this.value)">
                                <option value="∞">∞</option>
                                <option value="Power Off At">Power Off, At...</option>
                                <option value="Power Off After">Power Off, After...</option>
                            </select>
                        </label>`;
                timerContent.innerHTML = html;
                document.getElementById("beginTimerSelector").value = "Power On At";

                //create a new date time picker
                beginDateTimePicker = createNewDateTimeInstance("#beginDateTimePicker", true, false);
                beginDateTimePicker.on('change', () => {
                    if (typeof(endDateTimePicker) != undefined && endDateTimePicker != null) {
                        endDateTimePicker.config("dateStart", beginDateTimePicker.select, true);
                    }
                });
            }
            break;

        case "Power Off At":
            {
                //remove the uneeded datetime instance
                removeDatetimeInstances();

                html += `
                        <label id="beginTimerDateTimePicker" class="col-7 col-form-label" style="color: #08a1f3; padding-left: 0.5em;">Date & Time *
                            <div class="input-group" id="beginDateTimePicker">
                                <input type="text" id="beginTimerDateTimeInput" class="form-control custom-focus" placeholder="Select date and time..." readonly/>
                                <button type="button" class="btn btn-link btn-DateTimePicker"> 
                                    <svg class="icon-sprit" style="width: 2em;height: 2em;padding:0.3em;"><use xlink:href="./assets/images/icons-sprite.svg#DateTime"/></svg>                                
                                </button>
                            </div>
                        </label>
                        <label id="endTimer" class="col-12 col-form-label" style="color: #08a1f3;">End Timer
                            <select id="endTimerSelector" class="form-control custom-focus" onchange="selectEndTimerDetails(this.value)">
                                <option value="∞">∞</option>
                                <option value="Power On At">Power On, At...</option>
                                <option value="Power On After">Power On, After...</option>
                            </select>
                        </label>`;
                timerContent.innerHTML = html;
                document.getElementById("beginTimerSelector").value = "Power Off At";
                //create a new date time picker
                beginDateTimePicker = createNewDateTimeInstance("#beginDateTimePicker", true, false);
            }
            break;

        case "Power On After":
            {
                //remove the uneeded datetime instance
                removeDatetimeInstances();

                html += `
                    <label id="beginTimerTimePicker1" class="col-7 col-form-label" style="color: #08a1f3; padding-left: 0.5em;">Timer *
                        <div class="input-group" id="beginTimePicker">
                            <input type="text" id="beginTimerTimeInput" class="form-control custom-focus" placeholder="Select timer..." readonly/>
                            <button type="button" class="btn btn-link btn-DateTimePicker"> 
                                <svg class="icon-sprit" style="width: 2em;height: 2em;padding:0.4em;"><use xlink:href="./assets/images/icons-sprite.svg#chronometre"/></svg>                                
                            </button>
                        </div>
                    </label>
                    <label id="endTimer" class="col-12 col-form-label" style="color: #08a1f3;">End Timer
                        <select id="endTimerSelector" class="form-control custom-focus" onchange="selectEndTimerDetails(this.value, this.parentElement.id)">
                            <option value="∞">∞</option>
                            <option value="Power Off At">Power Off, At...</option>
                            <option value="Power Off After">Power Off, After...</option>
                        </select>
                    </label>`;
                timerContent.innerHTML = html;
                document.getElementById("beginTimerSelector").value = "Power On After";
                //create na new date time picker
                beginTimePicker = createNewDateTimeInstance("#beginTimePicker", false, true);
            }
            break;

        case "Power Off After":
            {
                //remove the uneeded datetime instance
                removeDatetimeInstances();

                html += `
                    <label id="beginTimerTimePicker2" class="col-7 col-form-label" style="color: #08a1f3; padding-left: 0.5em;">Timer *
                        <div class="input-group"  id="beginTimePicker">
                            <input type="text" id="beginTimerTimeInput" class="form-control custom-focus" placeholder="Select timer..." readonly/>
                            <button type="button" class="btn btn-link btn-DateTimePicker"> 
                                <svg class="icon-sprit" style="width: 2em;height: 2em;padding:0.4em;"><use xlink:href="./assets/images/icons-sprite.svg#chronometre"/></svg>                                
                            </button>
                        </div>
                    </label>
                    <label id="endTimer" class="col-12 col-form-label" style="color: #08a1f3;">End Timer
                        <select id="endTimerSelector" class="form-control custom-focus" onchange="selectEndTimerDetails(this.value)">
                            <option value="∞">∞</option>
                            <option value="Power On At">Power On, At...</option>
                            <option value="Power On After">Power On, After...</option>
                        </select>
                    </label>`;
                timerContent.innerHTML = html;
                document.getElementById("beginTimerSelector").value = "Power Off After";
                //create na new date time picker
                beginTimePicker = createNewDateTimeInstance("#beginTimePicker", false, true);
            }
            break;
    }

}

//function to select the end timer dtails
function selectEndTimerDetails(selectValue) {
    let html = "",
        id = "endTimer";
    switch (selectValue) {
        case "Power Off At":
        case "Power On At":
            {
                //console.log(selectValue);
                //remove the uneeded datetime instance
                removeEndDatetimeInstances();

                document.getElementById(id).classList.remove("col-12");
                document.getElementById(id).classList.add("col-5");
                document.getElementById(id).style.paddingRight = "0.5em";

                //remove the date&time picker to insert the time picker
                if (typeof(document.getElementById("endTimerTimePicker")) != undefined && document.getElementById("endTimerTimePicker") != null) {
                    document.getElementById("endTimerTimePicker").remove();
                }
                if (typeof(document.getElementById("endTimerDateTimePicker")) != undefined && document.getElementById("endTimerDateTimePicker") != null) {
                    document.getElementById("endTimerDateTimePicker").remove();
                }

                //check if it's already exist, if yes don't insert new one                        
                if (document.getElementById("endTimerDateTimePicker") == null) {
                    html = `<label id="endTimerDateTimePicker" class="col-7 col-form-label" style="color: #08a1f3; padding-left: 0.5em;">Date & Time *
                                <div class="input-group"  id="endDateTimePicker">
                                    <input type="text" id="endTimerDateTimeInput" class="form-control custom-focus" value="" placeholder="Select date and time..." readonly/>
                                    <button type="button" class="btn btn-link btn-DateTimePicker"> 
                                        <svg class="icon-sprit" style="width: 2em;height: 2em;padding:0.3em;"><use xlink:href="./assets/images/icons-sprite.svg#DateTime"/></svg>                                
                                    </button>
                                </div>
                            </label>`;
                    //insert the time picker
                    document.getElementById(id).insertAdjacentHTML("afterend", html);

                    //create na new date time picker
                    endDateTimePicker = createNewDateTimeInstance("#endDateTimePicker", true, false);
                }
            }
            break;

        case "Power Off After":
        case "Power On After":
            {
                //console.log(selectValue);

                //remove the uneeded datetime instance
                removeEndDatetimeInstances();

                document.getElementById(id).classList.remove("col-12");
                document.getElementById(id).classList.add("col-5");
                document.getElementById(id).style.paddingRight = "0.5em";

                //remove the date&time picker to insert the time picker
                if (typeof(document.getElementById("endTimerTimePicker")) != undefined && document.getElementById("endTimerTimePicker") != null) {
                    document.getElementById("endTimerTimePicker").remove();
                }
                if (typeof(document.getElementById("endTimerDateTimePicker")) != undefined && document.getElementById("endTimerDateTimePicker") != null) {
                    document.getElementById("endTimerDateTimePicker").remove();
                }

                if (document.getElementById("endTimerTimePicker") == null) {
                    html = `<label id="endTimerTimePicker" class="col-7 col-form-label" style="color: #08a1f3; padding-left: 0.5em;">Time *
                                <div class="input-group"  id="endTimePicker">
                                    <input type="text" id="endTimerTimeInput" class="form-control custom-focus" placeholder="Select timer..." readonly/>
                                    <button type="button" class="btn btn-link btn-DateTimePicker"> 
                                        <svg class="icon-sprit" style="width: 2em;height: 2em;padding:0.4em;"><use xlink:href="./assets/images/icons-sprite.svg#chronometre"/></svg>                                
                                    </button>
                                </div>
                            </label>`;
                    //insert the time picker
                    document.getElementById(id).insertAdjacentHTML("afterend", html);

                    //create na new date time picker
                    endTimePicker = createNewDateTimeInstance("#endTimePicker", false, true);
                }
            }
            break;

        case "∞":
            {
                //remove the uneeded datetime instance
                removeEndDatetimeInstances();

                //remove the date&time and the time picker 
                if (typeof(document.getElementById("endTimerTimePicker")) != undefined && document.getElementById("endTimerTimePicker") != null) {
                    document.getElementById("endTimerTimePicker").remove();
                }
                if (typeof(document.getElementById("endTimerDateTimePicker")) != undefined && document.getElementById("endTimerDateTimePicker") != null) {
                    document.getElementById("endTimerDateTimePicker").remove();
                }

                document.getElementById(id).classList.remove("col-5");
                document.getElementById(id).classList.add("col-12");
                document.getElementById(id).style.paddingRight = "15px";
            }
            break;
    }
}

//listen to timer modal submittion
timerModal.addEventListener("submit", (e) => {
    e.preventDefault();
    if (createTimerDatabaseInstance(e.target.getAttribute("tid"))) {
        //console.log("instances removed");
        removeDatetimeInstances();
        document.getElementById("timerFormProblem").style.display = "none";
    }
})

//function to submit the timer parameters to the firebase
function createTimerDatabaseInstance(tid) {
    //verifier la validité des dates 
    if (typeof(endDateTimePicker) != undefined && endDateTimePicker != null) {
        if (typeof(beginDateTimePicker) != undefined && beginDateTimePicker != null) {
            if (document.getElementById("beginTimerDateTimeInput").value >= document.getElementById("endTimerDateTimeInput").value) {
                document.getElementById("timerFormProblem").innerText = "* The End Timer must be > to the Begin Timer";
                document.getElementById("timerFormProblem").style.display = "block";
                return false;
            }
        } else if (typeof(beginTimePicker) != undefined && beginTimePicker != null) {
            if (document.getElementById("beginTimerTimeInput").value == "00:00:00") {
                document.getElementById("timerFormProblem").innerText = "* The Begin Timer mustn't be = 00:00:00";
                document.getElementById("timerFormProblem").style.display = "block";
                return false;
            }
            let beginTimerInput = document.getElementById("beginTimerTimeInput").value;
            let D = new Date(Date.now());
            D.setHours(D.getHours() + parseInt(beginTimerInput.slice(0, 2)), D.getMinutes() + parseInt(beginTimerInput.slice(3, 5)), D.getSeconds() + parseInt(beginTimerInput.slice(-2)));
            if (D >= endDateTimePicker.select) {
                document.getElementById("timerFormProblem").innerText = "* The End Timer must be > to the Begin Timer";
                document.getElementById("timerFormProblem").style.display = "block";
                return false;
            }
        } else {
            //console.log("aucun");
        }
    }
    if (typeof(endTimePicker) != undefined && endTimePicker != null) {
        if (document.getElementById("endTimerTimeInput").value == "00:00:00") {
            document.getElementById("timerFormProblem").innerText = "* The End Timer mustn't be = 00:00:00";
            document.getElementById("timerFormProblem").style.display = "block";
            return false;
        }
    }
    if (typeof(beginTimePicker) != undefined && beginTimePicker != null) {
        if (document.getElementById("beginTimerTimeInput").value == "00:00:00") {
            document.getElementById("timerFormProblem").innerText = "* The Begin Timer mustn't be = 00:00:00";
            document.getElementById("timerFormProblem").style.display = "block";
            return false;
        }
    }

    let beginTimer = document.getElementById("beginTimerSelector").value,
        eletTargetId = document.getElementById("setBtn").getAttribute("elet-target"),
        newData = {
            switchKey: eletTargetId,
            beginTimer: beginTimer,
        };
    switch (beginTimer) {
        case "Power On At":
        case "Power Off At":
            {
                newData["beginPicker"] = document.getElementById("beginTimerDateTimeInput").value;
                newData["beginPickerTime"] = beginDateTimePicker.select.getTime();
            }
            break;
        case "Power On After":
        case "Power Off After":
            {
                let beginTimerInput = document.getElementById("beginTimerTimeInput").value,
                    D = new Date(Date.now());
                D.setHours(D.getHours() + parseInt(beginTimerInput.slice(0, 2)), D.getMinutes() + parseInt(beginTimerInput.slice(3, 5)), D.getSeconds() + parseInt(beginTimerInput.slice(-2)));
                newData["beginPicker"] = beginTimerInput;
                newData["beginPickerTime"] = D.getTime();
            }
            break;
    }
    let endTimer = document.getElementById("endTimerSelector").value;
    newData["endTimer"] = endTimer;

    //console.log(newData);

    switch (endTimer) {
        case "Power Off At":
        case "Power On At":
            {
                newData["endPicker"] = document.getElementById("endTimerDateTimeInput").value;
                newData["endPickerTime"] = endDateTimePicker.select.getTime();
            }
            break;
        case "Power Off After":
        case "Power On After":
            {
                let endTimerInput = document.getElementById("endTimerTimeInput").value,
                    D = new Date(Date.now());
                D.setHours(D.getHours() + parseInt(endTimerInput.slice(0, 2)), D.getMinutes() + parseInt(endTimerInput.slice(3, 5)), D.getSeconds() + parseInt(endTimerInput.slice(-2)));
                newData["endPicker"] = endTimerInput;
                newData["endPickerTime"] = D.getTime();
            }
            break;
    }

    //if we didn't set the uid to setBtn
    if (tid === null) {
        timersCount++;
        tid = "Timer-" + timersCount;
    }

    // close the create modal, reset form & remove instances
    document.getElementById("manageTimerForm").removeAttribute("tid");
    closeModal('modal-manageTimer', 'manageTimerForm');

    timerRef.child(tid).set(newData).then(() => {
        //alert switch light added
        if (alert("Your Timer confguration was set sucessfully :)") == undefined) {
            showTimersListModal(eletTargetId);
        }
    }).catch(err => {
        alert(err.message);
    });
    return true;
}

//function de remove all tail.datetime instances
function removeDatetimeInstances() {
    if (typeof(beginDateTimePicker) != undefined && beginDateTimePicker != null) {
        beginDateTimePicker.close();
        beginDateTimePicker.remove();
        beginDateTimePicker = undefined;
    }
    if (typeof(beginTimePicker) != undefined && beginTimePicker != null) {
        beginTimePicker.close();
        beginTimePicker.remove();
        beginTimePicker = undefined;
    }
    if (typeof(endDateTimePicker) != undefined && endDateTimePicker != null) {
        endDateTimePicker.close();
        endDateTimePicker.remove();
        endDateTimePicker = undefined;
    }
    if (typeof(endTimePicker) != undefined && endTimePicker != null) {
        endTimePicker.close();
        endTimePicker.remove();
        endTimePicker = undefined;
    }
}

//function de remove end tail.datetime instances
function removeEndDatetimeInstances() {
    if (typeof(endDateTimePicker) != undefined && endDateTimePicker != null) {
        endDateTimePicker.close();
        endDateTimePicker.remove();
        endDateTimePicker = undefined;
    }
    if (typeof(endTimePicker) != undefined && endTimePicker != null) {
        endTimePicker.close();
        endTimePicker.remove();
        endTimePicker = undefined;
    }
}

//function to firebase if edit a timer instance
function editTimerInstance(tid) {
    let snapshot = undefined;
    for (let idx in timersTab) {
        if (timersTab[idx].key === tid) {
            snapshot = timersTab[idx];
            break;
        }
    }

    let snapshopVal = snapshot.val();
    selectBeginTimerDetails(snapshopVal.beginTimer);
    document.getElementById("beginTimerDateTimeInput").value = snapshopVal.beginPicker;
    document.getElementById("endTimerSelector").value = snapshopVal.endTimer;

    if (snapshot.numChildren() === 7) {
        selectEndTimerDetails(snapshopVal.endTimer, "endTimer");
        if (document.getElementById("endTimerDateTimeInput") != undefined) {
            document.getElementById("endTimerDateTimeInput").value = snapshopVal.endPicker;
        }
        if (document.getElementById("endTimerTimeInput") != undefined) {
            document.getElementById("endTimerTimeInput").value = snapshopVal.endPicker;
        }
    }
    showManageTimerModal(snapshopVal.switchKey);
    document.getElementById("manageTimerForm").setAttribute("tid", tid);
}

//listen to firebase if edit a timer instance
timerRef.on("child_changed", (snapshot) => {
    for (let idx in timersTab) {
        if (timersTab[idx].key == snapshot.key) {
            timersTab[idx] = snapshot;
            break;
        }
    }

    //update timers list modal UI
    if (timersList.style.display == "block") {
        showTimersListModal(snapshot.val().switchKey);
    }
});

//function to remove a timer instance
function removeTimerInstance(id) {
    if (confirm("This timer will be removed :(")) {
        timerRef.child(id).remove().then(() => {
            alert("Your timer was removed sucessfully :)");
        }).catch(err => {
            alert(err.message);
        });

    }
}

//listen to timer child removed from firebase
timerRef.on("child_removed", (snapshot) => {
    //We know that minimum we have one occurence that we will remove
    let ct = 0;
    for (let idx in timersTab) {
        if (timersTab[idx].key == snapshot.key) {
            timersTab.splice(idx, 1);
            break;
        }
        if (timersTab[idx].val().switchKey == snapshot.val().switchKey) {
            ct += 1;
        }
    }

    //update timers list modal UI
    if (timersList.style.display === "block") {
        showTimersListModal(snapshot.val().switchKey);
    }

    //reset the timer button color
    if (ct == 0 && typeof(document.getElementById(snapshot.val().switchKey + "-CRUDelement").children[0].children[0]) != undefined && document.getElementById(snapshot.val().switchKey + "-CRUDelement").children[0].children[0] != null) {
        document.getElementById(snapshot.val().switchKey + "-CRUDelement").children[0].children[0].style.color = "#0f9ce6";
    }
})


/******************************************************************************************************/
/*** Light CRUD Functions ***/
//the manage light Modal call variables
const manageLightModal = document.getElementById("modal-manageLight"),
    manageLightForm = document.getElementById("manageLightForm");

/** Other functions **/
//function to fill the create new light form "GPIO Select DOM" with values
function fillSelect(selecteurType) {
    let html = "<option value=''>Select GPIO ...</option>",
        disabled = "",
        GPIOtab = new Array();

    if (selecteurType == "outputPin") {
        GPIOtab = GPIOoutput;
    } else if (selecteurType == "btnPin") {
        GPIOtab = GPIOinput;
    }

    for (let idx in GPIOtab) {
        disabled = "";
        if (GPIO[idx] == 1) {
            disabled = "disabled";
        }
        html += `<option id="${selecteurType}${GPIOtab[idx]}" value="${GPIOtab[idx]}" ${disabled}>${GPIOtab[idx]}</option>`;
    }

    return html;
}

//function to enable/disable the used GPIOs
function disableUsedPin(id) {
    let selector = document.getElementById(id),
        dataUnit = "";

    if (id == "outputPin") {
        dataUnit = "btnPin";
    } else if (id == "btnPin") {
        dataUnit = "outputPin";
    }

    if (selector.getAttribute("previousVal") != "") {
        let elet = document.getElementById(dataUnit + selector.getAttribute("previousVal"));
        if (typeof(elet) != undefined && elet != null) {
            elet.disabled = false;
        }
    }

    if (selector.value != "") {
        let elet = document.getElementById(dataUnit + selector.value);
        if (typeof(elet) != undefined && elet != null) {
            elet.disabled = true;
        }
    }
    selector.setAttribute("previousVal", selector.value);
}

//function to close manage light modal
function closeModal(modalId, formId) {
    if (modalId == 'modal-manageTimer') {
        removeDatetimeInstances();
        showTimersListModal(document.getElementById(formId).children[1].children[0].children[0].getAttribute("elet-target"));
    }
    document.getElementById(modalId).style.display = 'none';
    if (formId != undefined) {
        document.getElementById(formId).reset();
    }
}
document.addEventListener('keyup', (event) => {
    if (event.defaultPrevented) {
        return;
    }

    var key = event.key || event.keyCode;

    if (key === 'Escape' || key === 'Esc' || key === 27) {
        closeModal("modal-manageLight", "manageLightForm");
        closeModal('modal-manageTimer', 'manageTimerForm');
        closeModal('modal-listTimers');
    }
});
document.addEventListener("click", (event) => {
    if (event.defaultPrevented) {
        return;
    }

    window.onclick = function(event) {
        switch (event.target.id) {
            case "modal-manageLight":
                closeModal(event.target.id, "manageLightForm");
                break;
            case "modal-manageTimer":
                closeModal(event.target.id, "manageTimerForm");
                break;
            case "modal-listTimers":
                closeModal(event.target.id);
                break;
        }
    }

});

/** Add new light switch **/
//function to show the create new light window modal
function showCreateNewLightModal(lightType, ref, idx, side) {
    //update the modal Title
    let manageLightModalTitle = document.getElementById("manageLightModalTitle");
    if (lightType === "interiorLight") {
        manageLightModalTitle.innerText = "Create New Interior Light";
    } else if (lightType === "exteriorLight") {
        manageLightModalTitle.innerText = "Create New Exterior Light";
    }

    //fill the select DOM
    manageLightForm.outputPin.innerHTML = fillSelect("outputPin");
    manageLightForm.btnPin.innerHTML = fillSelect("btnPin");

    //update the submit button attributs
    manageLightForm.submitBtn.setAttribute("ref", ref);
    manageLightForm.submitBtn.setAttribute("lightType", lightType);
    manageLightForm.submitBtn.setAttribute("index", idx);
    manageLightForm.submitBtn.setAttribute("side", side);
    manageLightForm.submitBtn.innerText = "Create";
    myFct = createNewLightDatabaseInstance.bind();

    //open the create new light modal
    manageLightModal.classList.add("show");
    manageLightModal.style.display = "block";
    //console.log("lightType", manageLightForm.submitBtn.getAttribute('lightType'));
    //console.log("ref", manageLightForm.submitBtn.getAttribute('ref'));
    //console.log("index", manageLightForm.submitBtn.getAttribute('index'));
    //console.log("side", manageLightForm.submitBtn.getAttribute('side'));
    //console.log("interiorLightsKey", interiorLightsKey);
    //console.log("exteriorLightsKey", exteriorLightsKey);
}

//function vide, to be replaced with the Create or Edit lights functions
function myFct() {}

//function to create new light database instance
function createNewLightDatabaseInstance() {
    let idx,
        lightType = manageLightForm.submitBtn.getAttribute("lightType"),
        ref = manageLightForm.submitBtn.getAttribute("ref"),
        path = ref + lightType + "-switch-",
        side = manageLightForm.submitBtn.getAttribute("side"),
        dataTab = new Array(undefined);

    //get the new created light switch index
    if (side === "Insert Light Left") {
        idx = parseInt(manageLightForm.submitBtn.getAttribute("index"));
    } else if (side === "Insert Light Right") {
        idx = parseInt(manageLightForm.submitBtn.getAttribute("index")) + 1;
    }

    //get the new light type 
    if (lightType === "interiorLight") {
        path += interiorLightsKey + 1;
        dataTab = indexInteriorLightSwitch;
    } else if (lightType === "exteriorLight") {
        path += exteriorLightsKey + 1;
        dataTab = indexExteriorLightSwitch;
    }
    //console.log(`Index:${idx}\nlightType:${lightType}\nref:${ref}\npath:${path}\nside:${side}\ndataTab:${dataTab}\n`)

    let newData = {};
    newData = {
        Name: manageLightForm.name.value,
        Output_Pin: manageLightForm.outputPin.value,
        Button_Pin: manageLightForm.btnPin.value,
        Status: manageLightForm.initialState.value,
        PowerConsumption: manageLightForm.powerConsumption.value,
        Voltage: manageLightForm.voltage.value,
        Index: idx
    };

    let updates = {};
    updates[path] = newData;

    //update firebase index status
    for (let i = idx; i < dataTab.length; i++) {
        updates[ref + dataTab[i].key + "/Index"] = i + 1;
    }
    //console.log(updates);

    // close the create modal & reset form
    closeModal("modal-manageLight", "manageLightForm");

    databaseRef.update(updates).then(() => {
        //alert switch light added
        alert("Your new light switch was added sucessfully :)");
    }).catch(err => {
        alert(err.message);
    });
}

//create a new Light switch database instance
manageLightModal.addEventListener("submit", (e) => {
    e.preventDefault();
    myFct();
    document.getElementById("outputPin").setAttribute("previousVal", "");
    document.getElementById("btnPin").setAttribute("previousVal", "");
});

/** Delete light switch **/
//function to delete a light switcher
function deleteLightSwitcher(ref, id) {
    if (confirm("This switch light will be removed :(")) {
        let idx = document.getElementById(id + "-CRUDelement").getAttribute("Index");
        //updateSingleSwitchStateLightsJS(ref, id, false);
        database.ref(ref + id).remove().then(() => {
            //get the data tab
            let dataTab = undefined;
            if (ref == "Lights/Interior_Lights/") {
                dataTab = indexInteriorLightSwitch;
            } else if (ref == "Lights/Exterior_Lights/") {
                dataTab = indexExteriorLightSwitch;
            }
            //update database index status
            let updates = {};
            for (let i = idx; i < dataTab.length; i++) {
                updates[ref + dataTab[i].key + "/Index"] = i;
            }
            databaseRef.update(updates).catch(err => {
                alert(err.message);
                alert("Hi I am Sofiene. <br> This was a technical problem <br>To solve this please delete all your switches then refresh the page and recreate them from the start. Or call me and show it to me :)");
            });
            for (timer of timersTab) {
                if (timer.val().switchKey == id) {
                    console.log("Timer/" + timer.key);
                    database.ref("Timer/" + timer.key).remove().catch(err => {
                        alert(err.message);
                    });
                }
            }
            alert("Your switch light was removed sucessfully :)");
        }).catch(err => {
            alert(err.message);
        });
    }
}

//function to delete all light switchs
function deleteAllLightSwitcher(ref) {
    if (confirm("Do you really want to delete all this light switchs?")) {
        console.log(ref);
        updateGroupSwitchsStatesLightsJS(ref, "all-off");
        database.ref(ref).remove().then(() => {
            // show popup removed sucessfully alert
            alert("All your light switches were removed sucessfully :)");
        }).catch(err => {
            // show popup error msg alert
            alert(err.message);
        });
    }
}

/** Edit light switch **/
//sopen the edit modal filled with switch data
function showEditLightSwitchModal(ref, id) {
    //update the modal Title
    let editLightModalTitle = document.getElementById("manageLightModalTitle");
    let dataTab = new Array();
    if (ref == "Lights/Interior_Lights/") {
        editLightModalTitle.innerText = "Edit Interior Light Switch Details";
        dataTab = indexInteriorLightSwitch;
    } else if (ref == "Lights/Exterior_Lights/") {
        editLightModalTitle.innerText = "Edit Exterior Light Switch Details";
        dataTab = indexExteriorLightSwitch;
    }
    let data = dataTab[parseInt(document.getElementById(id + "-CRUDelement").getAttribute("Index"))];
    let dataVal = data.val();

    //fill the select DOM
    manageLightForm.outputPin.innerHTML = fillSelect("outputPin");
    manageLightForm.btnPin.innerHTML = fillSelect("btnPin");

    if (typeof(document.getElementById("outputPin" + dataVal.Output_Pin)) != undefined && document.getElementById("outputPin" + dataVal.Output_Pin) != null) {
        document.getElementById("outputPin" + dataVal.Output_Pin).disabled = false;
    }
    if (typeof(document.getElementById("btnPin" + dataVal.Output_Pin)) != undefined && document.getElementById("btnPin" + dataVal.Output_Pin) != null) {
        document.getElementById("btnPin" + dataVal.Output_Pin).disabled = true;
    }

    document.getElementById("outputPin").setAttribute("previousVal", dataVal.Output_Pin);
    if (typeof(document.getElementById("btnPin" + dataVal.Button_Pin)) != undefined && document.getElementById("btnPin" + dataVal.Button_Pin) != null) {
        document.getElementById("btnPin" + dataVal.Button_Pin).disabled = false;
    }
    if (dataVal.Button_Pin != "") {
        if (typeof(document.getElementById("outputPin" + dataVal.Button_Pin)) != undefined && document.getElementById("outputPin" + dataVal.Button_Pin) != null) {
            document.getElementById("outputPin" + dataVal.Button_Pin).disabled = true;
        }
    }
    document.getElementById("btnPin").setAttribute("previousVal", dataVal.Button_Pin);

    //fill the form content
    manageLightForm.name.value = dataVal.Name;
    manageLightForm.outputPin.value = dataVal.Output_Pin;
    manageLightForm.btnPin.value = dataVal.Button_Pin;
    manageLightForm.initialState.value = dataVal.Status;
    manageLightForm.powerConsumption.value = dataVal.PowerConsumption;
    manageLightForm.voltage.value = dataVal.Voltage;

    //set submit button attributs
    manageLightForm.submitBtn.setAttribute("ref", ref);
    manageLightForm.submitBtn.setAttribute("switchKey", id);
    manageLightForm.submitBtn.innerText = "Edit";

    //lier the submit event listener with editLightSwitch function
    myFct = editExistantLightDatabaseInstance.bind();

    //open the create new light modal
    manageLightModal.classList.add("show");
    manageLightModal.style.display = "block";
}

//submit the edited data to database and indexLight Tab
function editExistantLightDatabaseInstance(e) {
    //get submit buttons attributs
    let ref = manageLightForm.submitBtn.getAttribute("ref");
    let switchKey = manageLightForm.submitBtn.getAttribute("switchKey");
    let idx = parseInt(document.getElementById(switchKey + "-CRUDelement").getAttribute("Index"));
    //get switch light data
    let dataTab = new Array();
    if (ref == "Lights/Interior_Lights/") {
        dataTab = indexInteriorLightSwitch;
    } else if (ref == "Lights/Exterior_Lights/") {
        dataTab = indexExteriorLightSwitch;
    }
    let data = dataTab[idx];
    let dataVal = data.val();

    //create newData var to store edited data
    let newData = {};
    //try to figure out the edited data
    if (manageLightForm.name.value != dataVal.Name) {
        newData["Name"] = manageLightForm.name.value;
    }
    if (manageLightForm.outputPin.value != dataVal.Output_Pin) {
        newData["Output_Pin"] = manageLightForm.outputPin.value;
    }
    if (manageLightForm.btnPin.value != dataVal.Button_Pin) {
        newData["Button_Pin"] = manageLightForm.btnPin.value;
    }
    if (manageLightForm.initialState.value != dataVal.Status) {
        newData["Status"] = manageLightForm.initialState.value;
    }
    if (manageLightForm.powerConsumption.value != dataVal.PowerConsumption) {
        newData["PowerConsumption"] = manageLightForm.powerConsumption.value;
    }
    if (manageLightForm.voltage.value != dataVal.Voltage) {
        newData["Voltage"] = manageLightForm.voltage.value;
    }

    // close the create modal & reset form
    closeModal("modal-manageLight", "manageLightForm");

    database.ref(ref + switchKey).update(newData).then(() => {
        //alert switch light added
        alert("Your light switch data was updated sucessfully :)");
    }).catch(err => {
        alert(err.message);
    });
}

/******************************************************************************************************/
/*** switch light management ***/
//update single switch
const switchSingleLightsJS = (id, state) => {
    let checkBox = document.getElementById(id);
    checkBox.checked = state;
    if (state) {
        checkBox.parentElement.classList.add("checked");
        checkBox.parentElement.parentElement.parentElement.classList.add("active");
    } else {
        checkBox.parentElement.classList.remove("checked");
        checkBox.parentElement.parentElement.parentElement.classList.remove("active");
    }
}

//update single switch UI & firebase state 
const updateSingleSwitchStateLightsJS = (ref, id, state) => {
    console.log(ref, id, state);
    switchSingleLightsJS(id, state);
    if (state) {
        database.ref(ref + id).update({
            Status: "ON"
        });
    } else {
        database.ref(ref + id).update({
            Status: "OFF"
        });
    }
}

//update group switchs UI & firebase status
const updateGroupSwitchsStatesLightsJS = (ref, action) => {
    let lightsList = undefined;
    if (ref === "Lights/Interior_Lights/") {
        lightsList = document.querySelectorAll(".interiorLightSwitchLightsJS");
    } else if (ref === "Lights/Exterior_Lights/") {
        lightsList = document.querySelectorAll(".exteriorLightSwitchLightsJS");
    }

    for (let i = 0; i < lightsList.length; i++) {
        updateSingleSwitchStateLightsJS(ref, lightsList[i].id, action == "all-on" ? true : false)
    }
}

//function to setup a new light DOM in the UI
const setupLights = (data, lightType) => {
    //update the switchs key
    let key = 0,
        ref = "",
        dataCount = 0,
        allOnOffLightDOM,
        lightsKey = 0,
        dataTab = new Array();

    //define the needed var selon light type
    if (lightType === "interiorLight") {
        ref = "Lights/Interior_Lights/";
        dataTab = indexInteriorLightSwitch;
        dataCount = interiorLightsCount;
        allOnOffLightDOM = allOnOffInteriorLightDOM;
        lightsKey = interiorLightsKey;
    } else if (lightType === "exteriorLight") {
        ref = "Lights/Exterior_Lights/";
        dataTab = indexExteriorLightSwitch;
        dataCount = exteriorLightsCount;
        allOnOffLightDOM = allOnOffExteriorLightDOM;
        lightsKey = exteriorLightsKey;
    }

    let html = "";
    if (dataCount > 0) {
        let deleteAllButton = ` <button type="button" id="${lightType}DeleteAll" class="btn btn-link ml-auto" title="Delete All" ref="${ref}" onclick="deleteAllLightSwitcher(this.getAttribute('ref'))">
                                    <svg class="icon-sprit" style="width: 2rem;height: 2rem;"><use xlink:href="./assets/images/icons-sprite.svg#delete"/></svg>
                                </button>`;
        data.forEach((childSnapshot) => {
            //to get the last switch key.
            key = parseInt(childSnapshot.key[childSnapshot.key.length - 1]);
            //console.log(`**Before:\nkey: ${key}\nlightsKey: ${lightsKey}`);
            if (key > lightsKey) {
                lightsKey = key;
            }
            //console.log(`**End:\nkey: ${key}\nlightsKey: ${lightsKey}`);
            //Remplissez Ref-Index Tab with lights data Object
            dataTab[childSnapshot.val().Index] = childSnapshot;
            //get the taked GPIOs
            GPIO[childSnapshot.val().Button_Pin] = 1;
            GPIO[childSnapshot.val().Output_Pin] = 1;
            //create the switch light html DOM
            html += addNewLightSwitch(childSnapshot, lightType);
        });
        //if switch light num > 0 so we must insert the delete all button
        allOnOffLightDOM.insertAdjacentHTML("beforeend", deleteAllButton);
    } else {
        //if there is no light we insert the no lights DOM
        html = `<!-- NO light Card -->
                <div class="col-sm-12 col-md-6 col-xl-4" id="NO${lightType}Card">
                    <div class="card">
                        <div class="card-body justify-content-start">
                            <h5 style="text-align: center;">No ${lightType.substring(0,7)} light switch</h5>
                        </div>
                        <hr class="my-0">
                        <!-- CRUD part START -->
                        <div class="borderless" style="text-align: right;">
                            <button type="button" class="btn btn-link" title="Insert Light Right" ref=${ref}  lightType="${lightType}" index="0" onclick="showCreateNewLightModal(this.getAttribute('lightType'), this.getAttribute('ref'),this.getAttribute('index'),this.getAttribute('title')); "> 
                                <svg class="icon-sprit" style="width: 1.58rem;height: 1.58rem;"><use xlink:href="./assets/images/icons-sprite.svg#insert-light-right"/></svg>
                            </button>
                        </div>
                    </div>
                </div>`;
    }
    if (lightType === "interiorLight") {
        interiorLightsKey = lightsKey;
        allOnOffInteriorLight.insertAdjacentHTML("afterend", html);
        //console.log(`**Interior light\n key: ${key}\n lightsKey: ${lightsKey}\n interiorLightsKey: ${interiorLightsKey}`);
    } else if (lightType === "exteriorLight") {
        exteriorLightsKey = lightsKey;
        allOnOffExteriorLight.insertAdjacentHTML("afterend", html);
        //console.log(`**Exterior light\n key: ${key}\n exteriorLightsKey: ${exteriorLightsKey}`);
    }
    return true;
};

//function to create a new light DOM
const addNewLightSwitch = (snapshot, lightType) => {
    let snapshotVal = snapshot.val(),
        ref = "";

    //define the needed var selon light type
    if (lightType === "interiorLight") {
        ref = "Lights/Interior_Lights/";
    } else if (lightType === "exteriorLight") {
        ref = "Lights/Exterior_Lights/";
    }

    //create the HTML switcher DOM
    let active = "",
        checked = "";
    if (snapshotVal.Status === "ON") {
        active = "active";
        checked = "checked";
    }
    let div = `
            <div class="col-sm-12 col-md-6 col-xl-4" id="${snapshot.key}-card">
                <!-- Light unit START -->
                <div class="card ${active}" data-unit=${snapshot.key}>
                    <!-- Light switch START -->
                    <div class="card-body d-flex flex-row justify-content-start">
                        <svg class="icon-sprite">
                            <use class="glow" fill="url(#radial-glow)" xlink:href="../assets/images/icons-sprite.svg#glow"/>
                            <use xlink:href="../assets/images/icons-sprite.svg#bulb-eco"/>
                        </svg>
                        <h5 id="${snapshot.key}-Name">${snapshotVal.Name}</h5>
                        <label class="switch ml-auto ${checked}">
                            <input type="checkbox" ref="${ref}" class="${lightType}SwitchLightsJS" id="${snapshot.key}" onchange="updateSingleSwitchStateLightsJS(this.getAttribute('ref'), this.id, this.checked);"  ${checked}>
                        </label>
                    </div>
                    <!-- Light switch END -->
                    <hr class="my-0">
                    <!-- Bulb details START -->
                    <ul class="list-group borderless px-1" id="switchLightDescription">
                        <li class="list-group-item">
                            <p class="specs">Connection</p>
                            <p class="ml-auto mb-0 text-success">OK</p>
                        </li>
                        <li class="list-group-item pt-0">
                            <p class="specs">Power Consumption</p>
                            <p class="ml-auto mb-0"><span id="${snapshot.key}-PowerConsumption">${snapshotVal.PowerConsumption}</span> W</p>
                        </li>
                        <li class="list-group-item pt-0 pb-4">
                            <p class="specs">Voltage</p>
                            <p class="ml-auto mb-0"><span id="${snapshot.key}-Voltage">${snapshotVal.Voltage}</span> V</p>
                        </li>
                    </ul>
                    <!-- Bulb details END -->
                    <hr class="my-0">
                    <!-- CRUD part START -->
                    <div class="d-flex flex-row justify-content-start" id="${snapshot.key}-CRUDelement" ref="${ref}" lightType="${lightType}" switchKey="${snapshot.key}" index="${snapshotVal.Index}">
                        <!--
                        <button type="button" class="btn btn-link" title="Timer" onclick="showTimersListModal(this.parentElement.getAttribute('switchKey'));"> 
                            <svg class="icon-sprit" style="width: 1.2rem;height: 1.2rem;"><use xlink:href="./assets/images/icons-sprite.svg#alarm-clock"/></svg>
                        </button>
                        -->
                        <button type="button" class="btn btn-link ml-auto" title="Insert Light Left" onclick="showCreateNewLightModal(this.parentElement.getAttribute('lightType'), this.parentElement.getAttribute('ref'),this.parentElement.getAttribute('index'),this.getAttribute('title'));"> 
                            <svg class="icon-sprit" style="width: 1.58rem;height: 1.58rem;"><use xlink:href="./assets/images/icons-sprite.svg#insert-light-left"/></svg>
                        </button>
                        <button type="button" class="btn btn-link ml-1" title="Insert Light Right" onclick="showCreateNewLightModal(this.parentElement.getAttribute('lightType'), this.parentElement.getAttribute('ref'),this.parentElement.getAttribute('index'),this.getAttribute('title'));"> 
                            <svg class="icon-sprit" style="width: 1.58rem;height: 1.58rem;"><use xlink:href="./assets/images/icons-sprite.svg#insert-light-right"/></svg>
                        </button>
                        <button type="button" class="btn btn-link ml-1" title="Edit" onclick="showEditLightSwitchModal(this.parentElement.getAttribute('ref'), this.parentElement.getAttribute('switchKey'))">
                            <svg class="icon-sprit" style="width: 1rem;height: 1rem;"><use xlink:href="./assets/images/icons-sprite.svg#edit"/></svg>
                        </button>
                        <button type="button" class="btn btn-link ml-1" title="Delete" onclick="deleteLightSwitcher(this.parentElement.getAttribute('ref'), this.parentElement.getAttribute('switchKey'))">
                            <svg class="icon-sprit" style="width: 1rem;height: 1rem;"><use xlink:href="./assets/images/icons-sprite.svg#delete"/></svg>
                        </button>
                    </div>
                </div>
                <!-- Light unit END -->
            </div>
            `;
    return div;
}

//function to add a new light data/DOM to the dataTab/UI on realtime when a new light switch is created
const updateUIAddedChild = (snapshot, lightType) => {
    //get the new instance index
    let idx = snapshot.val().Index,
        lightCount, ref,
        dataTab = new Array(),
        allOnOffLightDOM,
        allOnOffLight;
    console.log("interiorLightsKey before", interiorLightsKey);
    console.log("exteriorLightsKey before", exteriorLightsKey);
    if (lightType == "interiorLight") {
        ref = "Lights/Interior_Lights/";
        dataTab = indexInteriorLightSwitch;
        allOnOffLight = allOnOffInteriorLight;
        allOnOffLightDOM = allOnOffInteriorLightDOM;
        //update the total number of switchs for all clients
        interiorLightsCount += 1;
        lightCount = interiorLightsCount;
        interiorLightsKey += 1;
    } else if (lightType == "exteriorLight") {
        ref = "Lights/Exterior_Lights/";
        dataTab = indexExteriorLightSwitch;
        allOnOffLight = allOnOffExteriorLight;
        allOnOffLightDOM = allOnOffExteriorLightDOM;
        //update the total number of switchs for all clients
        exteriorLightsCount += 1;
        lightCount = exteriorLightsCount;
        exteriorLightsKey += 1;
    }
    console.log("interiorLightsKey after", interiorLightsKey);
    console.log("exteriorLightsKey after", exteriorLightsKey);

    //update the Pins status Tab for all clients
    GPIO[snapshot.val().Button_Pin] = 1;
    GPIO[snapshot.val().Output_Pin] = 1;
    //update the Index-Ref Tab for all clients
    dataTab.splice(idx, 0, snapshot);
    for (let i = idx + 1; i < dataTab.length; i++) {
        dataTab[i].val().Index = i;
    }

    //update the UI 
    if (idx === 1) {
        if (lightCount > 1) {
            document.getElementById(dataTab[2].key + "-card").insertAdjacentHTML("beforebegin", addNewLightSwitch(snapshot, lightType));
        } else if (lightCount == 1) {
            let noLightCard = document.getElementById(`NO${lightType}Card`);
            if (typeof(noLightCard) != undefined && noLightCard != null) {
                noLightCard.remove();
            }
            let deleteAllButton = `
                            <button type="button" id="${lightType}DeleteAll" class="btn btn-link ml-auto" title="Delete All" ref="${ref}" onclick="deleteAllLightSwitcher(this.getAttribute('ref'))">
                               <svg class="icon-sprit" style="width: 2rem;height: 2rem;"><use xlink:href="./assets/images/icons-sprite.svg#delete"/></svg>
                            </button>
                           `;
            allOnOffLightDOM.insertAdjacentHTML("beforeend", deleteAllButton);
            allOnOffLight.insertAdjacentHTML("afterend", addNewLightSwitch(snapshot, lightType));
        }
    } else {
        document.getElementById(dataTab[idx - 1].key + "-card").insertAdjacentHTML("afterend", addNewLightSwitch(snapshot, lightType));
    }

    //update other cards CRUD buttons index
    for (let i = idx + 1; i < dataTab.length; i++) {
        document.getElementById(dataTab[i].key + "-CRUDelement").setAttribute("Index", i);
    }
}

//function to remove light DOM to the UI and update the dataTab on realtime when a light switch is removed
const updateUIRemovedChild = (snapshot, lightType) => {
    //get the snapshop value
    let snapshotVal = snapshot.val(),
        lightCount = 0,
        dataTab = new Array();


    if (lightType === "interiorLight") {
        dataTab = indexInteriorLightSwitch;
        //update the switch total number
        interiorLightsCount -= 1;
        lightCount = interiorLightsCount;
    } else if (lightType === "exteriorLight") {
        dataTab = indexExteriorLightSwitch;
        //update the switch total number
        exteriorLightsCount -= 1;
        lightCount = exteriorLightsCount;
    }


    //remove the light object from data tab
    dataTab.splice(parseInt(snapshotVal), 1);
    //update the indexs of other light objects
    for (let i = snapshotVal.Index; i < dataTab.length; i++) {
        dataTab[i].val().Index = i;
    }

    //update other cards CRUD buttons index
    for (let i = snapshotVal.Index; i < dataTab.length; i++) {
        let CRUDelement = document.getElementById(dataTab[i].key + "-CRUDelement");
        if (typeof(CRUDelement) != undefined && CRUDelement != null) {
            CRUDelement.setAttribute("Index", i);
        }
    }

    //update the GPIOs Tab
    GPIO[parseInt(snapshotVal.Button_Pin)] = 0;
    GPIO[parseInt(snapshotVal.Output_Pin)] = 0;

    //update the UI by removing the concerning card
    document.getElementById(snapshot.key + "-card").remove();
    if (lightCount == 0) {
        document.getElementById(`${lightType}DeleteAll`).remove();
        setupLights(snapshot, lightType);
        interiorLightsKey = 0;
        if (lightType == "interiorLight") {
            interiorLightsKey = 0;
            indexInteriorLightSwitch = new Array(undefined);
            console.log(lightType + "deleted all");
        } else if (lightType == "exteriorLight") {
            console.log(lightType + "deleted all");
            exteriorLightsKey = 0;
            indexExteriorLightSwitch = new Array(undefined);
        }
    }
}

//function to update the dataTab/UI on realtime when a child dtails are changed
const updateUIChangedChild = (snapshot, lightType) => {
    let dataTab = new Array();

    if (lightType == "interiorLight") {
        dataTab = indexInteriorLightSwitch;
    } else if (lightType == "exteriorLight") {
        dataTab = indexExteriorLightSwitch;
    }

    let idx = switchlightKeys(dataTab).indexOf(snapshot.key),
        oldSnapshotVal = dataTab[idx].val(),
        newSnapshotVal = snapshot.val(),
        changed = false;

    //try to figure out the edited data
    //check if the data is updated
    if (oldSnapshotVal.Name != newSnapshotVal.Name) {
        document.getElementById(snapshot.key + "-Name").innerText = newSnapshotVal.Name;
        changed = true;
    }
    //check if the Output_Pin is updated
    if (oldSnapshotVal.Output_Pin != newSnapshotVal.Output_Pin) {
        GPIO[oldSnapshotVal.Output_Pin] = 0;
        GPIO[newSnapshotVal.Output_Pin] = 1;
        changed = true;
    }
    //check if the Button_Pin is updated
    if (oldSnapshotVal.Button_Pin != newSnapshotVal.Button_Pin) {
        GPIO[oldSnapshotVal.Button_Pin] = 0;
        GPIO[newSnapshotVal.Button_Pin] = 1;
        changed = true;
    }
    //check if the Status is updated
    if (oldSnapshotVal.Status != newSnapshotVal.Status) {
        if (newSnapshotVal.Status == "ON") {
            switchSingleLightsJS(snapshot.key, true);
        } else if (newSnapshotVal.Status == "OFF") {
            switchSingleLightsJS(snapshot.key, false);
        }
        changed = true;
    }
    //check if the PowerConsumption is updated
    if (oldSnapshotVal.PowerConsumption != newSnapshotVal.PowerConsumption) {
        document.getElementById(snapshot.key + "-PowerConsumption").innerText = newSnapshotVal.PowerConsumption;
        changed = true;
    }
    //check if the Voltage is updated
    if (oldSnapshotVal.Voltage != newSnapshotVal.Voltage) {
        document.getElementById(snapshot.key + "-Voltage").innerText = newSnapshotVal.Voltage;
        changed = true;
    }
    if (changed) {
        dataTab[idx] = snapshot;
    }
}


/******************************************************************************************************/
/*** Interior Lights control part ***/
//update the UI when a new interior light switch is added 
interiorLightsRef.on("child_added", (snapshot) => {
    if (interiorLightAlreadyLoaded) {
        updateUIAddedChild(snapshot, "interiorLight");
    }
});

//update other clients when a switch light is removed
interiorLightsRef.on("child_removed", (snapshot) => {
    if (interiorLightAlreadyLoaded) {
        updateUIRemovedChild(snapshot, "interiorLight");
    }
});

//update other clients if certain data is updated
interiorLightsRef.on("child_changed", (snapshot) => {
    if (interiorLightAlreadyLoaded) {
        updateUIChangedChild(snapshot, "interiorLight");
    }
});

/******************************************************************************************************/
/*** Exterior Lights control part ***/
//update the UI when a new exterior light switch is added 
exteriorLightsRef.on("child_added", (snapshot) => {
    if (exteriorLightAlreadyLoaded) {
        updateUIAddedChild(snapshot, "exteriorLight");
    }
});

//update other clients when a switch light is removed
exteriorLightsRef.on("child_removed", (snapshot) => {
    if (exteriorLightAlreadyLoaded) {
        console.log("snapshot.key", snapshot.key);
        console.log("snapshot.val()", snapshot.val());
        updateUIRemovedChild(snapshot, "exteriorLight");
    }
});

//update other clients if certain data is updated
exteriorLightsRef.on("child_changed", (snapshot) => {
    if (exteriorLightAlreadyLoaded) {
        updateUIChangedChild(snapshot, "exteriorLight");
    }
});