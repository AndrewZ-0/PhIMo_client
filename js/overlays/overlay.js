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
        if (!! this.showCallback) {
            this.showCallback();
        }
    }
    bindShowCallback(showCallback) {
        this.showCallback = showCallback;
    }

    hide() {
        if (!! this.hideCallback) {
            this.hideCallback();
        }
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