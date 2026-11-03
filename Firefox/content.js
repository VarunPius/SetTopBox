(() => {
  "use strict";

  // YouTube playlists are infinite-scrolling pages. Scroll the continuation
  // sentinel into view and wait for YouTube to append the next batch before
  // requesting another one.
  const VIDEO_SELECTOR = "ytd-playlist-video-renderer";
  const LIST_SELECTOR = "ytd-playlist-video-list-renderer #contents";
  const CONTINUATION_SELECTOR = "ytd-continuation-item-renderer";
  const WAIT_FOR_BATCH_MS = 15000;

  let activePlaylist = null;
  let loading = false;
  let stopped = false;
  let observer = null;
  let timer = null;
  let pollTimer = null;
  let panel;
  let status;
  let action;

  function playlistId() {
    if (location.pathname !== "/playlist") return null;
    return new URL(location.href).searchParams.get("list");
  }

  function countVideos() {
    return document.querySelectorAll(VIDEO_SELECTOR).length;
  }

  function setStatus(text) {
    if (status) status.textContent = text;
  }

  function clearWait() {
    observer?.disconnect();
    observer = null;
    clearTimeout(timer);
    clearInterval(pollTimer);
    timer = null;
    pollTimer = null;
  }

  function makePanel() {
    if (panel?.isConnected) return;
    panel = document.createElement("div");
    panel.id = "yt-playlist-loader-panel";
    panel.style.cssText = "position:fixed;right:20px;bottom:20px;z-index:999999;background:#202124;color:#fff;padding:10px 13px;border-radius:9px;box-shadow:0 2px 12px #0008;font:13px/1.4 Arial,sans-serif;min-width:175px";
    const heading = document.createElement("div");
    heading.textContent = "Playlist loader";
    heading.style.cssText = "font-weight:600;margin-bottom:4px";
    status = document.createElement("div");
    status.style.cssText = "margin-bottom:7px";
    action = document.createElement("button");
    action.type = "button";
    action.style.cssText = "cursor:pointer;border:0;border-radius:5px;padding:5px 8px;background:#3ea6ff;color:#111;font-weight:600";
    action.addEventListener("click", () => {
      if (loading) {
        stopped = true;
        loading = false;
        clearWait();
        action.textContent = "Resume loading";
        setStatus(`Paused · ${countVideos()} videos loaded`);
      } else {
        stopped = false;
        loadNextBatch();
      }
    });
    panel.append(heading, status, action);
    document.documentElement.append(panel);
  }

  function waitForProgress(previousCount) {
    clearWait();
    const list = document.querySelector(LIST_SELECTOR);
    if (!list) {
      timer = setTimeout(() => loadNextBatch(), 700);
      return;
    }

    const finishWait = (timedOut = false) => {
      if (!loading) return;
      clearWait();
      const count = countVideos();
      if (count > previousCount) {
        setStatus(`Loading… ${count} videos loaded`);
        timer = setTimeout(loadNextBatch, 350);
      } else if (timedOut) {
        // A continuation can be transiently absent while YouTube is rendering.
        // Only call it complete after a quiet period with no sentinel and no
        // additional videos. If there is a sentinel, keep trying in case a
        // request was delayed.
        const sentinel = document.querySelector(`${LIST_SELECTOR} ${CONTINUATION_SELECTOR}`);
        if (sentinel) {
          setStatus(`Waiting for YouTube… ${count} videos loaded`);
          timer = setTimeout(loadNextBatch, 1200);
        } else {
          loading = false;
          action.textContent = "Load all videos";
          setStatus(`Finished · ${count} videos loaded`);
        }
      }
    };

    observer = new MutationObserver(() => {
      if (countVideos() > previousCount) {
        finishWait();
      }
    });
    observer.observe(list, { childList: true, subtree: true });

    timer = setTimeout(() => finishWait(true), WAIT_FOR_BATCH_MS);
    // Keep polling rendered count in case YouTube updates through a subtree
    // replacement that briefly detaches the observed list node.
    const poll = () => {
      if (!loading || !observer) return;
      if (countVideos() > previousCount) finishWait();
      // An interval is kept separate from the batch timeout so polling cannot
      // accidentally postpone the timeout forever.
    };
    pollTimer = setInterval(poll, 500);

    // Ask YouTube for another batch by bringing its continuation sentinel into
    // view. If it has not rendered yet, scroll the last video into view.
    const sentinel = list.querySelector(CONTINUATION_SELECTOR);
    const lastVideo = list.querySelector(VIDEO_SELECTOR + ":last-of-type");
    const target = sentinel || lastVideo;
    if (target) target.scrollIntoView({ block: "end", behavior: "instant" });
    else window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });
  }

  function loadNextBatch() {
    if (stopped || loading && observer) return;
    loading = true;
    makePanel();
    action.textContent = "Pause loading";
    const list = document.querySelector(LIST_SELECTOR);
    if (!list) {
      setStatus("Waiting for playlist…");
      timer = setTimeout(loadNextBatch, 700);
      return;
    }
    const before = countVideos();
    setStatus(`Loading… ${before} videos loaded`);
    waitForProgress(before);
  }

  function syncPage() {
    const id = playlistId();
    if (!id) {
      clearWait();
      loading = false;
      stopped = false;
      panel?.remove();
      panel = status = action = null;
      activePlaylist = null;
      return;
    }
    makePanel();
    if (id !== activePlaylist) {
      activePlaylist = id;
      stopped = false;
      loading = false;
      clearWait();
      // Start automatically once the playlist has mounted. No prompt or click
      // is needed; the button remains available if the user wants to pause.
      setStatus("Starting…");
      timer = setTimeout(loadNextBatch, 300);
    }
  }

  const pageObserver = new MutationObserver(syncPage);
  pageObserver.observe(document.documentElement, { childList: true, subtree: true });
  setInterval(syncPage, 800);
  syncPage();
})();
