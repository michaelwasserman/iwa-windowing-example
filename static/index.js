'use strict';

let permissionStatus = null;
let screenDetails = null;
let popups = [];

function log(text) {
  document.getElementById('log').innerText += text + '\n';
  console.log(text);
}

window.addEventListener('load', async () => {
  if (!('getScreenDetails' in self) || !('isExtended' in screen) || !('onchange' in screen)) {
    log('Window Management API not supported');
  } else {
    permissionStatus = await navigator.permissions.query({name:'window-management'});
    permissionStatus.addEventListener('change', (e) => { updatePermissionStatus(e.target) });
    updatePermissionStatus(permissionStatus);
  }
  document.getElementById('requestFullscreenButton')?.addEventListener('click', () => { document.documentElement.requestFullscreen(); });
  document.getElementById('requestFullscreenOnHoverButton')?.addEventListener('mouseenter', () => { document.documentElement.requestFullscreen(); });
  document.getElementById('exitFullscreenButton')?.addEventListener('click', () => { document.exitFullscreen(); });
  document.getElementById('openWindowButton')?.addEventListener('click', () => { openPopup() });
  document.getElementById('openMultipleButton')?.addEventListener('click', () => { () => { for (let s of screenDetails?.screens) openPopup(); } });
  document.getElementById('openFullscreenFeatureButton')?.addEventListener('click', () => { openPopup({fullscreen:'windowFeature'}) });
  document.getElementById('openMultipleFullscreenFeatureButton')?.addEventListener('click', () => { for (let s of screenDetails?.screens) openPopup({screen:s, fullscreen:'windowFeature'}); });
  document.getElementById('openFullscreenOpenerOnloadButton')?.addEventListener('click', () => { openPopup({fullscreen:'openerOnload'}) });
  document.getElementById('openMultipleFullscreenOpenerOnloadButton')?.addEventListener('click', () => { for (let s of screenDetails?.screens) openPopup({screen:s, fullscreen:'openerOnload'}); });
  document.getElementById('openFullscreenPopupOnloadButton')?.addEventListener('click', () => { openPopup({fullscreen:'popupOnload'}) });
  document.getElementById('openMultipleFullscreenPopupOnloadButton')?.addEventListener('click', () => { for (let s of screenDetails?.screens) openPopup({screen:s, fullscreen:'popupOnload'}); });
  let params = new URLSearchParams(window.location.search);
  if (params.has('fullscreen')) {
    log(`Requesting fullscreen on load; ` +
        // `currentScreen: ${screenDetails?.currentScreen.label} ` +
        `screenLeft|Top:(${screenLeft}, ${screenTop}) ` +
        `screen.availLeft|Top:(${screen.availLeft}, ${screen.availTop})`);
    document.documentElement.requestFullscreen()
      .then(() => { log('Fullscreen on load: success'); })
      .catch(() => { log('Fullscreen on load: failure'); });
  }
});

function updatePermissionStatus(p) {
  permissionStatus = p;
  log(`Permission status: ${permissionStatus.state}`);
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

function getFeaturesFromOptions(options) {
  return 'popup' +
         (options.x ? ',left=' + options.x : '') +
         (options.y ? ',top=' + options.y : '') +
         (options.w ? ',width=' + options.w : '') +
         (options.h ? ',height=' + options.h : '');
}

function openPopup(options = {}) {
  if (options.url === undefined) options.url = new URL('.', window.location.href);
  if (options.screen === undefined) options.screen = window.screenDetails?.currentScreen || window.screen;
  if (options.x === undefined) options.x = options.screen.availLeft !== undefined ? options.screen.availLeft : options.screen.left;
  if (options.y === undefined) options.y = options.screen.availTop !== undefined ? options.screen.availTop : options.screen.top;
  if (options.w === undefined) options.w = options.screen.availWidth !== undefined ? options.screen.availWidth : options.screen.width;
  if (options.h === undefined) options.h = options.screen.availHeight !== undefined ? options.screen.availHeight : options.screen.height;

  let features = getFeaturesFromOptions(options);
  if (options.fullscreen === 'windowFeature') {
    features += ',fullscreen';
  } else if (options.fullscreen === 'popupOnload') {
    let params = new URLSearchParams(options.url.search);
    params.set('fullscreen', '');
    options.url.search = params.toString();
  }
  let popup = window.open(options.url, '_blank', features);
  log(`Requested popup #${popups.length + 1} with features: '${features}' ` +
      `fullscreen?: ${options.fullscreen || 'no'} result: ${popup}`);
  if (popup) {
    popup.number = popups.length + 1;
    if (options.fullscreen === 'openerOnload') {
      popup.addEventListener('load', async () => {
        // Use a timeout so browser WebPrefs reach renderer Document Settings.
        // Why does this event fire before the window's own load event?
        setTimeout(async () => {
          log(`Requesting to fullscreen popup from opener; ` +
              // `currentScreen: ${popup.screenDetails?.currentScreen.label} ` +
              `popup.screenLeft|Top:(${popup.screenLeft}, ${popup.screenTop}) ` +
              `screen.availLeft|Top:(${popup.screen.availLeft}, ${popup.screen.availTop})`);
          popup.document.documentElement.requestFullscreen()
            .then(() => { log('Fullscreen popup from opener: success'); })
            .catch(() => { log('Fullscreen popup from opener: failure'); });
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
  }
  popups.push(popup);
}
