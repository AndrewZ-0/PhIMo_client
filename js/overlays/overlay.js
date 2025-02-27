import {quickReleaseKeys} from "../../AGRE/src/core/listeners.js";

export class OverlayMenu {
    constructor() {
        this.fillCallback = null;
        this.showCallback = null;
        this.hideCallback = null;
        this.submitCallback = null;

        this.fill = this.fill.bind(this);
        this.show = this.show.bind(this);
        this.hide = this.hide.bind(this);
        this.submit = this.submit.bind(this);

        this.keyEvents = this.keyEvents.bind(this);

        this.hidden = true;
    }

    fill() {
        if (!! this.fillCallback) {
            this.fillCallback();
        }
    }
    bindFillCallback(fillCallback) {
        this.fillCallback = fillCallback;
    }

    show() {
        quickReleaseKeys();
        if (!! this.showCallback) {
            this.showCallback();
        }
        this.hidden = false;
    }
    bindShowCallback(showCallback) {
        this.showCallback = showCallback;
    }

    hide() {
        if (!! this.hideCallback) {
            this.hideCallback();
        }
        this.hidden = true;
    }
    bindHideCallback(hideCallback) {
        this.hideCallback = hideCallback;
    }

    submit() {
        if (!! this.submitCallback) {
            this.submitCallback();
        }
        this.hide();
    }
    bindSubmitCallback(submitCallback) {
        this.submitCallback = submitCallback;
    }

    keyEvents() {

    }

    bindPermanantEvents() {

    }

    bindActiveEvents() {

    }
}