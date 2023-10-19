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

This creates `dist/signed.swbn`.

Note: Keep the new `ed25519key.pem` private key file secure; do not share it in a public repo :)

## Run

```console
$ chrome --enable-features=IsolatedWebApps,IsolatedWebAppDevMode,FullscreenPopupWindows,WebAppBorderless
```

chrome://web-app-internals/ -> "Install IWA from Signed Web Bundle" -> dist/signed.swbn

Note: If [reinstall fails with a manifest error](crbug.com/1494141), try restarting Chrome.

chrome://apps -> "IWA Windowing Example"

## Windowing features, docs, and resources:

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

* Requires [Window Management](https://w3c.github.io/window-management/) permission and permisison-policy
* Requires chrome://flags/#fullscreen-popup-windows, `--enable-features=FullscreenPopupWindows`, or [Origin Trial registration](https://developer.chrome.com/origintrials/#/view_trial/106960491150049281)
* [Explainer](https://github.com/w3c/window-management/blob/main/EXPLAINER_fullscreen_popups.md),
  [chromeStatus](https://chromestatus.com/feature/6002307972464640),
  [web.dev OT article](https://developer.chrome.com/blog/fullscreen-popups-origin-trial/),
  [Window Management Demo](https://michaelwasserman.github.io/window-placement-demo/),

### Popups And Redirects Content Setting

Permits window.open() calls without needing to consume a "gesture" (transient user activation)

### TODO: More...