const DEFAULT_PATH = "./window_scripts/";

class ClickableWindow {
    constructor(buttonElement, windowElement, scriptPath = undefined ) {
        this.button = buttonElement;
        this.window = windowElement;

        this.isWindowVisible = false;
        this.alreadyClicked = false;

        this.button.bind("click", () => {
            if (this.alreadyClicked) {
                this.alreadyClicked = false;
                return;
            }
            this.toggleWindow();
        });

        $(document).mouseup((e) => {
            this.alreadyClicked = false;
            if (this.isWindowVisible && this.window.has(e.target).length === 0) {
                this.alreadyClicked = true;
                this.hideWindow();
            }
        });

        if(scriptPath !== undefined)
            import(DEFAULT_PATH + scriptPath + ".js")
                .then(({ default: Clazz }) => {
                    this.windowScript = new Clazz(this.window);
                });

        this.displayStatus();
    }

    showWindow() {
        this.window.css("display", "block");
        this.isWindowVisible = true;
        if (this.windowScript !== undefined)
            this.windowScript.run();
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

    displayStatus() {
        console.log("New window created : " + this.window.attr("id") + " attached to : " + this.button.attr("id"));
    }
}

export { ClickableWindow };