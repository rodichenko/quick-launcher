import getNodes from './nodes';
import fetchSettings from '../base/settings';

export default function getAvailableNode() {
  return new Promise((resolve, reject) => {
    fetchSettings()
      .then((settings) => {
        getNodes()
          .then((nodes) => {
            const [node] = nodes.filter((o) => o.runId
              && o.labels
              && Object.prototype.hasOwnProperty.call(o.labels, settings.tag)
              && settings.tagValueRegExp.test(node.labels[settings.tag]));
            resolve(node);
          })
          .catch(reject);
      });
  });
}
