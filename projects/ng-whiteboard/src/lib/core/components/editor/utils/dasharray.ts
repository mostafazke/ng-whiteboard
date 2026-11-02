export function buildDasharray(lineStyle: string, width: number): string {
  switch (lineStyle) {
    case 'dashed':
      return `${width * 3},${width * 3}`;
    case 'dotted':
      return `${width},${width * 2}`;
    case 'dashdot':
      return `${width * 5},${width * 2},${width},${width * 2}`;
    default:
      return '';
  }
}
