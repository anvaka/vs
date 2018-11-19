import corsFetch from "./corsFetch";
import bus from '../bus';

export default function buildGraph(entryWord, pattern, MAX_DEPTH, progress) {
  entryWord = entryWord && entryWord.trim();
  if (!entryWord) return;

  entryWord = entryWord.toLocaleLowerCase();

  const insertPosition = pattern.indexOf('...');
  if (insertPosition < 0) {
    throw new Error('Query pattern is missing "..."');
  }
  const queryPosition = pattern.indexOf('[query]');
  if (queryPosition < 0) {
    throw new Error('Query pattern is missing "[query]" keyword');
  }

  if (insertPosition < queryPosition) {
    throw new Error('[query] should come before ...');
  }

  let cancelled = false;
  let pendingResponse;
  let graph = require('ngraph.graph')();
  graph.maxDepth = MAX_DEPTH;
  let queue = [];
  let requestDelay = 300 + Math.random() * 100;
  progress.startDownload();

  startQueryConstruction();

  return {
    dispose,
    graph
  }

  function dispose() {
    cancelled = true;
    if (pendingResponse) {
      pendingResponse.cancel();
      pendingResponse = null;
    }
  }

  function startQueryConstruction() {
    graph.addNode(entryWord, {depth: 0});
    fetchNext(entryWord);
  }

  function loadSiblings(parent, results) {
    let q = fullQuery(parent).toLocaleLowerCase();
    var parentNode = graph.getNode(parent);

    if (!parentNode) {
      throw new Error('Parent is missing for ' + parent);
    }

    results.filter(x => x.toLocaleLowerCase().indexOf(q) === 0)
      .map(x => x.substring(q.length))
      .forEach(other => {
        const hasOtherNode = graph.hasNode(other);
        const hasOtherLink = graph.getLink(other, parent) || graph.getLink(parent, other);
        if (hasOtherNode) {
          if (!hasOtherLink) {
            graph.addLink(parent, other);
          }
          return;
        }

        let depth = parentNode.data.depth + 1;
        graph.addNode(other, {depth});
        graph.addLink(parent, other);
        if (depth < MAX_DEPTH) queue.push(other);
      });

    setTimeout(loadNext, requestDelay);
  }

  function loadNext() {
    if (cancelled) return;
    if (queue.length === 0) {
      bus.fire('graph-ready', graph);
      return;
    }

    let nextWord = queue.shift();
    fetchNext(nextWord);
    progress.updateLayout(queue.length, nextWord);
  }

  function fetchNext(query) {
    pendingResponse = getResponse(fullQuery(query));
    pendingResponse.then(res => onPendingReady(res, query)).catch((msg) => {
      const err = 'Failed to download ' + query + '; Message: ' + msg;
      console.error(err);
      progress.downloadError(err)
      loadNext();
    });
  }

  function onPendingReady(res, query) {
    if (res.length >= 2) {
      loadSiblings(query, res[1]);
    } else {
      console.error(res);
      throw new Error('Unexpected response');
    }
  }

  function fullQuery(query) {
    return pattern.replace('[query]', query).replace('...', '');
  }

  function getResponse(query) {
    return corsFetch('//suggestqueries.google.com/complete/search?client=firefox&q=' + encodeURIComponent(query));
  }
}