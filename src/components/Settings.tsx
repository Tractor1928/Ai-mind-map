import React, { useState, useEffect } from 'react';
import './Settings.css';

interface SettingsProps {
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const [apiUrl, setApiUrl] = useState('');

  useEffect(() => {
    const savedApiUrl = localStorage.getItem('apiUrl');
    if (savedApiUrl) {
      setApiUrl(savedApiUrl);
    }
  }, []);

  const handleSave = () => {
    // 确保 URL 以 http:// 或 https:// 开头
    let finalUrl = apiUrl.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'http://' + finalUrl;
    }
    // 确保 URL 以 / 结尾
    if (!finalUrl.endsWith('/')) {
      finalUrl += '/';
    }
    localStorage.setItem('apiUrl', finalUrl);
    onClose();
  };

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <h2 className="settings-title">API 设置</h2>
        <div className="settings-content">
          <label className="settings-label">
            API URL
            <div className="settings-description">
              请输入您的 API 服务器地址。例如：http://localhost:3000/
            </div>
          </label>
          <input
            type="text"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="http://localhost:3000/"
            className="settings-input"
          />
          <div className="settings-help">
            注意：API 服务器需要支持以下端点：
            <ul>
              <li>/api/chat - 用于处理对话请求</li>
            </ul>
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
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}; 