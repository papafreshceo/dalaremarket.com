'use client';

import { useState } from 'react';
import { Shield, Lock, Key, AlertTriangle, CheckCircle, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SecurityPage() {
  const [settings, setSettings] = useState({
    // 비밀번호 정책
    minPasswordLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    passwordExpireDays: 90,

    // 로그인 보안
    maxLoginAttempts: 5,
    lockoutDuration: 30,
    sessionTimeout: 60,
    requireTwoFactor: false,

    // IP 화이트리스트
    ipWhitelistEnabled: false,
    allowedIPs: [''],

    // 보안 로그
    logLoginAttempts: true,
    logFailedLogins: true,
    logPasswordChanges: true,
    logPermissionChanges: true,
  });

  const [newIP, setNewIP] = useState('');

  const handleToggle = (key: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };

  const handleNumberChange = (key: string, value: number) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleAddIP = () => {
    if (newIP && /^(\d{1,3}\.){3}\d{1,3}$/.test(newIP)) {
      setSettings(prev => ({
        ...prev,
        allowedIPs: [...prev.allowedIPs, newIP]
      }));
      setNewIP('');
      toast.success('IP 주소가 추가되었습니다.');
    } else {
      toast.error('올바른 IP 주소 형식이 아닙니다.');
    }
  };

  const handleRemoveIP = (index: number) => {
    setSettings(prev => ({
      ...prev,
      allowedIPs: prev.allowedIPs.filter((_, i) => i !== index)
    }));
    toast.success('IP 주소가 제거되었습니다.');
  };

  const handleSave = () => {
    toast.success('보안 설정이 저장되었습니다.');
    console.log('Saved settings:', settings);
  };

  const ToggleSwitch = ({ value, onChange }: any) => (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        value ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          value ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-text">보안 설정</h1>
        </div>
        <p className="text-text-secondary">시스템 보안 정책 및 인증 방법을 설정합니다</p>
      </div>

      {/* 설정 섹션들 */}
      <div className="space-y-6">
        {/* 비밀번호 정책 */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-bold text-text">비밀번호 정책</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <h4 className="text-sm font-semibold text-text mb-1">최소 길이</h4>
                <p className="text-xs text-text-secondary">비밀번호 최소 길이를 설정합니다</p>
              </div>
              <input
                type="number"
                min="6"
                max="32"
                value={settings.minPasswordLength}
                onChange={(e) => handleNumberChange('minPasswordLength', parseInt(e.target.value))}
                className="w-20 px-3 py-2 border border-border rounded-lg bg-background text-text text-center"
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <h4 className="text-sm font-semibold text-text mb-1">대문자 필수</h4>
                <p className="text-xs text-text-secondary">최소 1개의 대문자 포함</p>
              </div>
              <ToggleSwitch
                value={settings.requireUppercase}
                onChange={() => handleToggle('requireUppercase')}
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <h4 className="text-sm font-semibold text-text mb-1">소문자 필수</h4>
                <p className="text-xs text-text-secondary">최소 1개의 소문자 포함</p>
              </div>
              <ToggleSwitch
                value={settings.requireLowercase}
                onChange={() => handleToggle('requireLowercase')}
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <h4 className="text-sm font-semibold text-text mb-1">숫자 필수</h4>
                <p className="text-xs text-text-secondary">최소 1개의 숫자 포함</p>
              </div>
              <ToggleSwitch
                value={settings.requireNumbers}
                onChange={() => handleToggle('requireNumbers')}
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <h4 className="text-sm font-semibold text-text mb-1">특수문자 필수</h4>
                <p className="text-xs text-text-secondary">최소 1개의 특수문자 포함</p>
              </div>
              <ToggleSwitch
                value={settings.requireSpecialChars}
                onChange={() => handleToggle('requireSpecialChars')}
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <h4 className="text-sm font-semibold text-text mb-1">비밀번호 만료 기간</h4>
                <p className="text-xs text-text-secondary">비밀번호 변경 주기 (일)</p>
              </div>
              <input
                type="number"
                min="0"
                max="365"
                value={settings.passwordExpireDays}
                onChange={(e) => handleNumberChange('passwordExpireDays', parseInt(e.target.value))}
                className="w-20 px-3 py-2 border border-border rounded-lg bg-background text-text text-center"
              />
            </div>
          </div>
        </div>

        {/* 로그인 보안 */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Key className="w-5 h-5 text-purple-500" />
            <h2 className="text-xl font-bold text-text">로그인 보안</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <h4 className="text-sm font-semibold text-text mb-1">최대 로그인 시도 횟수</h4>
                <p className="text-xs text-text-secondary">초과 시 계정 잠금</p>
              </div>
              <input
                type="number"
                min="3"
                max="10"
                value={settings.maxLoginAttempts}
                onChange={(e) => handleNumberChange('maxLoginAttempts', parseInt(e.target.value))}
                className="w-20 px-3 py-2 border border-border rounded-lg bg-background text-text text-center"
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <h4 className="text-sm font-semibold text-text mb-1">잠금 해제 시간</h4>
                <p className="text-xs text-text-secondary">계정 잠금 후 자동 해제 시간 (분)</p>
              </div>
              <input
                type="number"
                min="10"
                max="120"
                value={settings.lockoutDuration}
                onChange={(e) => handleNumberChange('lockoutDuration', parseInt(e.target.value))}
                className="w-20 px-3 py-2 border border-border rounded-lg bg-background text-text text-center"
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <h4 className="text-sm font-semibold text-text mb-1">세션 타임아웃</h4>
                <p className="text-xs text-text-secondary">비활동 시 자동 로그아웃 (분)</p>
              </div>
              <input
                type="number"
                min="15"
                max="480"
                value={settings.sessionTimeout}
                onChange={(e) => handleNumberChange('sessionTimeout', parseInt(e.target.value))}
                className="w-20 px-3 py-2 border border-border rounded-lg bg-background text-text text-center"
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <h4 className="text-sm font-semibold text-text mb-1">2단계 인증 필수</h4>
                <p className="text-xs text-text-secondary">모든 사용자에게 2FA 강제</p>
              </div>
              <ToggleSwitch
                value={settings.requireTwoFactor}
                onChange={() => handleToggle('requireTwoFactor')}
              />
            </div>
          </div>
        </div>

        {/* IP 화이트리스트 */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-bold text-text">IP 화이트리스트</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <h4 className="text-sm font-semibold text-text mb-1">화이트리스트 활성화</h4>
                <p className="text-xs text-text-secondary">허용된 IP에서만 접근 가능</p>
              </div>
              <ToggleSwitch
                value={settings.ipWhitelistEnabled}
                onChange={() => handleToggle('ipWhitelistEnabled')}
              />
            </div>

            {settings.ipWhitelistEnabled && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newIP}
                    onChange={(e) => setNewIP(e.target.value)}
                    placeholder="예: 192.168.0.1"
                    className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-text"
                  />
                  <button
                    onClick={handleAddIP}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
                  >
                    추가
                  </button>
                </div>

                <div className="space-y-2">
                  {settings.allowedIPs.filter(ip => ip).map((ip, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-3 bg-background rounded-lg"
                    >
                      <span className="text-sm text-text font-mono">{ip}</span>
                      <button
                        onClick={() => handleRemoveIP(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        제거
                      </button>
                    </div>
                  ))}
                  {settings.allowedIPs.filter(ip => ip).length === 0 && (
                    <p className="text-sm text-text-tertiary text-center py-4">
                      등록된 IP 주소가 없습니다
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 보안 로그 */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h2 className="text-xl font-bold text-text">보안 로그</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <h4 className="text-sm font-semibold text-text mb-1">로그인 시도 기록</h4>
                <p className="text-xs text-text-secondary">모든 로그인 시도를 기록합니다</p>
              </div>
              <ToggleSwitch
                value={settings.logLoginAttempts}
                onChange={() => handleToggle('logLoginAttempts')}
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <h4 className="text-sm font-semibold text-text mb-1">실패한 로그인 기록</h4>
                <p className="text-xs text-text-secondary">실패한 로그인 시도를 별도 기록합니다</p>
              </div>
              <ToggleSwitch
                value={settings.logFailedLogins}
                onChange={() => handleToggle('logFailedLogins')}
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <h4 className="text-sm font-semibold text-text mb-1">비밀번호 변경 기록</h4>
                <p className="text-xs text-text-secondary">비밀번호 변경 이력을 기록합니다</p>
              </div>
              <ToggleSwitch
                value={settings.logPasswordChanges}
                onChange={() => handleToggle('logPasswordChanges')}
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <h4 className="text-sm font-semibold text-text mb-1">권한 변경 기록</h4>
                <p className="text-xs text-text-secondary">사용자 권한 변경을 기록합니다</p>
              </div>
              <ToggleSwitch
                value={settings.logPermissionChanges}
                onChange={() => handleToggle('logPermissionChanges')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 저장 버튼 */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
        >
          <Save className="w-5 h-5" />
          설정 저장
        </button>
      </div>
    </div>
  );
}
