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
        if (typeof local.dateToAlert !== "string") {
            let currentTime = (new Date()).toJSON();
            chrome.storage.local.set({ dateToAlert: currentTime });
        }
        if (!local.alertTime) {
            // default alert time 60 minutes
            chrome.storage.local.set({ alertTime: 60 });
        }
    });
};

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
        if (diff >= freeTime) {
            chrome.storage.local.set({ blocked: temporarilyEnabled });
            chrome.storage.local.set({ temporarilyEnabled: [] });
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

chrome.runtime.onInstalled.addListener(function () { instalationInitStorage(); });

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    const url = tab.url;
    if (validateUrl(url)) {
        const hostname = new URL(url).hostname;
        chrome.storage.local.get(function (s) {
            if (checkTemporarilyEnabled(s.temporarilyEnabled, s.doneHabitAt, s.freeTime)) {
                blockUrl(s.blocked, hostname);
            } else {
                var newURL = chrome.runtime.getURL('done.html');
                chrome.tabs.update(undefined, { url: newURL });
            }
        });
    }
});

chrome.tabs.onActivated.addListener(function (tab) {
    chrome.storage.local.get(function (s) {
        let now = new Date();
        let currentTime = now.toJSON();
        let dateAt = new Date(s.dateToAlert);
        let diff = parseInt(Math.abs(dateAt.getTime() - now.getTime()) / (1000 * 60) % 60);
        if (diff > s.alertTime) {
            openMinderPage();
            chrome.storage.local.set({ dateToAlert: currentTime });
        }
    });
});

function openMinderPage() {
    var newURL = chrome.runtime.getURL('minder.html');
    chrome.tabs.create({ url: newURL });
};


// chrome.tabs.onActivated.addListener(function (activeInfo) {
//     chrome.tabs.query({}, function (tabs) {
//         console.log(tabs)
//         tabs.forEach(tab => {
//             if (validateUrl(tab.url)) {
//                 const hostname = new URL(tab.url).hostname;
//                 chrome.storage.local.get(function (s) {
//                     if (checkTemporarilyEnabled(s.temporarilyEnabled, s.doneHabitAt)){ return; }
//                     if (Array.isArray(s.blocked) && s.blocked.find(domain => hostname.includes(domain))) {
//                         if (tab.active){
//                             console.log(tab.url);
//                             // blockUrl(s.blocked, hostname);
//                         }else{
//                             chrome.tabs.remove(tab.id);
//                         }
//                     }
//                 });
//             }
//         });
//     });
// });