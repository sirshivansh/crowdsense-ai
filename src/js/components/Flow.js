import { simulator } from '../data/simulation.js';

export class Flow {
  constructor(layerId, routingInstance) {
    this.layer = document.getElementById(layerId);
    this.routing = routingInstance;
    this.particles = [];
    this.initFlows();
  }

  initFlows() {
    if (!this.layer) return;

    const activeEdges = [
      ['gate_a', 'nw_corner'],
      ['nw_corner', 'section_101'],
      ['gate_b', 'ne_corner'],
      ['ne_corner', 'section_101'],
      ['food_court', 'se_corner'],
      ['se_corner', 'section_205'],
      ['nw_corner', 'sw_corner'],
      ['sw_corner', 'section_205']
    ];

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    this.layer.appendChild(defs);

    activeEdges.forEach((edge, idx) => {
      const p1 = this.routing.nodes[edge[0]];
      const p2 = this.routing.nodes[edge[1]];

      const pathId = `flow-path-${idx}`;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('id', pathId);
      path.setAttribute('d', `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`);
      defs.appendChild(path);

      // Fewer, subtler particles — 2 per edge
      for (let i = 0; i < 2; i++) {
        this.createParticle(pathId, edge, i * 2.5);
      }
    });

    simulator.on('update:heatmap', () => this.updateFlowSpeeds());
  }

  createParticle(pathId, edge, delay) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('r', '2');
    // Subtle muted blue — no neon glow
    circle.setAttribute('fill', 'rgba(120,180,255,0.55)');
    circle.setAttribute('opacity', '0.7');

    const anim = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
    anim.setAttribute('dur', '6s');
    anim.setAttribute('repeatCount', 'indefinite');
    anim.setAttribute('begin', `${delay}s`);

    const mpath = document.createElementNS('http://www.w3.org/2000/svg', 'mpath');
    mpath.setAttribute('href', `#${pathId}`);
    anim.appendChild(mpath);
    circle.appendChild(anim);
    this.layer.appendChild(circle);

    this.particles.push({ circle, anim, edge });
  }

  updateFlowSpeeds() {
    const state = simulator.state;
    this.particles.forEach(p => {
      let d1 = 0.5, d2 = 0.5;
      if (this.routing.nodes[p.edge[0]].isZone) {
        const z1 = state.zones.find(z => z.id === p.edge[0]);
        if (z1) d1 = z1.density;
      }
      if (this.routing.nodes[p.edge[1]].isZone) {
        const z2 = state.zones.find(z => z.id === p.edge[1]);
        if (z2) d2 = z2.density;
      }

      const avgD = (d1 + d2) / 2;
      // Congestion → slower particles (4s base, up to 12s max)
      const newDur = 4 + (avgD * 8);
      p.anim.setAttribute('dur', `${newDur.toFixed(1)}s`);

      // Subtle color shift: blue → muted amber on congestion
      if (avgD > 0.8) {
        p.circle.setAttribute('fill', 'rgba(232,160,32,0.45)');
      } else if (avgD > 0.55) {
        p.circle.setAttribute('fill', 'rgba(160,180,255,0.5)');
      } else {
        p.circle.setAttribute('fill', 'rgba(120,180,255,0.55)');
      }
    });
  }
}