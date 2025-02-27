export let currentSelection = null;

export function toggleTab(tabId) {
    const tab = document.getElementById(tabId + "Tab");
    const tabMenu = document.getElementById(tabId + "Menu");
    const overlays = document.getElementById("overlays");

    if (tabId === currentSelection) {
        tab.classList.remove("focus");
        tabMenu.classList.add("hidden");

        overlays.style.left = "0px";

        currentSelection = null;   
    }
    else {
        if (currentSelection !== null) {
            document.getElementById(currentSelection + "Tab").classList.remove("focus");
            document.getElementById(currentSelection + "Menu").classList.add("hidden");
        }
        else {
            overlays.style.left = "120px";
        }

        tab.classList.add("focus");
        tabMenu.classList.remove("hidden");

        currentSelection = tabId;
    }
}