import { set } from "./utils";

window.addEventListener("message", handshake);
window.__alpineDevtool = {};

function handshake(e) {
    if (e.data.source === "alpine-devtools-proxy" && e.data.payload === "init") {
        window.removeEventListener("message", handshake);
        window.addEventListener("message", handleMessages);

        discoverComponents();

        document.querySelectorAll("[x-data]").forEach((el) => observeNode(el));
    }
}

function handleMessages(e) {
    if (e.data.source === "alpine-devtools-proxy") {
        window.__alpineDevtool.stopMutationObserver = true;

        if (e.data.payload.action == "hover") {
            Alpine.discoverComponents((component) => {
                if (
                    component.__alpineDevtool &&
                    component.__alpineDevtool.id == e.data.payload.componentId
                ) {
                    component.__alpineDevtool.backgroundColor =
                        component.__x.$el.style.backgroundColor;
                    component.__x.$el.style.backgroundColor = "rgba(104, 182, 255, 0.35)";
                }
                setTimeout(() => {
                    window.__alpineDevtool.stopMutationObserver = false;
                }, 10);
            });
        }

        if (e.data.payload.action == "hoverLeft") {
            window.__alpineDevtool.stopMutationObserver = true;

            Alpine.discoverComponents((component) => {
                if (
                    component.__alpineDevtool &&
                    component.__alpineDevtool.id === e.data.payload.componentId
                ) {
                    component.__x.$el.style.backgroundColor =
                        component.__alpineDevtool.backgroundColor;
                }
            });
            setTimeout(() => {
                window.__alpineDevtool.stopMutationObserver = false;
            }, 10);
        }

        if (e.data.payload.action == "editAttribute") {
            Alpine.discoverComponents((component) => {
                if (component.__alpineDevtool.id == e.data.payload.componentId) {
                    const data = component.__x.getUnobservedData();
                    const { attributeSequence, attributeValue } = e.data.payload;

                    // nested path descriptor, eg. array*0*property needs to update array[0].property
                    if (attributeSequence.includes("*")) {
                        // convert array*0*property to array.0.property
                        // to pass to the set function
                        const attributePath = attributeSequence.replace(/\*/g, ".");
                        set(data, attributePath, attributeValue);
                    } else {
                        data[attributeSequence] = attributeValue;
                    }

                    component.__x.$el.setAttribute("x-data", JSON.stringify(data));
                }
                setTimeout(() => {
                    window.__alpineDevtool.stopMutationObserver = false;
                }, 10);
            });
        }
    }
}

function discoverComponents(isThroughMutation = false) {
    var rootEls = document.querySelectorAll("[x-data]");

    var components = [];

    rootEls.forEach((rootEl, index) => {
        Alpine.initializeComponent(rootEl);

        if (!rootEl.__alpineDevtool) {
            rootEl.__alpineDevtool = {};
        }

        if (!isThroughMutation) {
            rootEl.__alpineDevtool.id = Math.floor(Math.random() * 100000 + 1);
        }

        var depth = 0;

        if (index != 0) {
            rootEls.forEach((innerElement, innerIndex) => {
                if (index == innerIndex) {
                    return false;
                }

                if (innerElement.contains(rootEl)) {
                    depth = depth + 1;
                }
            });
        }

        var data = {};

        for (let [key, value] of Object.entries(rootEl.__x.getUnobservedData())) {
            data[key] = {
                value: typeof value === "function" ? "function" : value,
                type: typeof value
            }
        }

        components.push({
            tagName: rootEl.tagName,
            depth: depth,
            data: data,
            index: index,
            id: rootEl.__alpineDevtool.id,
        });
    });

    window.postMessage(
        {
            source: "alpine-devtools-backend",
            payload: {
                components: components,
                type: "render-components",
                isThroughMutation: isThroughMutation,
            },
        },
        "*"
    );
}

function observeNode(node) {
    const observerOptions = {
        childList: true,
        attributes: true,
        subtree: true,
    };

    const observer = new MutationObserver((mutations) => {
        if (!window.__alpineDevtool.stopMutationObserver) {
            discoverComponents((isThroughMutation = true));
        }
    });

    observer.observe(node, observerOptions);
}
