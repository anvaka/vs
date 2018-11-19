let myIndex = 0;

export default function corsFetch(url, options) {
  if (!options) options = {};

  let isCancelled, actualResolve, actualReject;
  let loadScript = null;
  const name = 'callback' + (myIndex++);
  window[name] = downloaded;
  let cancelable = new Promise(download);
  cancelable.cancel = cancel;


  return cancelable;

  function download(resolve, reject) {
    actualResolve = resolve;
    actualReject = reject;

    loadScript = document.createElement('script');
    loadScript.src = `${url}&callback=${name}`;
    loadScript.onerror = reject;
    document.head.appendChild(loadScript);
  }

  function cancel() {
    isCancelled = true;
  }

  function downloaded(e) {
    if (isCancelled) {
      dispose();
      return;
    }

    actualResolve(e);
    dispose();
  }

  function dispose() {
    if (loadScript) {
      document.head.removeChild(loadScript);
      loadScript = null;
    }
    delete window[name];
  }
}