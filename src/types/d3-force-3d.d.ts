declare module 'd3-force-3d' {
  export function forceSimulation(nodes?: unknown[], numDimensions?: number): ForceSimulation;
  export function forceLink(links?: unknown[]): ForceLink;
  export function forceManyBody(): ForceManyBody;
  export function forceCenter(x?: number, y?: number, z?: number): ForceCenter;
  export function forceCollide(radius?: number): ForceCollide;

  interface ForceSimulation {
    force(name: string, force?: unknown): ForceSimulation;
    nodes(nodes?: unknown[]): ForceSimulation;
    alpha(value?: number): ForceSimulation;
    alphaDecay(value?: number): ForceSimulation;
    velocityDecay(value?: number): ForceSimulation;
    restart(): ForceSimulation;
    stop(): ForceSimulation;
    on(event: string, callback: () => void): ForceSimulation;
  }

  interface ForceLink {
    id(accessor: (d: unknown) => string): ForceLink;
    distance(value: number): ForceLink;
    strength(value: number): ForceLink;
    links(links?: unknown[]): ForceLink;
  }

  interface ForceManyBody {
    strength(value: number): ForceManyBody;
    distanceMax(value: number): ForceManyBody;
    distanceMin(value: number): ForceManyBody;
  }

  interface ForceCenter {
    strength(value: number): ForceCenter;
    x(value: number): ForceCenter;
    y(value: number): ForceCenter;
    z(value: number): ForceCenter;
  }

  interface ForceCollide {
    radius(value: number): ForceCollide;
    strength(value: number): ForceCollide;
    iterations(value: number): ForceCollide;
  }
}
