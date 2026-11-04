import { ExportBox } from './export-bounds';

const SVG_NS = 'http://www.w3.org/2000/svg';

export interface ExportSvgOptions {
  box: ExportBox;
  width: number;
  height: number;
  keepElementIds: ReadonlySet<string>;
  background: boolean;
}

export function buildExportSvg(source: SVGSVGElement, options: ExportSvgOptions): SVGSVGElement {
  const { box, width, height, keepElementIds, background } = options;
  const clone = source.cloneNode(true) as SVGSVGElement;

  // Elements pivot around their fill-box center via the component stylesheet, which is not
  // part of the serialized SVG, so the rule is inlined to match the live render.
  const style = document.createElementNS(SVG_NS, 'style');
  style.textContent = '.wb_element { transform-box: fill-box; transform-origin: center; }';
  clone.insertBefore(style, clone.firstChild);

  clone.querySelector('#selectorParentGroup')?.remove();

  clone.querySelectorAll('rect[fill="url(#grid)"]').forEach((rect) => {
    const parent = rect.parentElement;
    (parent && parent !== (clone as Element) ? parent : rect).remove();
  });

  clone.querySelectorAll('[data-wb-id]').forEach((node) => {
    if (!keepElementIds.has(node.getAttribute('data-wb-id') ?? '')) node.remove();
  });

  const contentGroup = clone.querySelector('#contentGroup');
  if (contentGroup) {
    contentGroup.removeAttribute('transform');
    Array.from(contentGroup.children).forEach((child) => {
      if (!child.hasAttribute('data-wb-id')) child.remove();
    });
  }

  const backgroundRect = clone.querySelector('#contentBackground');
  if (backgroundRect) {
    if (background) {
      backgroundRect.removeAttribute('opacity');
      backgroundRect.setAttribute('x', String(box.x));
      backgroundRect.setAttribute('y', String(box.y));
      backgroundRect.setAttribute('width', String(box.width));
      backgroundRect.setAttribute('height', String(box.height));
    } else {
      backgroundRect.remove();
    }
  }

  stripAngularAttributes(clone);
  clone.querySelectorAll('*').forEach(stripAngularAttributes);

  clone.setAttribute('x', '0');
  clone.setAttribute('y', '0');
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  clone.setAttribute('viewBox', `${box.x} ${box.y} ${box.width} ${box.height}`);

  return clone;
}

function stripAngularAttributes(node: Element): void {
  for (const name of node.getAttributeNames()) {
    if (name.startsWith('_ngcontent') || name.startsWith('_nghost')) node.removeAttribute(name);
  }
}
