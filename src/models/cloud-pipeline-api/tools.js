import apiGet from '../base/api-get';

export default function getTools() {
  return new Promise((resolve, reject) => {
    apiGet('dockerRegistry/loadTree')
      .then((result) => {
        const { status, message, payload } = result;
        if (status === 'OK') {
          const { registries = [] } = payload || {};
          const tools = [];
          for (let r = 0; r < registries.length; r += 1) {
            const registry = registries[r];
            const { groups = [] } = registry;
            for (let g = 0; g < groups.length; g += 1) {
              const { tools: groupTools = [] } = groups[g];
              tools.push(
                ...groupTools
                  .map((groupTool) => ({
                    ...groupTool,
                    id: groupTool.id,
                    image: `${groupTool.registry}/${groupTool.image}`,
                    hasIcon: groupTool.hasIcon,
                    description: groupTool.shortDescription,
                    name: groupTool.image.split('/').pop(),
                  }))
                  .map((tool) => ({
                    ...tool,
                    imageRegExp: new RegExp(`^${tool.image}(:.*)?$`, 'i'),
                  })),
              );
            }
          }
          resolve(tools);
        } else {
          reject(new Error(message || `Error fetching tools (status ${status})`));
        }
      })
      .catch(reject);
  });
}
