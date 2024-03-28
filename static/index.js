'use strict';

let permissionStatus = null;
let screenDetails = null;
let popups = [];

function log(text) {
  document.getElementById('log').innerText += text + '\n';
  console.log(text);
}

window.addEventListener('load', async () => {
  document.documentElement.style.background = `hsl(${Math.floor(Math.random() * 360)}deg 60% 90%)`;
  if (!('getScreenDetails' in self) || !('isExtended' in screen) || !('onchange' in screen)) {
    log('Window Management API not supported');
  } else {
    permissionStatus = await navigator.permissions.query({name:'window-management'});
    permissionStatus.addEventListener('change', (e) => { updatePermissionStatus(e.target) });
    updatePermissionStatus(permissionStatus);
  }
  document.getElementById('requestFullscreenButton')?.addEventListener('click', requestFullscreen.bind(null, 'click'));
  document.getElementById('exitFullscreenButton')?.addEventListener('click', () => { document.exitFullscreen(); });
  document.getElementById('requestFullscreenOnMouseEnterButton')?.addEventListener('mouseenter', requestFullscreen.bind(null, 'mouseenter'));
  document.getElementById('exitFullscreenOnMouseEnterButton')?.addEventListener('mouseenter', () => { document.exitFullscreen(); });
  document.getElementById('openWindowButton')?.addEventListener('click', openPopup);
  document.getElementById('openMultipleButton')?.addEventListener('click', openPopups);
  document.getElementById('openFullscreenOpenerOnloadButton')?.addEventListener('click', openPopup.bind(null, {fullscreen:'openerOnload'}));
  document.getElementById('openMultipleFullscreenOpenerOnloadButton')?.addEventListener('click', openPopups.bind(null, {fullscreen:'openerOnload'}));
  document.getElementById('openFullscreenPopupOnloadButton')?.addEventListener('click', openPopup.bind(null, {fullscreen:'popupOnload'}));
  document.getElementById('openMultipleFullscreenPopupOnloadButton')?.addEventListener('click', openPopups.bind(null, {fullscreen:'popupOnload'}));
  let params = new URLSearchParams(window.location.search);
  if (params.has('fullscreen')) {
    log(`Requesting fullscreen on load; ` +
        // `currentScreen: ${screenDetails?.currentScreen.label} ` +
        `screenLeft|Top:(${screenLeft}, ${screenTop}) ` +
        `screen.availLeft|Top:(${screen.availLeft}, ${screen.availTop})`);
    requestFullscreen('popup load in popup listener');
  }
});

function updatePermissionStatus(p) {
  permissionStatus = p;
  log(`window-management permission: ${permissionStatus.state}`);
  document.getElementById('requestWindowManagementPermission')?.addEventListener('click', () => { window.getScreenDetails(); });
  document.getElementById('windowManagementStatusPrompt').style.display = permissionStatus.state === 'prompt' ? 'inline' : 'none';
  document.getElementById('windowManagementStatusGranted').style.display = permissionStatus.state === 'granted' ? 'inline' : 'none';
  document.getElementById('windowManagementStatusDenied').style.display = permissionStatus.state === 'denied' ? 'inline' : 'none';
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
      // log('Detected ' + screenDetails.screens.length + ' screens:');
      // for (let i = 0; i < screenDetails.screens.length; ++i) {
      //   const s = screenDetails.screens[i];
      //   log(`[${i}] '${s.label}' [${s.left},${s.top} ${s.width}x${s.height}] ` +
      //       `(${s.availLeft},${s.availTop} ${s.availWidth}x${s.availHeight}) ` +
      //       `devicePixelRatio:${s.devicePixelRatio} colorDepth:${s.colorDepth} ` +
      //       `isExtended:${s.isExtended} isPrimary:${s.isPrimary} isInternal:${s.isInternal}`);
      // }
      return screenDetails.screens;
    }
  }
  // log(`Detected window.screen: (${screen.left},${screen.top} ${screen.width}x${screen.height}) isExtended:${screen.isExtended}`);
  return [ window.screen ];
}

async function updateScreens(requestPermission = true) {
  const screens = await getScreenDetailsWithWarningAndFallback(requestPermission);
  // TODO: Log or display screen info.
  return screens;
}

function requestFullscreen(eventName) {
  document.documentElement.requestFullscreen()
  .then(() => { log(`Entered fullscreen on ${eventName}`);})
  .catch(e => {log(`Failed to fullscreen on ${eventName} '${e}'`);});
}

function getFeaturesFromOptions(options) {
  return 'popup' +
         (options.x ? ',left=' + options.x : '') +
         (options.y ? ',top=' + options.y : '') +
         (options.w ? ',width=' + options.w : '') +
         (options.h ? ',height=' + options.h : '');
}

function openPopups(options = {}) {
  for (let s of screenDetails?.screens)
    openPopup(Object.assign({}, options, {screen:s}));
}

function openPopup(options = {}) {
  if (options.url === undefined) options.url = new URL('.', window.location.href);
  if (options.screen === undefined) options.screen = window.screenDetails?.currentScreen || window.screen;
  if (options.x === undefined) options.x = options.screen.availLeft !== undefined ? options.screen.availLeft : options.screen.left;
  if (options.y === undefined) options.y = options.screen.availTop !== undefined ? options.screen.availTop : options.screen.top;
  if (options.w === undefined) options.w = options.screen.availWidth !== undefined ? options.screen.availWidth : options.screen.width;
  if (options.h === undefined) options.h = options.screen.availHeight !== undefined ? options.screen.availHeight : options.screen.height;

  let features = getFeaturesFromOptions(options);
  if (options.fullscreen === 'popupOnload') {
    let params = new URLSearchParams(options.url.search);
    params.set('fullscreen', '');
    options.url.search = params.toString();
  }
  let popup = window.open(options.url, '_blank', features);
  if (popup) {
    popup.number = popups.length + 1;
    setTimeout(() => {
      log(`Opened popup #${popup.number} with features '${features}'; ` +
          `bounds: [${popup.screenX},${popup.screenY} ${popup.outerWidth}x${popup.outerHeight}]` +
          (options.fullscreen ? `; fullscreen via ${options.fullscreen} ${popup.document.fullscreenElement ? 'succeeded' : 'failed'}` : ''));
    }, 900);
    if (options.fullscreen === 'openerOnload') {
      popup.addEventListener('load', async () => {
        // Use a timeout so browser WebPrefs reach renderer Document Settings.
        // Why does this event fire before the window's own load event?
        setTimeout(async () => {
          log(`Requesting to fullscreen popup from opener; ` +
              // `currentScreen: ${popup.screenDetails?.currentScreen.label} ` +
              `popup.screenLeft|Top:(${popup.screenLeft}, ${popup.screenTop}) ` +
              `screen.availLeft|Top:(${popup.screen.availLeft}, ${popup.screen.availTop})`);
          let eventName = 'popup load in opener listener';
          popup.document.documentElement.requestFullscreen()
            .then(() => { log(`Entered fullscreen on ${eventName}`);})
            .catch(e => {log(`Failed to fullscreen on ${eventName} '${e}'`);});
        }, 100);
      });
    }
    popup.observerInterval = setInterval(() => {
      if (popup.closed) {
        log(`Popup #${popup.number} closed`);
        clearInterval(popup.observerInterval);
        popup.observerInterval = null;
      }
    }, 300);
  } else {
    log(`Failed to open popup #${popup.length} with features '${features}'`);
  }
  popups.push(popup);
}
