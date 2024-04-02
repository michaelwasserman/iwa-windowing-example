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
  if ('getScreenDetails' in self) {
    permissionStatus = await navigator.permissions.query({name:'window-management'});
    permissionStatus.addEventListener('change', (e) => { updatePermissionStatus(e.target) });
    updatePermissionStatus(permissionStatus);
  } else {
    log('Window Management API not supported');
  }
  logScreens();
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) log("Exited fullscreen"); });
  document.getElementById('requestFullscreenButton')?.addEventListener('click', () => { requestFullscreen('on click')});
  document.getElementById('exitFullscreenButton')?.addEventListener('click', () => { document.exitFullscreen(); });
  document.getElementById('openWindowButton')?.addEventListener('click', openPopup);
  document.getElementById('openMultipleButton')?.addEventListener('click', openPopups);
  document.getElementById('requestFullscreenOnMouseEnterButton')?.addEventListener('mouseenter', requestFullscreenOnHover);
  document.getElementById('requestFullscreen6sAfterClickButton')?.addEventListener('click', requestFullscreenAfter6s);
  document.getElementById('exitFullscreenOnMouseEnterButton')?.addEventListener('click', () => { document.exitFullscreen(); });
  document.getElementById('openFullscreenPopupOnloadButton')?.addEventListener('click', openPopup.bind(null, {fullscreen:'popupOnload'}));
  document.getElementById('openMultipleFullscreenPopupOnloadButton')?.addEventListener('click', openPopups.bind(null, {fullscreen:'popupOnload'}));
  document.getElementById('openFullscreenOpenerOnloadButton')?.addEventListener('click', openPopup.bind(null, {fullscreen:'openerOnload'}));
  document.getElementById('openMultipleFullscreenOpenerOnloadButton')?.addEventListener('click', openPopups.bind(null, {fullscreen:'openerOnload'}));
  let params = new URLSearchParams(window.location.search);
  if (params.has('fullscreen')) {
    // Use a timeout so browser WebPrefs reach renderer Document Settings :-/
    setTimeout(() => { requestFullscreen('on load'); }, 200);
  }
  setInterval(() => {
    document.getElementById('activationState').innerText =
      navigator.userActivation.isActive ? 'Active (lasts 5s)' :
        navigator.userActivation.hasBeenActive ? 'Has been active (expired or consumed)' : 'Not active';
    document.getElementById('requestFullscreenOnMouseEnterButton').disabled = navigator.userActivation.isActive;
  }, 300);
});

function updatePermissionStatus(p) {
  permissionStatus = p;
  log(`Window Management permission: ${permissionStatus.state}`);
  document.getElementById('requestWindowManagementPermission')?.addEventListener('click', getScreens.bind(null, /*requestPermission=*/true));
  document.getElementById('windowManagementStatusPrompt').style.display = permissionStatus.state === 'prompt' ? 'inline' : 'none';
  document.getElementById('windowManagementStatusGranted').style.display = permissionStatus.state === 'granted' ? 'inline' : 'none';
  document.getElementById('windowManagementStatusDenied').style.display = permissionStatus.state === 'denied' ? 'inline' : 'none';
  document.getElementById('openMultipleButton').disabled = permissionStatus.state !== 'granted';
  document.getElementById('openMultipleFullscreenPopupOnloadButton').disabled = permissionStatus.state !== 'granted';
  document.getElementById('openMultipleFullscreenOpenerOnloadButton').disabled = permissionStatus.state !== 'granted';
}

async function setScreenListeners() {
  for (const s of await getScreens())
    s.onchange = logScreens;
}

function logScreens() {
  getScreens().then(() => {
    if (screenDetails) {
      log('Detected ' + screenDetails.screens.length + ' screens:');
      for (let i = 0; i < screenDetails.screens.length; ++i) {
        const s = screenDetails.screens[i];
        log(`[${i}] '${s.label}' (${s.left},${s.top} ${s.width}x${s.height}) ${s.devicePixelRatio}x ` +
            `${s.isPrimary ? 'primary' : 'secondary'} ${s.isInternal? 'internal' : 'external'}`);
      }
    } else {
      log(`Detected window.screen: (${screen.availLeft},${screen.availTop} ${screen.width}x${screen.height}) isExtended:${screen.isExtended}`);
    }
  });
};

async function getScreens(requestPermission = false) {
  if ('getScreenDetails' in self && !screenDetails &&
      (permissionStatus?.state === 'granted' || requestPermission)) {
    if (screenDetails = await getScreenDetails().catch(e => log(e))) {
      screenDetails.addEventListener('screenschange', () => { logScreens(); setScreenListeners(); });
      setScreenListeners();
    }
  }
  return screenDetails?.screens ?? [ window.screen ];
}

function requestFullscreen(eventName, element = document.documentElement) {
  element.requestFullscreen()
  .then(() => { log(`Entered fullscreen ${eventName}`);})
  .catch(e => {log(`Failed to fullscreen ${eventName} '${e}'`);});
}

function requestFullscreenOnHover() {
  if (navigator.userActivation.isActive) {
    log('Skipping fullscreen request on hover while document is active');
    return;
  }
  requestFullscreen('on hover');
}

function requestFullscreenAfter6s() {
  document.getElementById('requestFullscreen6sAfterClickButton').disabled = true;
  setTimeout(() => {
    requestFullscreen('6s after click');
    document.getElementById('requestFullscreen6sAfterClickButton').disabled = false;
  }, 6000);
};

function getFeaturesFromOptions(options) {
  return 'popup' +
         (options.x ? ',left=' + options.x : '') +
         (options.y ? ',top=' + options.y : '') +
         (options.w ? ',width=' + options.w : '') +
         (options.h ? ',height=' + options.h : '');
}

function openPopups(options = {}) {
  for (let s of (screenDetails?.screens ?? [window.screen]))
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
          `bounds: (${popup.screenX},${popup.screenY} ${popup.outerWidth}x${popup.outerHeight})` +
          (options.fullscreen ? `; fullscreen via ${options.fullscreen} ${popup.document.fullscreenElement ? 'succeeded' : 'failed'}` : ''));
    }, 900);
    if (options.fullscreen === 'openerOnload') {
      // Use a timeout so browser WebPrefs reach renderer Document Settings :-/
      popup.addEventListener('load', () => { setTimeout(() => {
        requestFullscreen('on popup load from opener', popup.document.documentElement);
      }, 300); });
    }
    popup.observerInterval = setInterval(() => {
      if (popup.closed) {
        log(`Popup #${popup.number} closed`);
        clearInterval(popup.observerInterval);
        popup.observerInterval = null;
      }
    }, 200);
  } else {
    log(`Failed to open popup #${popups.length + 1} with features '${features}'`);
  }
  popups.push(popup);
}
