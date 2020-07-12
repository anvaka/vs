/**
 * The core of the rendering process
 */
import createPanZoom from 'panzoom';
import createTextMeasure from './measureText';
import createAggregateLayout from './aggregateLayout';
import bus from '../bus';
import createLinkAnimator from './renderer/linkAnimator';
import buildLinkIndex from './buildLinkIndex';

let svg = require('simplesvg');

/**
 * Creates a new renderer. The rendering is done with SVG.
 */
export default function createRenderer(progress) {
  const scene = document.querySelector('#scene');
  const nodeContainer = scene.querySelector('#nodes');
  const edgeContainer = scene.querySelector('#edges');
  const hideTooltipArgs = {isVisible: false};
  const svgEl = document.querySelector('svg');
  const pt = svgEl.createSVGPoint();
  const panzoom = createPanZoom(scene);
  const defaultRectangle = {left: -500, right: 500, top: -500, bottom: 500}
  panzoom.showRectangle(defaultRectangle);

  // maps node id to node ui
  let nodes = new Map();

  let linkIndex;
  let layout, graph, currentLayoutFrame = 0, linkAnimator;
  let textMeasure = createTextMeasure(scene);
  bus.on('graph-ready', onGraphReady);

  return {
    render,
    dispose
  }

  function dispose() {
    clearLastScene();
    bus.off('graph-ready', onGraphReady);
  }

  function onMouseMove(e) {
    let link = findLinkInfoFromEvent(e);
    if (link) {
      showTooltip(link, e.clientX, e.clientY);
    } else {
      hideTooltip();
    }
  }

  function getNearestLink(x, y) {
    if (!linkIndex) return;

    pt.x = x; pt.y = y;
    let svgP = pt.matrixTransform(scene.getScreenCTM().inverse());
    let link = linkIndex.findNearestLink(svgP.x, svgP.y, 30);
    if (link) return link.id;
  }

  function onSceneClick(e) {
    let info = findLinkInfoFromEvent(e);
    if (info)  {
      bus.fire('show-details', info.link);
    }
  }

  function findLinkInfoFromEvent(e) {
    const id = e.target && e.target.id;
    let linkInfo = linkAnimator.getLinkInfo(id);
    if (!linkInfo) {
      let linkId = getNearestLink(e.clientX, e.clientY);
      linkInfo = linkAnimator.getLinkInfo(linkId);
    }
    return linkInfo;
  }

  function showTooltip(minLink, clientX, clientY) {
    const {fromId, toId} = minLink.link;
    bus.fire('show-tooltip', {
      isVisible: true,
      from: fromId, 
      to: toId, 
      x: clientX,
      y: clientY
    });

    removeHighlight();

    nodes.get(fromId).classList.add('hovered');
    nodes.get(toId).classList.add('hovered');
    minLink.ui.classList.add('hovered');
  }

  function hideTooltip() {
    bus.fire('show-tooltip', hideTooltipArgs);
    removeHighlight();
  }

  function removeHighlight() {
    scene.querySelectorAll('.hovered').forEach(removeHoverClass);
  }

  function removeHoverClass(el) {
    el.classList.remove('hovered');
  }

  function render(newGraph) {
    clearLastScene();
    graph = newGraph;

    layout = createAggregateLayout(graph, progress);
    
    layout.on('ready', drawLinks);

    nodes = new Map();

    graph.forEachNode(addNode);
    graph.on('changed', onGraphStructureChanged);

    cancelAnimationFrame(currentLayoutFrame);
    currentLayoutFrame = requestAnimationFrame(frame)
  }

  function onGraphReady(readyGraph) {
    if (readyGraph === graph) {
      layout.setGraphReady();
      progress.startLayout();
    }
  }

  function frame() {
    if (layout.step()) {
      currentLayoutFrame = requestAnimationFrame(frame)
    }
    updatePositions();
  }

  function onGraphStructureChanged(changes) {
    changes.forEach(change => {
      if (change.changeType === 'add' && change.node) {
        addNode(change.node);
      }
    })
  }

  function drawLinks() {
    progress.done();
    linkAnimator = createLinkAnimator(graph, layout, edgeContainer);
    document.addEventListener('mousemove', onMouseMove);
    svgEl.addEventListener('click', onSceneClick);
    let radius = 42;
    linkIndex = buildLinkIndex(graph, layout, radius);
    // let points = linkIndex.getPoints();
    // points.forEach(point => {
    //   scene.appendChild(svg('circle', {
    //     cx: point.x,
    //     cy: point.y,
    //     r: radius,
    //     fill: 'transparent',
    //   }))
    // })
  }

  function clearLastScene() {
    clear(nodeContainer);
    clear(edgeContainer);

    document.removeEventListener('mousemove', onMouseMove);
    svgEl.removeEventListener('click', onSceneClick);
    if (layout) layout.off('ready', drawLinks);
    if (graph) graph.off('changed', onGraphStructureChanged);
    if (linkAnimator) linkAnimator.dispose();
  }

  function clear(el) {
    while (el.lastChild) {
        el.removeChild(el.lastChild);
    }
  }

  function addNode(node) {
    const dRatio = (graph.maxDepth - node.data.depth)/graph.maxDepth;
    let pos = getNodePosition(node.id);
    if (node.data.depth === 0) {
      layout.pinNode(node);
    }

    const uiAttributes = getNodeUIAttributes(node.id, dRatio);
    layout.addNode(node.id, uiAttributes);

    const rectAttributes = {
      x: uiAttributes.x,
      y: uiAttributes.y,
      width: uiAttributes.width,
      height: uiAttributes.height,
      rx: uiAttributes.rx,
      ry: uiAttributes.ry,
      fill: 'white',
      'stroke-width': uiAttributes.strokeWidth, 
      stroke: '#58585A'
    }
    const textAttributes = {
      'font-size': uiAttributes.fontSize,
      x: uiAttributes.px,
      y: uiAttributes.py
    }
    
    const rect = svg('rect', rectAttributes);
    const text = svg('text', textAttributes)
    text.text(node.id);

    const ui = svg('g', {
      transform: `translate(${pos.x}, ${pos.y})`
    });
    ui.appendChild(rect);
    ui.appendChild(text);

    nodeContainer.appendChild(ui);
    nodes.set(node.id, ui);
  }


  function getNodeUIAttributes(nodeId, dRatio) {
    const fontSize = 24 * dRatio + 12;
    const size = textMeasure(nodeId, fontSize);
    const width = size.totalWidth + size.spaceWidth * 6;
    const height = fontSize * 1.6;

    return {
      fontSize,
      width,
      height,
      x: -width/2,
      y: -height/2,
      rx: 15 * dRatio + 2,
      ry: 15 * dRatio + 2,
      px: -width/2 + size.spaceWidth*3,
      py: -height/2 + fontSize * 1.1,
      strokeWidth: 4 * dRatio + 1
    };
  }

  function updatePositions() {
    nodes.forEach((ui, nodeId) => {
      let pos = getNodePosition(nodeId)
      ui.attr('transform', `translate(${pos.x}, ${pos.y})`);
    });
  }

  function getNodePosition(nodeId) {
    return layout.getNodePosition(nodeId);
  }
}