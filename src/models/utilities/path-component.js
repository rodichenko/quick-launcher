/* eslint-disable no-useless-escape */
import { escapeRegExp } from './escape-reg-exp';

export function pathComponentHasPlaceholder(pathComponent) {
  return /.*\[[^\[\]]+\].*/.test(pathComponent);
}

export default function PathComponent(configuration) {
  const {
    path,
    hasPlaceholders,
    gatewaySpecFile,
  } = configuration;
  const groups = [];
  const regExp = /\[([^\]\[]*)\]/;
  let p = path.slice();
  let e = regExp.exec(p);
  let mask = '^';
  while (e) {
    mask = `${mask}${escapeRegExp(p.slice(0, e.index))}(.*?)`;
    p = p.slice(e.index + (e[0] || '').length);
    groups.push(e[1] || '');
    e = regExp.exec(p);
  }
  mask = `${mask}${escapeRegExp(p)}$`;
  return {
    path,
    hasPlaceholders,
    gatewaySpecFile,
    groups,
    mask: new RegExp(mask, 'i'),
    parsePathComponent(pathComponent) {
      const info = {};
      const maskExec = this.mask.exec(pathComponent);
      if (maskExec && maskExec.length === this.groups.length + 1) {
        for (let g = 0; g < this.groups.length; g += 1) {
          info[this.groups[g]] = maskExec[g + 1];
        }
        return info;
      }
      return false;
    },
  };
}
