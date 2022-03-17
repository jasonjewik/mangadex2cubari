chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ toggle: 'on' });
});

async function fetchAsync(url) {
  let id = url.split('/')[4];
  let page = url.split('/')[5];
  let endpoint = `https://api.mangadex.org/chapter/${id}`;
  let response = await fetch(endpoint);
  let json = await response.json();
  if (json.result == 'ok') {
    const chapter = json.data.attributes.chapter;
    for (const rel of json.data.relationships) {
      if (rel.type == 'manga') {
        const res = `https://cubari.moe/read/mangadex/${rel.id}/${chapter}/${page}`;
        return res;
      }
    }
  } else {
    return url;
  }
}

chrome.webNavigation.onCommitted.addListener(
  (details) => {
    const url = details.url;
    // Linked to a title page
    const title_re = /https:\/\/mangadex\.org\/title\/(.+)\/(.+)/;
    const title_match = url.match(title_re);
    if (title_match != null) {
      chrome.tabs.create({
        url: url.replace(title_re, 'https://cubari.moe/read/mangadex/$1'),
      });
    }
    // Linked to a particular chapter
    const chap_re = /https:\/\/mangadex\.org\/chapter\/*/;
    const chap_match = url.match(chap_re);
    if (chap_match != null) {
      fetchAsync(url).then((target) => {
        chrome.tabs.create({
          url: target,
        });
      });
    }
    // Cleanup
    if (title_match != null || chap_match != null) {
      chrome.tabs.query({ url: url }, (tabs) => {
        chrome.tabs.remove(tabs[0].id);
      });
    }
  },
  {
    url: [{ urlMatches: 'https://mangadex.org' }],
  },
);
