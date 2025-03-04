import {OverlayEditMenu} from "./overlay.js";
import {selectObject} from "../../AGRE/src/core/listeners.js";
import {masterRenderer} from "../../AGRE/src/core/renderer.js";
import {Sphere, Plane} from "../../AGRE/src/objects/objects.js";

const overlayMenu = document.getElementById("findObject-overlay");

const objectsList = document.getElementById("objectsList");

const selectFoundObject_button = document.getElementById("selectFoundObject-button");
const openMenu_button = document.getElementById("openFindObjectMenu-button");
const hideMenu_button = document.getElementById("hide-findObject-overlay-button");

const errorMessageDiv = document.getElementById("find-object-error-message");


export class FindObjectOverlay extends OverlayEditMenu {
    constructor(objectHeaders, objectLookup) {
        super();

        this.objectHeaders = objectHeaders;
        this.objectLookup = objectLookup;

        this.bindPermanantEvents();
    }

    async updateFinderListObjects() {
        if (this.hidden) {
            return;
        }

        for (const option of objectsList) {
            const name = option.value;
            const object = this.objectLookup[name];
    
            let typeName;
            if (object instanceof Sphere) {
                typeName = "particle";

                const pos = {
                    x: Math.round(object.x * 1000) / 1000,
                    y: Math.round(object.y * 1000) / 1000,
                    z: Math.round(object.z * 1000) / 1000, 
                }
        
                if (pos.x !== object.x) {
                    pos.x += "...";
                }
                if (pos.y !== object.y) {
                    pos.y += "...";
                }
                if (pos.z !== object.z) {
                    pos.z += "...";
                }
        
                option.value = name;
                option.textContent = `${typeName}: ${name} {x: ${pos.x}, y: ${pos.y}, z: ${pos.z}}`;
            }
        }
    }

    loadObjectsToFinderList() {
        const objectList = objectsList;
        objectList.replaceChildren();
    
        for (const obj of masterRenderer.objects) {
            const option = document.createElement("option");
    
            let typeName;
            if (obj instanceof Sphere) {
                typeName = "particle";
            }
            else if (obj instanceof Plane) {
                typeName = "plane";
            }
    
            let pos = {
                x: Math.round(obj.x * 1000) / 1000,
                y: Math.round(obj.y * 1000) / 1000,
                z: Math.round(obj.z * 1000) / 1000, 
            }
    
            if (pos.x !== obj.x) {
                pos.x += "...";
            }
            if (pos.y !== obj.y) {
                pos.y += "...";
            }
            if (pos.z !== obj.z) {
                pos.z += "...";
            }
    
            option.value = obj.name;
            option.textContent = `${typeName}: ${obj.name} {x: ${pos.x}, y: ${pos.y}, z: ${pos.z}}`;
            objectList.appendChild(option);
        }
    }

    show() {
        super.show();

        overlayMenu.classList.remove("hidden");
        document.addEventListener("keydown", this.keyEvents);

        this.loadObjectsToFinderList();
    }

    hide() {
        super.hide();

        errorMessageDiv.textContent = ""; //clear prev msgs

        overlayMenu.classList.add("hidden");
        document.removeEventListener("keydown", this.keyEvents);
    }

    submit() {
        const selectedObject = objectsList.value;
        if (! selectedObject) {
            errorMessageDiv.textContent = "No object selected";
            return;
        }
    
        const noOfObjects = masterRenderer.objects.length;
        for (let i = 0; i < noOfObjects; i++) {
            if (masterRenderer.objects[i].name === selectedObject) {
                if (masterRenderer.currentSelection !== i) {
                    selectObject(i, true);
                }
                break;
            }
        }

        super.submit();
    }

    keyEvents(event) {
        if (event.key === "Escape") {
            if (objectsList.value !== "") {
                objectsList.value = "";
            }
            else {
                this.hide();
            }
        }
    }

    bindPermanantEvents() {
        super.bindPermanantEvents();

        selectFoundObject_button.addEventListener("pointerup", this.submit.bind(this));
        openMenu_button.addEventListener("pointerup", this.show.bind(this));
        hideMenu_button.addEventListener("pointerup", this.hide.bind(this));
        overlayMenu.addEventListener("pointerup", (event) => {
            if (event.target === overlayMenu) {
                this.hide(); 
            }
        });
    }
}