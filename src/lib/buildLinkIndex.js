import Flatbush from 'flatbush';

/**
 * This function constructs a spatial index for every edge of a graph,
 * so that users don't have to be extremely precise with mouse movement
 * when hovering over an edge.
 */
export default function buildLinkIndex(graph, layout, maxDistance = 42) {
  // The `pointIndex` is spatial lookup into collection of `points`.
  // Each point has a `link` and `x, y` coordinates.
  let {pointIndex, points} = createInternalIndex();
  
  return {
    /**
     * Finds an edge near `x, y` coordinates
     */
    findNearestLink,

    /**
     * Just a debugger method to render indexed points
     */
    getPoints() { return points; }
  };

  function findNearestLink(x, y) {
    const neighborIds = pointIndex.neighbors(x, y, 1);
    let pointId = neighborIds[0];
    if (pointId === undefined) return;
    let point = points[pointId];
    if (distance({x,y}, point) < maxDistance) return point.link;
  }

  function createInternalIndex() {
    // The main idea is very simple - slice every single link with a ball of radius
    // `maxDistance`, and then build a spatial index tree.
    let step = maxDistance
    let points = [];

    graph.forEachLink(link => {
      let from = layout.getNodePosition(link.fromId);
      let to = layout.getNodePosition(link.toId)
      let linkDistance = distance(from, to);

      // This is going to be the direction in which we will be adding circles:
      let dx = to.x - from.x; let dy = to.y - from.y;
      dx /= linkDistance; dy /= linkDistance;

      // Start from the link point
      let nextPoint = {
        x: from.x,
        y: from.y,
        link
      };

      // And slice the link into pieces...
      while (distance(nextPoint, from) < linkDistance) {
        points.push(nextPoint);
        nextPoint = {
          x: nextPoint.x + step * dx,
          y: nextPoint.y + step * dy,
          link
        };
      }

      // Don't forget about last point of the link:
      points.push({
        x: to.x,
        y: to.y,
        link
      });
    });

    // Now we have all points, we can build spatial index:
    let pointIndex = new Flatbush(points.length)
    let pointSize = step * 0.4;
    points.forEach(point => {
      pointIndex.add(
        point.x - pointSize, point.y - pointSize, 
        point.x + pointSize, point.y + pointSize
      );
    });
    pointIndex.finish();
    return {pointIndex, points};
  }
}

function distance(a, b) {
  let dx = b.x - a.x;
  let dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}