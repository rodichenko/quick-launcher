import apiPost from '../base/api-post';
import getSettings from '../base/settings';

export default function shareRun(id) {
  return new Promise((resolve, reject) => {
    getSettings()
      .then((settings) => {
        const shareWith = [
          ...(settings?.shareWithUsers || '')
            .split(',')
            .map(u => u.trim())
            .filter(Boolean)
            .map(u => ({name: u, isPrincipal: true})),
          ...(settings?.shareWithGroups || '')
            .split(',')
            .map(u => u.trim())
            .filter(Boolean)
            .map(u => ({name: u, isPrincipal: false})),
        ]
          .map(s => ({...s, accessType: 'ENDPOINT', runId: id}));
        if (shareWith.length > 0) {
          console.log(`Sharing run #${id} with ${shareWith.map(s => s.name).join(', ')}`);
          apiPost(`run/${id}/updateSids`, shareWith)
            .then((result) => {
              const {status, message, payload} = result;
              if (status === 'OK') {
                resolve(payload);
              } else {
                reject(new Error(message || `Error sharing run: status ${status}`));
              }
            })
            .catch(reject);
        } else {
          resolve();
        }
      })
      .catch(reject);
  });
}
