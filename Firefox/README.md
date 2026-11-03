# SetTopBox (Firefox)

A first-step Firefox WebExtension that automatically loads YouTube playlist pages by progressively scrolling their continuation loader. A small control in the lower-right corner lets you pause or resume. It does not call YouTube APIs, change playlist contents, or request account permissions.

## Install temporarily in Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Choose **Load Temporary Add-on…**.
3. Select `SetTopBox/Firefox/manifest.json`.
4. Open a YouTube playlist page. Loading starts automatically; use the lower-right control to pause or resume.

Temporary add-ons are removed when Firefox closes. Reload the add-on after editing its files.

## Notes

- Loading starts automatically, can be paused, and continues from the current state.
- The loader waits up to 15 seconds for each new batch. When a batch does not arrive, it retries if the continuation row is still present; without that row, it reports the currently loaded count as finished.
- Large playlists can take time and use substantial memory because YouTube renders the fetched video rows in the page.
