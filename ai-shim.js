// Lets the app run outside claude.ai.
// On claude.ai the platform provides window.claude, and this file does nothing.
// Anywhere else it provides a small replacement for the AI calls:
//   1. If a server is available (config.js AI_ENDPOINT, e.g. server/server.js), requests go there.
//   2. If not (for example you opened index.html by double-clicking it), the app asks for your own
//      Anthropic API key once, saves it in this browser, and calls Anthropic directly.
(function () {
  var cfg = window.APP_CONFIG || {};
  if (window.claude) return;
  var KEY = "jt_anthropic_key";

  function getKey() { try { return localStorage.getItem(KEY) || ""; } catch (e) { return ""; } }
  function setKey(k) { try { if (k) localStorage.setItem(KEY, k); else localStorage.removeItem(KEY); } catch (e) {} }

  function askKey() {
    return new Promise(function (resolve) {
      var d = document.createElement("dialog");
      d.className = "keydlg";
      d.innerHTML = '<div class="authbox"><div class="authtop"><h2>Add your AI key</h2></div>' +
        '<p class="note">This app needs an Anthropic API key to write your results. Get one at console.anthropic.com. ' +
        'The key is saved only in this browser and sent only to Anthropic. AI use is billed to your Anthropic account.</p>' +
        '<div class="field"><label for="keyin">API key</label><input type="password" id="keyin" autocomplete="off" placeholder="sk-ant-..."></div>' +
        '<div class="row"><button class="go" type="button" data-k="save">Save and continue</button>' +
        '<button class="ghost" type="button" data-k="cancel">Cancel</button></div></div>';
      document.body.appendChild(d);
      var done = false;
      function end(v) { if (done) return; done = true; try { d.close(); } catch (e) {} d.remove(); resolve(v); }
      d.addEventListener("click", function (e) {
        var b = e.target.closest("button[data-k]"); if (!b) return;
        if (b.dataset.k === "save") { var v = d.querySelector("#keyin").value.trim(); if (v) end(v); }
        else end(null);
      });
      d.addEventListener("cancel", function () { end(null); });
      if (d.showModal) d.showModal(); else d.setAttribute("open", "");
      setTimeout(function () { var i = d.querySelector("#keyin"); if (i) i.focus(); }, 50);
    });
  }

  // Shows the real reason an AI request failed, so you are not left with a vague message.
  function report(msg) {
    var old = document.querySelector(".aierr"); if (old) old.remove();
    var d = document.createElement("div"); d.className = "aierr"; d.setAttribute("role", "alert");
    var t = document.createElement("div"); t.textContent = "AI error: " + msg;
    var x = document.createElement("button"); x.type = "button"; x.className = "ghost"; x.textContent = "Close";
    x.onclick = function () { d.remove(); };
    d.appendChild(t); d.appendChild(x); document.body.appendChild(d);
  }
  async function errText(r) {
    try { var j = await r.json(); return (j.error && (j.error.message || j.error)) || ("HTTP " + r.status); }
    catch (e) { return "HTTP " + r.status; }
  }
  function modelList() {
    var saved = ""; try { saved = localStorage.getItem("jt_model") || ""; } catch (e) {}
    var out = [];
    [saved, cfg.MODEL, "claude-sonnet-5-5", "claude-sonnet-4-6"].forEach(function (m) { if (m && out.indexOf(m) < 0) out.push(m); });
    return out;
  }

  async function viaDirect(msgs) {
    var key = getKey();
    if (!key) { key = await askKey(); if (!key) throw { code: "not_granted" }; setKey(key); }
    var models = modelList(), lastMsg = "";
    for (var i = 0; i < models.length; i++) {
      var r;
      try {
        r = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
            "anthropic-dangerous-direct-browser-access": "true"
          },
          body: JSON.stringify({ model: models[i], max_tokens: 4096, messages: msgs })
        });
      } catch (e) {
        report("Could not reach api.anthropic.com. Check your internet connection, and that no ad blocker or firewall is blocking it. (" + ((e && e.message) || "network error") + ")");
        throw { code: "error" };
      }
      if (r.ok) {
        try { localStorage.setItem("jt_model", models[i]); } catch (e) {}
        var j = await r.json();
        return (j.content || []).filter(function (b) { return b.type === "text"; }).map(function (b) { return b.text; }).join("");
      }
      var msg = await errText(r);
      if (r.status === 401 || r.status === 403) { setKey(""); report("Your API key was rejected: " + msg + " You will be asked for a key again."); throw { code: "not_granted" }; }
      if (r.status === 404 || (r.status === 400 && /model/i.test(msg))) { lastMsg = msg; continue; } // try the next model name
      if (r.status === 429) { report(msg); throw { code: "rate_limited" }; }
      report(msg); throw { code: "error" };
    }
    report("No usable model was found. Last message: " + lastMsg + " Set MODEL in config.js to a model your account can use.");
    throw { code: "error" };
  }

  async function viaServer(msgs) {
    var r = await fetch(cfg.AI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: msgs })
    });
    if (r.status === 404 || r.status === 405) return null; // no server at this address
    if (r.status === 429) { report("Too many requests. Wait a minute and try again."); throw { code: "rate_limited" }; }
    if (!r.ok) { report(await errText(r)); throw { code: "error" }; }
    var j = await r.json();
    return j.text || "";
  }

  async function sample(input, opts) {
    var msgs = typeof input === "string" ? [{ role: "user", content: input }] : input;
    var text = null;
    if (location.protocol !== "file:" && cfg.AI_ENDPOINT) {
      try { text = await viaServer(msgs); }
      catch (e) { if (e && e.code) throw e; text = null; } // network failure: fall back to direct
    }
    if (text === null) text = await viaDirect(msgs);
    if (opts && opts.onText) opts.onText({ text: text, delta: text });
    return { text: text, truncated: false };
  }

  // Only the AI is provided. Sign-up uses the email step, and file downloads are hidden.
  window.claude = { use: async function (name) { return name === "sample" ? sample : null; } };
})();
