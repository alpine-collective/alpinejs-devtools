// This is a content-script that is injected only when the devtools are
// activated. Because it is not injected using eval, it has full privilege
// to the chrome runtime API. It serves as a proxy between the injected
// backend and the Alpine.js devtools panel.

function proxy() {
    const connector = chrome.runtime.connect({
        name: "content-script",
    });

    connector.onMessage.addListener(sendMessageToBackend);
    window.addEventListener("message", sendMessageToDevtools);
    connector.onDisconnect.addListener(handleDisconnect);

    sendMessageToBackend("init");

    function sendMessageToBackend(payload) {
        window.postMessage(
            {
                source: "alpine-devtools-proxy",
                payload: payload,
            },
            "*"
        );
    }

    function sendMessageToDevtools(e) {
        if (e.data && e.data.source === "alpine-devtools-backend") {
            connector.postMessage(e.data.payload);
        } else if (e.data && e.data.source === "alpine-devtools-backend-injection") {
            if (e.data.payload === "listening") {
                sendMessageToBackend("init");
            }
        }
    }

    function handleDisconnect() {
        connector.onMessage.removeListener(sendMessageToBackend);
        window.removeEventListener("message", sendMessageToDevtools);
        sendMessageToBackend("shutdown");
    }
}

proxy();
