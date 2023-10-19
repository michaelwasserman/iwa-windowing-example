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
    // screen.addEventListener('change', () => { updateScreens(/*requestPermission=*/false); });
    // window.addEventListener('resize', () => { updateScreens(/*requestPermission=*/false); });
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
//   if (document.getElementById('screensCanvas'))
//     showScreens(screens);
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
  // if (options.fullscreen === undefined) options.fullscreen = false;
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

function openWindow(options = {}) {
  if (!options.url) options.url = '.';
  if (!options.url) options.url = '.';

  return openWindow({
      url: '.',
      x: screen.availLeft,
      y: screen.availTop,
      width: screen.availWidth,
      height: screen.availHeight,
  });
}

// TODO: Add some worthwhile multi-window opening example?
// async function openWindows() {
//   let count = openWindowsCountInput.value;
//   const screens = await getScreenDetailsWithWarningAndFallback();
//   const perScreen = Math.ceil(count / screens.length);
//   console.log(`openWindows count:${count}, screens:${screens.length}, perScreen:${perScreen}`);
//   for (const s of screens) {
//     const cols = Math.ceil(Math.sqrt(perScreen));
//     const rows = Math.ceil(perScreen / cols);
//     for (r = 0; r < rows; ++r) {
//       for (c = 0; c < cols && count-- > 0; ++c) {
//         const options = {
//           x: s.availLeft + s.availWidth * c / cols,
//           y: s.availTop + s.availHeight * r / rows,
//           width: s.availWidth / cols,
//           height: s.availHeight / rows,
//         };
//         const url = `data:text/html;charset=utf-8,<title>row:${r} col:${c}</title><h1>row:${r} col:${c}</h1>`;
//         console.log(`INFO: opening window row:${r} col:${c}, (${options.x},${options.y} ${options.width}x${options.height}`);
//         window.open(url, '_blank', getFeaturesFromOptions(options));
//       }
//     }
//   }
// }
