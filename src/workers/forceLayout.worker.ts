// Force-Directed Layout Web Worker
// Uses d3-force-3d to compute 3D positions off the main thread

import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
} from 'd3-force-3d';

interface Node {
  id: string;
  x: number;
  y: number;
  z: number;
  vx?: number;
  vy?: number;
  vz?: number;
  index?: number;
}

interface Link {
  source: string | Node;
  target: string | Node;
}

interface WorkerMessage {
  type: 'init' | 'update' | 'addNode' | 'removeNode' | 'addLink' | 'removeLink';
  nodes?: Array<{ id: string; x?: number; y?: number; z?: number }>;
  links?: Array<{ source: string; target: string }>;
  nodeId?: string;
  link?: { source: string; target: string };
}

let simulation: ReturnType<typeof forceSimulation> | null = null;
let nodes: Node[] = [];
let links: Link[] = [];

function sendPositions() {
  const positions: Record<string, { x: number; y: number; z: number }> = {};
  for (const node of nodes) {
    positions[node.id] = {
      x: node.x || 0,
      y: node.y || 0,
      z: node.z || 0,
    };
  }
  self.postMessage({ type: 'positions', positions });
}

function createSimulation() {
  if (simulation) {
    simulation.stop();
  }

  simulation = forceSimulation(nodes, 3)
    .force(
      'link',
      forceLink(links)
        .id((d: unknown) => (d as Node).id)
        .distance(14)
        .strength(0.2)
    )
    .force('charge', forceManyBody().strength(-200).distanceMax(50))
    .force('center', forceCenter(0, 0, 0).strength(0.03))
    .force('collide', forceCollide(3).strength(0.8))
    .alphaDecay(0.02)
    .velocityDecay(0.3)
    .on('tick', () => {
      sendPositions();
    })
    .on('end', () => {
      sendPositions();
      self.postMessage({ type: 'settled' });
    });
}

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type } = event.data;

  switch (type) {
    case 'init': {
      const initNodes = event.data.nodes || [];
      const initLinks = event.data.links || [];

      nodes = initNodes.map((n) => ({
        id: n.id,
        x: n.x ?? (Math.random() - 0.5) * 15,
        y: n.y ?? (Math.random() - 0.5) * 15,
        z: n.z ?? (Math.random() - 0.5) * 10,
      }));

      links = initLinks.map((l) => ({
        source: l.source,
        target: l.target,
      }));

      createSimulation();
      break;
    }

    case 'addNode': {
      if (event.data.nodes && event.data.nodes.length > 0) {
        const n = event.data.nodes[0];
        nodes.push({
          id: n.id,
          x: n.x ?? (Math.random() - 0.5) * 15,
          y: n.y ?? (Math.random() - 0.5) * 15,
          z: n.z ?? (Math.random() - 0.5) * 10,
        });
        createSimulation();
      }
      break;
    }

    case 'removeNode': {
      if (event.data.nodeId) {
        const nodeId = event.data.nodeId;
        nodes = nodes.filter((n) => n.id !== nodeId);
        links = links.filter((l) => {
          const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
          const targetId = typeof l.target === 'string' ? l.target : l.target.id;
          return sourceId !== nodeId && targetId !== nodeId;
        });
        createSimulation();
      }
      break;
    }

    case 'addLink': {
      if (event.data.link) {
        links.push({
          source: event.data.link.source,
          target: event.data.link.target,
        });
        createSimulation();
      }
      break;
    }

    case 'removeLink': {
      if (event.data.link) {
        const { source, target } = event.data.link;
        links = links.filter((l) => {
          const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
          const targetId = typeof l.target === 'string' ? l.target : l.target.id;
          return !(sourceId === source && targetId === target);
        });
        createSimulation();
      }
      break;
    }

    case 'update': {
      // Reheat simulation
      if (simulation) {
        simulation.alpha(0.5).restart();
      }
      break;
    }
  }
};
