import { useState, useEffect } from 'react';

// ====== 在这里修改你的话术树 ======
const story = {
  start: {
    text: "您好，我是XX公司的顾问小王。\n看到您对我们的智能办公系统感兴趣，想先了解一下您现在最想解决哪方面的问题呢？",
    choices: [
      { label: "客户表示感兴趣 → 继续介绍", next: "interested" },
      { label: "客户说只是随便看看 → 终止", next: "notNow" }
    ]
  },
  interested: {
    text: "太好了！我们的系统主要帮企业解决三个痛点：\n1. 审批流程慢（可提速60%）\n2. 数据报表手工做（自动生成）\n3. 多部门协同难（统一平台）\n\n您这边目前最头疼的是哪一个？",
    choices: [
      { label: "客户选中痛点 → 提供方案", next: "solution" },
      { label: "客户仍有犹豫 → 发资料后续跟进", next: "followUp" }
    ]
  },
  solution: {
    text: "针对您提到的审批问题，我们有一个标准版方案：\n包含流程自定义、移动端审批、超时自动提醒。\n价格是6800元/年，含3个月免费试用。\n\n需要我帮您开通试用吗？",
    choices: [
      { label: "客户同意试用 → 结束并记录", next: "endTrial" },
      { label: "客户考虑价格 → 发优惠活动", next: "priceTalk" }
    ]
  },
  followUp: { text: "完全理解，不需要马上决定。\n我整理了一份详细的产品对比和成功案例，发到您邮箱，您有空看看。\n我们保持联系，后续有任何问题随时问我。", choices: [] },
  priceTalk: {
    text: "价格方面我们除了标准版，还有一个基础版，只保留核心审批功能，价格是3800元/年。\n如果您今天能确定，我还可以额外申请一个8折优惠。",
    choices: [
      { label: "客户接受基础版", next: "endBasic" },
      { label: "客户仍想考虑", next: "endConsider" }
    ]
  },
  notNow: { text: "没关系，今天打扰您了。\n我加您一个微信，后续有需要随时找我。\n祝您工作愉快！", choices: [] },
  endTrial: { text: "好的，我马上为您创建试用账号，稍后短信发给您。\n试用期间有任何问题直接微信我，我会全程陪伴。\n感谢您的信任！", choices: [] },
  endBasic: { text: "好的，我这就走签约流程，合同半小时内发您。\n感谢您的信任，合作愉快！", choices: [] },
  endConsider: { text: "没问题的，资料您留着慢慢看。\n我下周三再跟您回访一次，方便吗？\n随时联系，再见！", choices: [] }
};

export default function Home() {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('loading'); // loading, valid, invalid, error
  const [currentNode, setCurrentNode] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const c = urlParams.get('code');
    if (!c) {
      setStatus('invalid');
      setMessage('缺少验证码');
      return;
    }
    setCode(c);
    checkCode(c);
  }, []);

  const checkCode = async (c) => {
    try {
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check', code: c })
      });
      const data = await res.json();
      if (data.valid) {
        setStatus('valid');
        setCurrentNode('start');
        trackNode('start');
      } else {
        setStatus('invalid');
        setMessage(data.msg || '链接无效');
      }
    } catch (e) {
      setStatus('error');
      setMessage('网络错误');
    }
  };

  const trackNode = async (nodeKey) => {
    try {
      await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'track', code, node: nodeKey })
      });
    } catch (e) {}
  };

  const handleChoice = (nextKey) => {
    setCurrentNode(nextKey);
    trackNode(nextKey);
  };

  if (status === 'loading') {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>正在验证...</div>;
  }

  if (status === 'invalid' || status === 'error') {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>{message}</div>;
  }

  const node = story[currentNode];
  if (!node) return <div>节点错误</div>;

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: '20px 16px', fontFamily: 'sans-serif' }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 24, marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize: 16, lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 20, color: '#1e293b' }}>
          {node.text}
        </div>
        {(node.choices || []).length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {node.choices.map((choice, idx) => {
              let btnStyle = {
                padding: '14px 0',
                border: 'none',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
                background: '#4f8bff',
                color: 'white'
              };
              if (idx === 1) btnStyle = { ...btnStyle, background: '#e2e8f0', color: '#334155' };
              if (choice.label.includes('终止') || choice.label.includes('拒绝')) btnStyle = { ...btnStyle, background: '#ef4444', color: 'white' };
              return (
                <button key={idx} style={btnStyle} onClick={() => handleChoice(choice.next)}>
                  {choice.label}
                </button>
              );
            })}
          </div>
        ) : (
          <button
            style={{ marginTop: 16, width: '100%', padding: '12px 0', border: '1.5px solid #cbd5e1', borderRadius: 12, fontSize: 14, background: 'white', color: '#64748b', cursor: 'pointer' }}
            onClick={() => { setCurrentNode('start'); trackNode('start'); }}
          >
            ↺ 重新开始
          </button>
        )}
      </div>
      <div style={{ fontSize: 13, color: '#999', textAlign: 'center', marginTop: 24 }}>点击按钮继续流程</div>
    </div>
  );
}
