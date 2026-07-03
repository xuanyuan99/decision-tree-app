import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, code, node } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Missing code' });
  }

  const recordKey = `code:${code}`;

  try {
    if (action === 'check') {
      // 检查是否存在且未查看
      const record = await kv.hgetall(recordKey);
      if (!record || Object.keys(record).length === 0) {
        return res.json({ valid: false, msg: '无效的链接' });
      }
      if (record.viewed === 'true') {
        return res.json({ valid: false, msg: '该链接已被查看过，已失效' });
      }
      // 标记为已查看
      await kv.hset(recordKey, {
        viewed: 'true',
        viewTime: new Date().toISOString(),
        nodes: JSON.stringify([]) // 初始化空节点数组
      });
      return res.json({ valid: true });
    } else if (action === 'track') {
      // 记录节点
      const record = await kv.hgetall(recordKey);
      if (record && record.nodes) {
        const nodes = JSON.parse(record.nodes);
        nodes.push(node);
        await kv.hset(recordKey, { nodes: JSON.stringify(nodes) });
      }
      return res.json({ ok: true });
    } else {
      return res.status(400).json({ error: 'Unknown action' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}
