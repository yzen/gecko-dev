const {E10SUtils} = ChromeUtils.import("resource://gre/modules/E10SUtils.jsm");

const PREF_NAME = "browser.tabs.remote.useHTTPResponseProcessSelection";
const HISTORY = [
  {url: httpURL("dummy_page.html")},
  {url: fileURL("dummy_page.html")},
  {url: httpURL("dummy_page.html")},
];

function reversed(list) {
  let copy = list.slice();
  copy.reverse();
  return copy;
}

function butLast(list) {
  let copy = list.slice();
  copy.pop();
  return copy;
}

async function runTest() {
  await BrowserTestUtils.withNewTab({gBrowser}, async function(aBrowser) {
    // Perform initial load of each URL in the history.
    let count = 0;
    let index = -1;
    for (let {url} of HISTORY) {
      BrowserTestUtils.loadURI(aBrowser, url);
      await BrowserTestUtils.browserLoaded(aBrowser, false, loaded => {
        return Services.io.newURI(loaded).scheme == Services.io.newURI(url).scheme;
      });

      count++;
      index++;
      await ContentTask.spawn(aBrowser, {count, index, url}, async function({count, index, url}) {
        docShell.QueryInterface(Ci.nsIWebNavigation);

        is(docShell.sessionHistory.count, count, "Initial Navigation Count Match");
        is(docShell.sessionHistory.index, index, "Initial Navigation Index Match");

        let real = Services.io.newURI(content.location.href);
        let expect = Services.io.newURI(url);
        is(real.scheme, expect.scheme, "Initial Navigation URL Scheme");
      });
    }

    // Go back to the first entry.
    for (let {url} of reversed(HISTORY).slice(1)) {
      ContentTask.spawn(aBrowser, {}, () => { content.history.back(); });
      await BrowserTestUtils.browserLoaded(aBrowser, false, loaded => {
        return Services.io.newURI(loaded).scheme == Services.io.newURI(url).scheme;
      });

      index--;
      await ContentTask.spawn(aBrowser, {count, index, url}, async function({count, index, url}) {
        docShell.QueryInterface(Ci.nsIWebNavigation);

        is(docShell.sessionHistory.count, count, "Go Back Count Match");
        is(docShell.sessionHistory.index, index, "Go Back Index Match");

        let real = Services.io.newURI(content.location.href);
        let expect = Services.io.newURI(url);
        is(real.scheme, expect.scheme, "Go Back URL Scheme");
      });
    }

    // Go forward to the last entry.
    for (let {url} of HISTORY.slice(1)) {
      ContentTask.spawn(aBrowser, {}, () => { content.history.forward(); });
      await BrowserTestUtils.browserLoaded(aBrowser, false, loaded => {
        return Services.io.newURI(loaded).scheme == Services.io.newURI(url).scheme;
      });

      index++;
      await ContentTask.spawn(aBrowser, {count, index, url}, async function({count, index, url}) {
        docShell.QueryInterface(Ci.nsIWebNavigation);

        is(docShell.sessionHistory.count, count, "Go Forward Count Match");
        is(docShell.sessionHistory.index, index, "Go Forward Index Match");

        let real = Services.io.newURI(content.location.href);
        let expect = Services.io.newURI(url);
        is(real.scheme, expect.scheme, "Go Forward URL Scheme");
      });
    }
  });
}


add_task(async function prefDisabled() {
  await SpecialPowers.pushPrefEnv({set: [[PREF_NAME, false]]});
  await runTest();
});


add_task(async function prefEnabled() {
  await SpecialPowers.pushPrefEnv({set: [[PREF_NAME, true]]});
  await runTest();
});
