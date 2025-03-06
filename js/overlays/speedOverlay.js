import {OverlayEditMenu} from "./overlay.js";

const overlayMenu = document.getElementById("speedMenu-overlay");

const openMenuButton = document.getElementById("speedButton");
const hideMenuButton = document.getElementById("hide-speedMenu-overlay-button");

const speed_element = document.getElementById("speedInput");

const errorMessageDiv = document.getElementById("speedMenu-error-message");

export class SpeedEditOverlay extends OverlayEditMenu {
    constructor(settingsData, player, markUnsavedChanges) {
        super();

        this.settingsData = settingsData;
        this.player = player;
        this.markUnsavedChanges = markUnsavedChanges.bind(this);

        this.bindPermanantEvents();
    }

    show() {
        super.show();

        speed_element.value = this.settingsData.speed;

        overlayMenu.classList.remove("hidden");
        document.addEventListener("keydown", this.keyEvents);
    }

    hide() {
        super.hide();

        errorMessageDiv.textContent = ""; //clear prev msgs

        overlayMenu.classList.add("hidden");
        document.removeEventListener("keydown", this.keyEvents);
    }

    validateSpeed() {
        errorMessageDiv.textContent = ""; //clear prev msgs
    
        const speed = parseFloat(speed_element.value);
        if (isNaN(speed) || speed <= 0) {
            errorMessageDiv.textContent = "Playback Speed must be a positive non-zero float";
            return false;
        }
        return true;
    }

    setSpeed() {
        if (! this.validateSpeed()) {
            return;
        }
    
        const speed = parseFloat(speed_element.value);
    
        this.settingsData.speed = speed;
        this.player.setSpeedFactor(speed);

        this.markUnsavedChanges("low");
    }

    submit() {
        super.submit();

        this.setSpeed();
    
        this.hide();
    }

    keyEvents(event) {
        if (event.key === "Escape") {
            this.hide();
        }
        else if (event.key === "Enter") {
            this.submit();
        }
    }

    bindPermanantEvents() {
        super.bindPermanantEvents();

        openMenuButton.addEventListener("pointerup", this.show);
        hideMenuButton.addEventListener("pointerup", this.hide);
        overlayMenu.addEventListener("pointerup", (event) => {
            if (event.target === overlayMenu) {
                this.hide(); 
            }
        });

        speed_element.addEventListener("input", this.setSpeed.bind(this));
    }
}