import { logger } from "./Logger.js";

const DEFAULT_PATH = "./window_scripts/";
const TOP_OFFSET = -16;
const LEFT_OFFSET = 57;

class ClickableWindow {
    constructor(buttonElement, windowElement, scriptPath = undefined, isFixed = false) {
        this.buttons = [];
        this.window = windowElement;
        this.isFixed = isFixed;

        this.isWindowVisible = false;
        this.alreadyClicked = false;

        this.lastButtonClicked = undefined;

        this.addListener(buttonElement)

        $(document).mouseup((e) => {
            this.alreadyClicked = false;
            if (this.isWindowVisible && this.window.has(e.target).length === 0) {
                this.alreadyClicked = true;
                this.hideWindow();
            }
        });

        const closeButton = this.window.find(".close-button");
        if(closeButton.length > 0)
            closeButton.bind("click", () => {
                this.hideWindow();
            });

        if(scriptPath !== undefined)
            import(DEFAULT_PATH + scriptPath + ".js")
                .then(({ default: Clazz }) => {
                    this.windowScript = new Clazz(buttonElement, this.window);
                });

        this.displayStatus();
    }

    showWindow() {
        if (this.windowScript !== undefined) {
            if(this.buttons.length > 1)
                this.windowScript.setTrigger(this.lastButtonClicked);
            this.windowScript.run();
        }

        this.window.css("display", "flex");
        this.isWindowVisible = true;

        if(this.isFixed) {
            this.window.css("top", this.lastButtonClicked.offset().top + TOP_OFFSET);
            this.window.css("left", this.lastButtonClicked.offset().left + LEFT_OFFSET);
        }
    }

    hideWindow() {
        this.window.css("display", "none");
        this.isWindowVisible = false;
    }

    toggleWindow() {
        if (this.isWindowVisible)
            this.hideWindow();
        else
            this.showWindow();
    }

    addListener(buttonElement) {
        this.buttons.push(buttonElement);
        buttonElement.bind("click", () => {
            if (this.alreadyClicked) {
                this.alreadyClicked = false;
                return;
            }
            if(this.lastButtonClicked !== buttonElement) {
                this.lastButtonClicked = buttonElement;
                this.showWindow();
            } else
                this.toggleWindow();
        });
    }

    displayStatus() {
        logger.log("New window created : " + this.window.attr("id") + " attached to " + this.buttons.length + " buttons");
    }

}

export { ClickableWindow };