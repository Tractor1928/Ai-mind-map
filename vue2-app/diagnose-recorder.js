// 录音问题诊断工具
console.log('=== 录音问题诊断工具 ===');

// 检查浏览器支持
function checkBrowserSupport() {
  console.log('1. 浏览器支持情况:');
  console.log('   - getUserMedia支持:', !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
  console.log('   - WebRTC支持:', !!(window.RTCPeerConnection));
  console.log('   - AudioContext支持:', !!(window.AudioContext || window.webkitAudioContext));
}

// 检查权限状态
async function checkPermissions() {
  console.log('2. 权限检查:');
  try {
    // 检查权限状态
    if (navigator.permissions) {
      const micPermission = await navigator.permissions.query({ name: 'microphone' });
      console.log('   - 麦克风权限状态:', micPermission.state);
    }
    
    // 尝试获取媒体流
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log('   - 麦克风访问: ✓');
    
    // 获取音频设备信息
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioInputs = devices.filter(device => device.kind === 'audioinput');
    console.log('   - 可用音频输入设备数量:', audioInputs.length);
    audioInputs.forEach((device, index) => {
      console.log(`     ${index + 1}. ${device.label || '未知设备'} (${device.deviceId.substring(0, 8)}...)`);
    });
    
    // 关闭测试流
    stream.getTracks().forEach(track => track.stop());
  } catch (e) {
    console.log('   - 麦克风访问: ✗', e.message);
    return false;
  }
  return true;
}

// 检查SDK录音器状态
function checkRecorderStatus() {
  console.log('3. SDK录音器状态:');
  try {
    if (window.avatarPlatform2 && window.avatarPlatform2.recorder) {
      console.log('   - 录音器实例: ✓');
      console.log('   - 录音状态:', window.avatarPlatform2.recorder.recording ? '正在录音' : '未录音');
    } else {
      console.log('   - 录音器实例: ✗ 未创建或已销毁');
    }
  } catch (e) {
    console.log('   - 录音器检查失败:', e.message);
  }
}

// 检查事件监听器
function checkEventListeners() {
  console.log('4. 事件监听器状态:');
  try {
    if (window.avatarPlatform2 && window.avatarPlatform2.events) {
      const eventNames = Object.keys(window.avatarPlatform2.events);
      console.log('   - 已注册事件数量:', eventNames.length);
      console.log('   - ASR事件监听器:', eventNames.includes('asr') ? '✓' : '✗');
      console.log('   - NLP事件监听器:', eventNames.includes('nlp') ? '✓' : '✗');
    }
  } catch (e) {
    console.log('   - 事件监听器检查失败:', e.message);
  }
}

// 完整诊断
async function diagnoseRecorder() {
  console.log('开始录音系统诊断...\n');
  
  checkBrowserSupport();
  console.log('');
  
  const hasPermission = await checkPermissions();
  console.log('');
  
  checkRecorderStatus();
  console.log('');
  
  checkEventListeners();
  console.log('');
  
  // 给出诊断结果和建议
  console.log('=== 诊断结果与建议 ===');
  
  if (!hasPermission) {
    console.log('❌ 问题：麦克风权限未获得');
    console.log('💡 解决方案：');
    console.log('   1. 点击地址栏的锁头图标，允许麦克风访问');
    console.log('   2. 或在浏览器设置中手动添加网站到麦克风允许列表');
    console.log('   3. 刷新页面重新请求权限');
  }
  
  if (!window.avatarPlatform2 || !window.avatarPlatform2.recorder) {
    console.log('❌ 问题：录音器未正确初始化');
    console.log('💡 解决方案：运行 fixRecorder() 重新创建录音器');
  }
  
  console.log('\n📝 常用修复命令：');
  console.log('   - diagnoseRecorder() : 重新运行诊断');
  console.log('   - fixRecorder() : 修复录音器');
  console.log('   - testRecording() : 测试录音功能');
}

// 修复录音器
async function fixRecorder() {
  console.log('=== 开始修复录音器 ===');
  
  try {
    // 1. 重新检查权限
    await navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      stream.getTracks().forEach(track => track.stop());
      console.log('✓ 麦克风权限正常');
    });
    
    // 2. 重新创建录音器（如果SDK已初始化）
    if (window.avatarPlatform2) {
      const recorder = window.avatarPlatform2.createRecorder();
      console.log('✓ 录音器已重新创建');
      return true;
    } else {
      console.log('❌ Avatar SDK未初始化，需要先初始化SDK');
      return false;
    }
  } catch (e) {
    console.error('✗ 录音器修复失败:', e);
    return false;
  }
}

// 测试录音功能
async function testRecording() {
  console.log('=== 开始录音测试 ===');
  
  if (!window.avatarPlatform2 || !window.avatarPlatform2.recorder) {
    console.log('❌ 录音器未初始化，请先运行 fixRecorder()');
    return;
  }
  
  try {
    console.log('开始5秒录音测试...');
    
    // 监听ASR事件
    const originalAsrHandler = window.avatarPlatform2.events.asr;
    window.avatarPlatform2.on('asr', function(data) {
      console.log('🎤 收到语音识别结果:', data);
    });
    
    // 开始录音
    window.avatarPlatform2.recorder.startRecord(0, () => {
      console.log('录音测试完成');
    });
    
    // 5秒后自动停止
    setTimeout(() => {
      window.avatarPlatform2.recorder.stopRecord();
      console.log('录音测试已停止，请查看是否有语音识别结果');
    }, 5000);
    
  } catch (e) {
    console.error('录音测试失败:', e);
  }
}

// 监听设备变化
function monitorDeviceChanges() {
  if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
    navigator.mediaDevices.addEventListener('devicechange', async function() {
      console.log('🔄 检测到音频设备变化');
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      console.log('当前可用音频输入设备:', audioInputs.length);
      
      // 如果录音器正在工作，建议重新初始化
      if (window.avatarPlatform2 && window.avatarPlatform2.recorder) {
        console.log('💡 建议：设备发生变化，可能需要重新创建录音器');
        console.log('   运行 fixRecorder() 来修复');
      }
    });
    console.log('✓ 已开启音频设备变化监听');
  }
}

// 导出到全局作用域供控制台使用
window.diagnoseRecorder = diagnoseRecorder;
window.fixRecorder = fixRecorder;
window.testRecording = testRecording;
window.monitorDeviceChanges = monitorDeviceChanges;

// 自动开始诊断（仅在开发环境）
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 录音诊断工具已加载，可用命令：');
  console.log('   - diagnoseRecorder() : 诊断录音问题');
  console.log('   - fixRecorder() : 修复录音器');
  console.log('   - testRecording() : 测试录音功能');
  console.log('   - monitorDeviceChanges() : 监听设备变化');
} 