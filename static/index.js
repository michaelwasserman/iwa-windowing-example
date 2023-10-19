'use strict';

let permissionStatus = null;
let screenDetails = null;
let popup = null;
let popupObserverInterval = null;
let handlingMultiScreenRequest = false;

function showWarning(text) {
  const warning = document.getElementById('warning');
  if (warning && warning.innerHTML !== text) {
    if (text)
      console.error(text);
    warning.hidden = !text;
    warning.innerHTML = text;
  }
}

window.addEventListener('load', async () => {
  if (!('getScreenDetails' in self) || !('isExtended' in screen) || !('onchange' in screen)) {
    showWarning("Please try a browser that supports the Window Management API");
  } else {
    permissionStatus = await navigator.permissions.query({name:'window-management'});
    permissionStatus.addEventListener('change', (e) => { updatePermissionStatus(e.target) });
    updatePermissionStatus(permissionStatus);
  }
  document.getElementById('requestFullscreenButton')?.addEventListener('click', () => { document.documentElement.requestFullscreen(); });
  document.getElementById('exitFullscreenButton')?.addEventListener('click', () => { document.exitFullscreen(); });
  document.getElementById('openWindowButton')?.addEventListener('click', () => { openPopup() });
  document.getElementById('openFullscreenButton')?.addEventListener('click', () => { openPopup({fullscreen:true}) });
  document.getElementById('openMultipleButton')?.addEventListener('click', () => { for (let s of screenDetails?.screens) openPopup({screen:s}); });
  document.getElementById('openMultipleFullscreenButton')?.addEventListener('click', () => { for (let s of screenDetails?.screens) openPopup({screen:s, fullscreen:true}); });
});

function updatePermissionStatus(p) {
  console.log(p);
  permissionStatus = p;
  document.getElementById('requestWindowManagementPermission')?.addEventListener('click', () => { window.getScreenDetails(); });
  document.getElementById('windowManagementStatusPrompt').style.display = permissionStatus.state === 'prompt' ? "inline" : "none";
  document.getElementById('windowManagementStatusGranted').style.display = permissionStatus.state === 'granted' ? "inline" : "none";
  document.getElementById('windowManagementStatusDenied').style.display = permissionStatus.state === 'denied' ? "inline" : "none";
  updateScreens(/*requestPermission=*/false);
}

function setScreenListeners() {
  let screens = screenDetails ? screenDetails.screens : [ window.screen ];
  for (const s of screens)
    s.onchange = () => { updateScreens(/*requestPermission=*/false); };
}

async function getScreenDetailsWithWarningAndFallback(requestPermission = false) {
  if ('getScreenDetails' in self) {
    if (!screenDetails && ((permissionStatus && permissionStatus.state === 'granted') ||
                           (permissionStatus && permissionStatus.state === 'prompt' && requestPermission))) {
      screenDetails = await getScreenDetails().catch(e =>{ console.error(e); return null; });
      if (screenDetails) {
        screenDetails.addEventListener('screenschange', () => { updateScreens(/*requestPermission=*/false); setScreenListeners(); });
        setScreenListeners();
      }
    }

    if (screenDetails) {
      // console.log("INFO: Detected " + screenDetails.screens.length + " screens:");
      // for (let i = 0; i < screenDetails.screens.length; ++i) {
      //   const s = screenDetails.screens[i];
      //   console.log(`[${i}] "${s.label}" ` +
      //               `[${s.left},${s.top} ${s.width}x${s.height}] ` +
      //               `(${s.availLeft},${s.availTop} ${s.availWidth}x${s.availHeight}) ` +
      //               `devicePixelRatio:${s.devicePixelRatio} colorDepth:${s.colorDepth} ` +
      //               `isExtended:${s.isExtended} isPrimary:${s.isPrimary} isInternal:${s.isInternal}`);
      // }
      return screenDetails.screens;
    }
  }

  // console.log(`INFO: Detected window.screen: (${screen.left},${screen.top} ${screen.width}x${screen.height}) isExtended:${screen.isExtended}`);
  return [ window.screen ];
}

async function updateScreens(requestPermission = true) {
  const screens = await getScreenDetailsWithWarningAndFallback(requestPermission);
  // TODO: Log or display screen info.
  return screens;
}

function getFeaturesFromOptions(options) {
  return "popup" +
         (options.fullscreen ? ",fullscreen" : "") +
         (options.x ? ",left=" + options.x : "") +
         (options.y ? ",top=" + options.y : "") +
         (options.w ? ",width=" + options.w : "") +
         (options.h ? ",height=" + options.h : "");
}

function openPopup(options = {}) {
  if (options.url === undefined) options.url = '.';
  if (options.screen === undefined) options.screen = window.screenDetails?.currentScreen || window.screen;
  if (options.x === undefined) options.x = options.screen.availLeft !== undefined ? options.screen.availLeft : options.screen.left;
  if (options.y === undefined) options.y = options.screen.availTop !== undefined ? options.screen.availTop : options.screen.top;
  if (options.w === undefined) options.w = options.screen.availWidth !== undefined ? options.screen.availWidth : options.screen.width;
  if (options.h === undefined) options.h = options.screen.availHeight !== undefined ? options.screen.availHeight : options.screen.height;

  if (popupObserverInterval)
    clearInterval(popupObserverInterval);
  const features = getFeaturesFromOptions(options);
  popup = window.open(options.url, '_blank', features);
  console.log('INFO: Requested popup with features: "' + features + '" result: ' + popup);
  if (popup) {
    popupObserverInterval = setInterval(() => {
      if (popup.closed) {
        console.log('INFO: The latest-opened popup was closed');
        clearInterval(popupObserverInterval);
        popupObserverInterval = null;
        popup = null;
      }
    }, 300);
  }
  return popup;
}
