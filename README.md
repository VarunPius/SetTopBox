# SetTopBox

SetTopBox is a browser-extension project for managing YouTube playlists. Browser-specific implementations live in separate directories so Firefox and Chromium versions can use the APIs and packaging each browser requires.

## Project layout

```text
SetTopBox/
├── Firefox/     # Firefox WebExtension
├── Chromium/    # Reserved for a future Chromium extension
├── LICENSE
└── README.md
```

The Firefox implementation currently loads playlist videos progressively as you visit a YouTube playlist page. It starts automatically and provides a small control to pause or resume loading. See [Firefox/README.md](Firefox/README.md) for installation instructions.

The `Chromium` directory is reserved for a future implementation. The browser versions may share common code where practical, while keeping browser-specific manifests and behavior in their own directories.

## Developer

Varun Pius Rodrigues

## License

This project is distributed under the Apache License, Version 2.0. See [LICENSE](LICENSE).
