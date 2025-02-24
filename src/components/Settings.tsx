import React, { useState, useEffect } from 'react';
import './Settings.css';
import { aiService } from '../services/ai';

interface SettingsProps {
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);

  useEffect(() => {
    const savedApiKey = localStorage.getItem('apiKey');
    const savedModel = localStorage.getItem('model');
    if (savedApiKey) setApiKey(savedApiKey);
    if (savedModel) setModel(savedModel);
  }, []);

  const handleSave = async () => {
    localStorage.setItem('apiKey', apiKey.trim());
    localStorage.setItem('model', model.trim());
    
    // 测试连接
    setTesting(true);
    const success = await aiService.testConnection();
    setTestResult(success);
    setTesting(false);

    if (success) {
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <h2 className="settings-title">API 设置</h2>
        <div className="settings-content">
          <div className="settings-field">
            <label className="settings-label">
              API Key
              <div className="settings-description">
                请输入您的 API Key
              </div>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="ARK_API_KEY"
              className="settings-input"
            />
          </div>

          <div className="settings-field">
            <label className="settings-label">
              模型名称
              <div className="settings-description">
                请输入要使用的模型名称
              </div>
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="ep-20250211144523-bvb8x"
              className="settings-input"
            />
          </div>

          {testResult !== null && (
            <div className={`settings-test-result ${testResult ? 'success' : 'error'}`}>
              {testResult ? '连接测试成功' : '连接测试失败'}
            </div>
          )}

          <div className="settings-help">
            注意：请确保填写正确的配置信息
          </div>
        </div>
        <div className="settings-actions">
          <button
            onClick={onClose}
            className="settings-button cancel"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="settings-button save"
            disabled={testing}
          >
            {testing ? '测试中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}; 