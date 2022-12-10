import buildGraph from './lib/buildGraph';
import Progress from './Progress';
import {reactive} from 'vue';

const queryState = require('query-state');

const qs = queryState({
  query: ''
}, {
  useSearch: true
});

let lastBuilder;
const appStateFromQuery = qs.get();
const appState = reactive({
  hasGraph: false,
  maxDepth: appStateFromQuery.maxDepth || 2,
  progress: new Progress(),
  graph: null,
  query: appStateFromQuery.query,
  pattern: appStateFromQuery.pattern || '[query] vs ...'
});

if (appState.query) {
  performSearch(appState.query);
}

qs.onChange(updateAppState);

function updateAppState(newState) {
  appState.query = newState.query;
}

export function performSearch(queryString) {
  debugger;
  appState.hasGraph = true;
  appState.progress.reset();

  qs.set('query', queryString);
  if (lastBuilder) {
    lastBuilder.dispose();
  }

  lastBuilder = buildGraph(queryString, appState.pattern, appState.maxDepth, appState.progress);
  appState.graph = Object.freeze(lastBuilder.graph);
  return lastBuilder.graph;
}

export function resolveQueryFromLink(from, to) {
  return appState.pattern.replace('[query]', from).replace('...', to);
}

export function getAppState() {
  return appState;
}