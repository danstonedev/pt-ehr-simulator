// case-export.js - Create a self-contained case JSON embedding attachment blobs as data URLs.
// This keeps normal runtime lightweight (IndexedDB blobs) while allowing a portable export
// that can be imported elsewhere without needing the original browser storage.

import { attachments as Att } from './attachments.js';

const DEFAULT_SINGLE_LIMIT = 2 * 1024 * 1024; // 2 MB per file
const DEFAULT_TOTAL_LIMIT = 12 * 1024 * 1024; // 12 MB per export

async function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(fr.error);
    fr.onload = () => resolve(fr.result);
    fr.readAsDataURL(blob);
  });
}

/**
 * Export a case + draft into a single JSON object with embedded attachments.
 * @param {Object} caseObj Original case object (will not be mutated)
 * @param {Object} draft Draft object containing note sections
 * @param {Object} [opts]
 * @param {number} [opts.singleLimitBytes] Max size per attachment to embed
 * @param {number} [opts.totalLimitBytes] Max total embedded bytes
 * @param {boolean} [opts.download] Trigger browser download automatically
 * @returns {Promise<{exportObject:Object, stats:Object}>}
 */
async function embedAttachmentsOnClone(clone, singleLimit, totalLimit) {
  let embeddedCount = 0;
  let skippedCount = 0;
  let totalEmbeddedBytes = 0;
  if (!Array.isArray(clone.modules)) return { embeddedCount, skippedCount, totalEmbeddedBytes };

  const canEmbed = () => Att?.isSupported();

  async function tryEmbed(att) {
    if (!att || att.dataUrl) return; // nothing to do
    const id = att.id;
    if (!id || !canEmbed()) {
      skippedCount++;
      return;
    }
    const rec = await Att.get(id).catch(() => null);
    if (!rec?.blob) {
      skippedCount++;
      return;
    }
    if (rec.size > singleLimit) {
      att.embedStatus = 'skipped_too_large';
      skippedCount++;
      return;
    }
    if (totalEmbeddedBytes + rec.size > totalLimit) {
      att.embedStatus = 'skipped_total_cap';
      skippedCount++;
      return;
    }
    const dataUrl = await blobToDataURL(rec.blob).catch(() => null);
    if (!dataUrl) {
      att.embedStatus = 'skipped_error';
      skippedCount++;
      return;
    }
    att.dataUrl = dataUrl;
    att.embedStatus = 'embedded';
    embeddedCount++;
    totalEmbeddedBytes += rec.size;
  }

  for (const mod of clone.modules) {
    const list = mod?.data?.attachments;
    if (!Array.isArray(list)) continue;
    for (const att of list) {
      await tryEmbed(att);
    }
  }

  return { embeddedCount, skippedCount, totalEmbeddedBytes };
}

export async function exportSelfContainedCase(caseObj, draft, opts = {}) {
  const singleLimit = opts.singleLimitBytes ?? DEFAULT_SINGLE_LIMIT;
  const totalLimit = opts.totalLimitBytes ?? DEFAULT_TOTAL_LIMIT;
  const download = opts.download !== false; // default true

  const clone = JSON.parse(JSON.stringify(caseObj || {}));
  const noteKeys = ['subjective', 'objective', 'assessment', 'plan', 'billing'];
  noteKeys.forEach((k) => {
    if (draft && Object.prototype.hasOwnProperty.call(draft, k)) clone[k] = draft[k];
  });
  if (draft && Array.isArray(draft.modules)) clone.modules = draft.modules.slice();

  const { embeddedCount, skippedCount, totalEmbeddedBytes } = await embedAttachmentsOnClone(
    clone,
    singleLimit,
    totalLimit,
  );

  clone.exportMeta = {
    exportedAt: new Date().toISOString(),
    embeddedAttachments: embeddedCount,
    skippedAttachments: skippedCount,
    totalEmbeddedBytes,
    singleLimitBytes: singleLimit,
    totalLimitBytes: totalLimit,
    format: 'pt-emr.case+json',
    version: 1,
  };

  const exportObject = clone;
  const json = JSON.stringify(exportObject, null, 2);
  if (download) {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeTitle = (clone.caseTitle || clone.title || 'case')
      .replace(/[^a-z0-9-_]+/gi, '_')
      .slice(0, 60);
    a.download = safeTitle + '_selfcontained.json';
    a.href = url;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  }
  return { exportObject, stats: clone.exportMeta };
}

export default exportSelfContainedCase;
