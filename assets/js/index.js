var interiorLightLoaded = false,
    exteriorLightLoaded = false,
    interiorLightNum = 0,
    exteriorLightNum = 0;

const interiorLightsList = document.getElementById("interior-lights"),
    exteriorLightsList = document.getElementById("exterior-lights");


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
/*** switch light management ***/
//update single switch
function switchSingle(id, state) {
    let checkBox = document.getElementById(id);
    checkBox.checked = state;
    switch (state) {
        case true:
            checkBox.parentElement.classList.add("checked");
            checkBox.parentElement.parentElement.classList.add("active");
            break;
        case false:
            checkBox.parentElement.classList.remove("checked");
            checkBox.parentElement.parentElement.parentElement.classList.remove("active");
            break;
    }
}

//update single switch UI & firebase state 
function updateSingleSwitchState(ref, id, state) {
    switchSingle(id, state);
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
function updateGroupSwitchsStates(ref, action) {
    let interiorLightsSwitchIdList = document.querySelectorAll(".interiorLightSwitch");

    let state = action == "all-on" ? "ON" : "OFF";

    for (let i = 0; i < interiorLightsSwitchIdList.length; i++) {
        switchSingle(interiorLightsSwitchIdList[i].id, action == "all-on" ? true : false);
        database.ref(ref + interiorLightsSwitchIdList[i].id).update({
            Status: state
        });
    }
}

//function to setup a new light DOM in the UI
const setupLightsInIndex = (data, lightType) => {
    if (data.numChildren()) {
        let html = "";
        data.forEach((childSnapshot) => {
            html += addNewLightSwitchInIndex(childSnapshot, lightType);
        });
        if (lightType === "interiorLight") {
            interiorLightsList.innerHTML = html;
        } else if (lightType === "exteriorLight") {
            exteriorLightsList.innerHTML = html;
        }
    }
};

//function to create a new light DOM
function addNewLightSwitchInIndex(snapshot, lightType) {
    let snapshotVal = snapshot.val(),
        active = "",
        checked = "",
        DOMelet = "";

    if (snapshotVal.Status === "ON") {
        active = "active";
        checked = "checked";
    }
    if (lightType === "interiorLight") {
        DOMelet = `  <li class="list-group-item d-flex ${active}" data-unit="${snapshot.key}" data-index="${snapshotVal.Index}" id="${snapshot.key}-card" ref="Lights/Interior_Lights/">
                        <svg class="icon-sprite">
                            <use class="glow" fill="url(#radial-glow)" xlink:href="./assets/images/icons-sprite.svg#glow"/>
                            <use xlink:href="./assets/images/icons-sprite.svg#bulb-eco"/>
                        </svg>
                        <h5 id="${snapshot.key}-Name">${snapshotVal.Name}</h5>
                        <label class="switch ml-auto ${checked}">
                            <input type="checkbox" class="interiorLightSwitch" id="${snapshot.key}" onchange="updateSingleSwitchState(this.parentElement.parentElement.getAttribute('ref'), this.id, this.checked);"  ${checked}>
                        </label>
                    </li>`;
    } else if (lightType === "exteriorLight") {
        DOMelet = ` <div class="card  ${active}" data-unit="${snapshot.key}" data-index="${snapshotVal.Index}" id="${snapshot.key}-card" ref="Lights/Exterior_Lights/">
                        <div class="card-body d-flex">
                            <svg class="icon-sprite">
                                <use class="glow" fill="url(#radial-glow)" xlink:href="./assets/images/icons-sprite.svg#glow"/>
                                <use xlink:href="./assets/images/icons-sprite.svg#bulb-eco"/>
                            </svg>
                            <h5 id="${snapshot.key}-Name">${snapshotVal.Name}</h5>
                            <label class="switch ml-auto ${checked}">
                                <input type="checkbox" id="${snapshot.key}" class="exteriorLightSwitch" onchange="updateSingleSwitchState(this.parentElement.parentElement.parentElement.getAttribute('ref'), this.id, this.checked);"  ${checked}>
                            </label>
                        </div>
                    </div>`;
    }

    return DOMelet;
}

//function to add a new light data/DOM to the dataTab/UI on realtime when a new light switch is created
const updateUIAddedChildInIndex = (snapshot, lightType) => {
    let lightList, lightNum, Dom;
    if (lightType == "interiorLight") {
        lightList = interiorLightsList;
        lightNum = interiorLightNum;
        Dom = "li";
    } else if (lightType == "exteriorLight") {
        lightList = exteriorLightsList;
        lightNum = exteriorLightNum;
        Dom = "div";
    }
    //get light index
    let idx = snapshot.val().Index;
    //See if it's the  first card to erase the NoLights one else to inser it in the good position
    if (idx == 1) {
        if (lightNum == 1) {
            //pour ecraser no interior light switch card
            lightList.innerHTML = addNewLightSwitchInIndex(snapshot, lightType);
        } else if (lightNum > 1) {
            lightList.insertAdjacentHTML("afterbegin", addNewLightSwitchInIndex(snapshot, lightType));
        }
    } else if (idx > 1) {
        document.querySelector(`${Dom}[data-index='${idx-1}']`).insertAdjacentHTML("afterend", addNewLightSwitchInIndex(snapshot, lightType));
    }
}

//function to update the dataTab/UI on realtime when a child dtails are changed
const updateUIChangedChildInIndex = (snapshot) => {
    let snapshotVal = snapshot.val();
    //check if the name is changed
    if (snapshotVal.Name != document.getElementById(`${snapshot.key}-Name`).innerText) {
        document.getElementById(snapshot.key).innerText = snapshotVal.Name;
    }
    //check if the Index is changed
    if (snapshotVal.Index != document.getElementById(`${snapshot.key}-card`).getAttribute("data-index")) {
        document.getElementById(`${snapshot.key}-card`).setAttribute("data-index", snapshotVal.Index)
    }
    //check if the checkBox state is changed
    let state;
    if (snapshotVal.Status === "ON") {
        state = true;
    } else if (snapshotVal.Status === "OFF") {
        state = false;
    }
    switchSingle(snapshot.key, state);
}

//function to remove light DOM to the UI and update the dataTab on realtime when a light switch is removed
const updateUIRemovedChild = (snapshot, lightType) => {
    let lightList, lightNum;
    if (lightType == "interiorLight") {
        lightList = interiorLightsList;
        lightNum = interiorLightNum;
    } else if (lightType == "exteriorLight") {
        lightList = exteriorLightsList;
        lightNum = exteriorLightNum;
    }
    //update the UI by removing the concerning card
    document.getElementById(snapshot.key + "-card").remove();
    if (lightNum == 0) {
        lightList.innerHTML = ` <li class="list-group-item d-flex active" data-unit="switch-light">
                                    <h5 class="center-align">No interior light switch</h5>
                                </li>`;
    }
}


/******************************************************************************************************/
/*** Interior Lights control part ***/
//get data when the page is loaded
interiorLightsRef.orderByChild("Index").once('value', (snapshot) => {
    if (snapshot.numChildren() > 0) {
        setupLightsInIndex(snapshot, "interiorLight");
        interiorLightNum = snapshot.numChildren();
    } else if (snapshot.numChildren() == 0) {
        interiorLightsList.innerHTML = ` <li class="list-group-item d-flex active" data-unit="switch-light">
                                            <h5 class="center-align">No interior light switch</h5>
                                        </li>`;
    }
    //active the firebase listner after the page is completely loaded
    interiorLightLoaded = true;
});

//update the UI when a new interior light switcher is added 
interiorLightsRef.on("child_added", (snapshot) => {
    if (interiorLightLoaded) {
        interiorLightNum += 1;
        updateUIAddedChildInIndex(snapshot, "interiorLight");
    }
});

//update other clients UI when an interior light switch state is updated
interiorLightsRef.on('child_changed', (snapshot) => {
    if (interiorLightLoaded) {
        updateUIChangedChildInIndex(snapshot);
    }
});

//update other clients UI when an interior light switch state is updated
interiorLightsRef.on('child_removed', (snapshot) => {
    if (interiorLightLoaded) {
        interiorLightNum -= 1;
        updateUIRemovedChild(snapshot, "interiorLight");
    }
});

/******************************************************************************************************/
/*** Exterior Light part ***/
//setup the exterior Lights DOM when the window is loaded
exteriorLightsRef.orderByChild("Index").once('value', (snapshot) => {
    if (snapshot.numChildren() > 0) {
        setupLightsInIndex(snapshot, "exteriorLight");
        exteriorLightNum = snapshot.numChildren();
    } else if (snapshot.numChildren() == 0) {
        interiorLightsList.innerHTML = `<div class="card">
                                            <div class="card-body d-flex">
                                                <h5 class="center-align">No exterior light switch</h5>
                                            </div>
                                        </div>`;
    }
    //active the firebase listner after the page is completely loaded
    exteriorLightLoaded = true;
});

//update the UI when a new exterior light switcher is added 
exteriorLightsRef.on("child_added", (snapshot) => {
    if (interiorLightLoaded) {
        exteriorLightNum += 1;
        updateUIAddedChildInIndex(snapshot, "exteriorLight");
    }
});

//update other clients UI when an exterior light switch state is updated
exteriorLightsRef.on('child_changed', (snapshot) => {
    if (exteriorLightLoaded) {
        updateUIChangedChildInIndex(snapshot);
    }
});

//update other clients UI when an interior light switch state is updated
exteriorLightsRef.on('child_removed', (snapshot) => {
    if (exteriorLightLoaded) {
        exteriorLightNum -= 1;
        updateUIRemovedChild(snapshot, "exteriorLight");
    }
});