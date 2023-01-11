"use strict";

/* global chrome, URL */


function instalationInitStorage() {
    chrome.storage.local.get(function (local) {
        if (!Array.isArray(local.blocked)) {
            chrome.storage.local.set({ blocked: [] });
        }
        if (!Array.isArray(local.temporarilyEnabled)) {
            chrome.storage.local.set({ temporarilyEnabled: [] });
        }
        if (typeof local.doneHabitAt !== "string") {
            let currentTime = (new Date()).toJSON();
            chrome.storage.local.set({ doneHabitAt: currentTime });
        }
        if (!local.freeTime) {
            // default free time 15 minutes
            chrome.storage.local.set({ freeTime: 15 });
        }
        if (!local.alertTime) {
            // default alert time 60 minutes
            chrome.storage.local.set({ alertTime: 60 });
        }
        if (!local.runningHabit) {
            // default running habbit 0 (boolean value)
            chrome.storage.local.set({ runningHabit: 0 });
        }
        if (!local.runningHabitID) {
            // default running habbit id
            chrome.storage.local.set({ runningHabitID: 0 });
        }
    });
};

function pop(freeTime){
    if (freeTime<60){	
        alert ("mensaje");
    }
}

function validateUrl(url) {
    if (!url || !url.startsWith("http")) {
        return false;
    }
    return true;
}

function checkTemporarilyEnabled(temporarilyEnabled, doneHabitAt, freeTime) {
    if (Array.isArray(temporarilyEnabled) && temporarilyEnabled.length > 0) {
        let now = new Date();
        let doneAt = new Date(doneHabitAt);
        let diff = parseInt(Math.abs(doneAt.getTime() - now.getTime()) / (1000 * 60) % 60);
        console.log(diff)

        if (diff >= freeTime) {
            chrome.storage.local.set({ blocked: temporarilyEnabled });
            chrome.storage.local.set({ temporarilyEnabled: [] });
            chrome.storage.local.set({ runningHabit: 0 });
            return false;
        }
    }
    
    return true;
};

function blockUrl(blocked, hostname) {
    if (Array.isArray(blocked) && blocked.find(domain => hostname.includes(domain))) {
        var newURL = chrome.runtime.getURL('minder.html');
        chrome.tabs.update(undefined, { url: newURL });
    }
};

function doneUrl(blocked, hostname) {
    if (Array.isArray(blocked) && blocked.find(domain => hostname.includes(domain))) {
        var newURL = chrome.runtime.getURL('done.html');
        chrome.tabs.update(undefined, { url: newURL });
    }
};

chrome.runtime.onInstalled.addListener(function () { instalationInitStorage(); });

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    const url = tab.url;
    if (validateUrl(url)) {
        const hostname = new URL(url).hostname;
        chrome.storage.local.get(function (s) {
            if (checkTemporarilyEnabled(s.temporarilyEnabled, s.doneHabitAt, s.freeTime)) {
                blockUrl(s.blocked, hostname);
            } else {
                doneUrl(s.blocked, hostname);
            }
        });
    }
});
