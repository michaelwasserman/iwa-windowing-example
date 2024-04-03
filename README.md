# IWA Windowing Example

An example of windowing in an [Isolated Web Application (IWA)](https://github.com/WICG/isolated-web-apps), leveraging the barebones [IWA Bundling Example](https://github.com/michaelwasserman/iwa-bundling-example).

Run or install this example as a **non-IWA** web application at https://michaelwasserman.github.io/iwa-windowing-example/static

## Prep and Bundle

```console
$ git clone https://github.com/michaelwasserman/iwa-windowing-example.git
$ cd iwa-windowing-example
$ openssl genpkey -algorithm Ed25519 -out ed25519key.pem
$ npm i
$ npm init
$ npm run build
```

This creates `iwa-windowing-example.swbn`.

Note: Keep the new `ed25519key.pem` private key file secure; do not share it in a public repo :)

## Run

```console
$ chrome --enable-features=IsolatedWebApps,IsolatedWebAppDevMode,AutomaticFullscreenContentSetting,FullscreenPopupWindows,WebAppBorderless
```

chrome://web-app-internals/ -> "Install IWA from Signed Web Bundle" -> iwa-windowing-example.swbn

Note: If [reinstall fails with a manifest error](crbug.com/1494141), try restarting Chrome.

chrome://apps -> "IWA Windowing Example"

## Windowing features, docs, and resources:

### Automatic Fullscreen Content Setting

Permits Element.requestFullscreen() calls without a user gesture (transient activation)

* Requires chrome://flags/#automatic-fullscreen-content-setting or `--enable-features=AutomaticFullscreenContentSetting`
* Users can allow individual IWAs in chrome://settings; enterprise admins can allow additional origins
* Used in this example to open fullscreen popups, or enter fullscreen on mouse hover
* [Explainer](https://github.com/explainers-by-googlers/html-fullscreen-without-a-gesture),
  [ChromeStatus](https://chromestatus.com/feature/6218822004768768)

### Borderless Display Mode

Web Application Manifest display_override mode that lets app content be shown without any browser-provided window frame.

* Requires Isolated Web App context
* Requires [Window Management](https://w3c.github.io/window-management/) permission and permisison-policy
* Requires chrome://flags/#enable-desktop-pwas-borderless or `--enable-features=WebAppBorderless`
* Used in this example when the app is installed as an IWA
* [Explainer](https://github.com/WICG/manifest-incubations/blob/gh-pages/borderless-explainer.md),
  [ChromeStatus](https://chromestatus.com/feature/5551475195904000),
  [Borderless mode demo app](https://github.com/sonkkeli/borderless)

### Window-Controls-Overlay (WCO) Display Mode

Web Application Manifest display_override mode that lets app content be shown as part of the browser-provided window titlebar.

* Requires installed Web App context (not necessarily an Isolated Web App)
* Used in this example as a fallback when the Borderless Display Mode is not available
  * Note, [installed non-isolated web apps may not fallback from borderless to WCO when borderless is enabled](crbug.com/1494159)
* [Spec](https://wicg.github.io/window-controls-overlay/),
  [ChromeStatus](https://chromestatus.com/feature/5741247866077184),
  [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/API/Window_Controls_Overlay_API),
  [WCO Example PWA](https://amandabaker.github.io/pwa/explainer-example/index.html)

### Fullscreen popups

Enhances window.open() to open popup windows in fullscreen mode

* Requires [Window Management](https://w3c.github.io/window-management/) permission and permisison-policy, and per-popup user gesture (transient activation)
* Requires chrome://flags/#fullscreen-popup-windows, `--enable-features=FullscreenPopupWindows`, or [Origin Trial registration](https://developer.chrome.com/origintrials/#/view_trial/106960491150049281)
* Each popup only enters fullscreen with requisite permission and requires 
* [Explainer](https://github.com/w3c/window-management/blob/main/EXPLAINER_fullscreen_popups.md),
  [chromeStatus](https://chromestatus.com/feature/6002307972464640),
  [web.dev OT article](https://developer.chrome.com/blog/fullscreen-popups-origin-trial/),
  [Window Management Demo](https://michaelwasserman.github.io/window-placement-demo/),

### Pop-ups And Redirects Content Setting

Permits window.open() calls without a user gesture (transient activation)

* Users or enterprise admins can allow by default or for individual origins in chrome://settings

### TODO: [Additional Windowing Controls](https://github.com/ivansandrk/additional-windowing-controls/blob/main/awc-explainer.md), more...
