// 简单的示例应用入口
console.log('ETagAutoRefresh 插件示例应用已加载');

// 定义一个简单的计数器，每秒更新一次
let counter = 0;
const counterElement = document.createElement('div');
counterElement.style.position = 'fixed';
counterElement.style.bottom = '10px';
counterElement.style.right = '10px';
counterElement.style.background = 'rgba(0,0,0,0.7)';
counterElement.style.color = 'white';
counterElement.style.padding = '5px 10px';
counterElement.style.borderRadius = '4px';
counterElement.style.fontSize = '12px';
document.body.appendChild(counterElement);

setInterval(() => {
  counter++;
  counterElement.textContent = `页面已运行 ${counter} 秒`;

  // 显示 ETagAutoRefresh 信息（如果存在）
  if (window.ETagAutoRefresh) {
    const etagInfo = `ETag: ${window.ETagAutoRefresh.currentEtag || 'unknown'} | 版本: ${window.ETagAutoRefresh.version}`;
    counterElement.title = etagInfo;
  }
}, 1000);

// 添加 API 回显
const apiButton = document.getElementById('api-test');
if (apiButton) {
  apiButton.addEventListener('click', async () => {
    try {
      const response = await fetch('/api/test');
      const data = await response.json();
      alert(`API 响应: ${JSON.stringify(data)}`);
    } catch (error) {
      console.error('API 请求失败:', error);
      alert('API 请求失败，请查看控制台');
    }
  });
} 