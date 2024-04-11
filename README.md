# IWA Windowing Example

An example of [Isolated Web Application (IWA)](https://github.com/WICG/isolated-web-apps) windowing functionality

## How to Run

Build or <a href="https://raw.githubusercontent.com/michaelwasserman/iwa-windowing-example/main/iwa-windowing-example.swbn">download</a> the signed web bundle.

Run Chrome M124+ and enable flags:
* chrome://flags/#enable-isolated-web-apps
* chrome://flags/#enable-isolated-web-app-dev-mode
* chrome://flags/#automatic-fullscreen-content-setting
* chrome://flags/#enable-desktop-pwas-borderless

```console
$ chrome --enable-features=IsolatedWebApps,IsolatedWebAppDevMode,AutomaticFullscreenContentSetting,WebAppBorderless
```

Visit chrome://web-app-internals/ and point "Install IWA from Signed Web Bundle" to iwa-windowing-example.swbn

Visit chrome://apps and launch "IWA Windowing Example"

Note: If [reinstall fails](https://issues.chromium.org/issues/40286084), try restarting Chrome.

## Optional: Test limited non-IWA functionality

This example is hosted on GitHub [HERE](https://michaelwasserman.github.io/iwa-windowing-example/static).
Functionality is limited without IWA installation.

## Optional: Self-Host a Dev Mode Proxy

```console
$ git clone https://github.com/michaelwasserman/iwa-windowing-example.git
$ cd iwa-windowing-example/static
$ python3 -m http.server [port]
```

Visit chrome://web-app-internals/ and point "Install IWA via Dev Mode Proxy" to http://localhost:[port]/

## Optional: Self-Build a Signed Web Bundle

```console
$ git clone https://github.com/michaelwasserman/iwa-windowing-example.git
$ cd iwa-windowing-example
$ openssl genpkey -algorithm Ed25519 -out ed25519key.pem
$ npm i
$ npm init
$ npm run build
```

This builds `iwa-windowing-example.swbn` to use with chrome://web-app-internals/.

Note: Keep the new `ed25519key.pem` private key file secure; do not share it in a public repo :)
Note: See barebones [IWA Bundling Example](https://github.com/michaelwasserman/iwa-bundling-example).

## Windowing features, docs, and resources:

### Automatic Fullscreen Content Setting (IWA or enterprise only)

Permits Element.requestFullscreen() calls without a user gesture (transient activation).
Used to open fullscreen popups, and enter fullscreen on mouse hover or after a 6s delay.

* Requires chrome://flags/#automatic-fullscreen-content-setting or `--enable-features=AutomaticFullscreenContentSetting`
* Users can allow individual IWAs in chrome://settings; enterprise admins can allow additional origins
* [Explainer](https://github.com/explainers-by-googlers/html-fullscreen-without-a-gesture),
  [ChromeStatus](https://chromestatus.com/feature/6218822004768768)

### Borderless Display Mode (IWA-only)

A Web Application Manifest display_override mode.
Used to show app content without any browser-provided window frame.

* Requires Isolated Web App context
* Requires [Window Management](https://w3c.github.io/window-management/) permission and permisison-policy
* Requires chrome://flags/#enable-desktop-pwas-borderless or `--enable-features=WebAppBorderless`
* Used in this example when the app is installed as an IWA
* [Explainer](https://github.com/WICG/manifest-incubations/blob/gh-pages/borderless-explainer.md),
  [ChromeStatus](https://chromestatus.com/feature/5551475195904000),
  [Borderless mode demo app](https://github.com/sonkkeli/borderless)

### TODO: [Additional Windowing Controls](https://github.com/ivansandrk/additional-windowing-controls/blob/main/awc-explainer.md) (IWA-only)

### Fullscreen (with a user gesture)

### Window Management API (cross-screen popups and fullscreen)

### Window-Controls-Overlay (WCO) Display Mode (Installed Web Apps only)

Web Application Manifest display_override mode that lets app content be shown as part of the browser-provided window titlebar.

* Requires installed Web App context (not necessarily an Isolated Web App)
* Used in this example as a fallback when the Borderless Display Mode is not available
  * Note, [installed non-isolated web apps may not fallback from borderless to WCO when borderless is enabled](crbug.com/1494159)
* [Spec](https://wicg.github.io/window-controls-overlay/),
  [ChromeStatus](https://chromestatus.com/feature/5741247866077184),
  [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/API/Window_Controls_Overlay_API),
  [WCO Example PWA](https://amandabaker.github.io/pwa/explainer-example/index.html)

### Pop-ups And Redirects Content Setting

Permits window.open() calls without a user gesture (transient activation)
Used to open a popup on each display of multi-screen device with one gesture.

* Users or enterprise admins can allow by default or for individual origins in chrome://settings

### DEPRECATED: [Fullscreen popups](https://chromestatus.com/feature/6002307972464640).