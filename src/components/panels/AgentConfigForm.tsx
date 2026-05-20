'use client';

import { useState } from 'react';
import { useAgentStore } from '@/store/agentStore';
import type { LLMModel } from '@/types';

const MODELS: { value: LLMModel; label: string; icon: string; color: string; desc: string }[] = [
  { value: 'gpt-4o', label: 'GPT-4o', icon: '✦', color: '#00f5ff', desc: '128k · Vision + Audio' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', icon: '◆', color: '#8b5cf6', desc: '128k · Vision' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', icon: '◈', color: '#10b981', desc: '1M · Multimodal' },
  { value: 'claude-opus-4', label: 'Claude Opus 4', icon: '⬡', color: '#ff006e', desc: '200k · Reasoning' },
];

interface AgentConfigFormProps {
  onClose: () => void;
}

export function AgentConfigForm({ onClose }: AgentConfigFormProps) {
  const addAgent = useAgentStore((state) => state.addAgent);

  const [name, setName] = useState('');
  const [model, setModel] = useState<LLMModel>('gpt-4o');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedModel = MODELS.find((m) => m.value === model)!;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Agent name is required';
    if (name.length > 100) errs.name = 'Name must be under 100 characters';
    if (!systemPrompt.trim()) errs.systemPrompt = 'System prompt is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    addAgent({
      name: name.trim(),
      model,
      systemPrompt: systemPrompt.trim(),
      temperature,
      maxTokens,
      status: 'idle',
      config: {},
    });
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    background: '#0a0a0f',
    border: '1px solid rgba(0, 245, 255, 0.12)',
    borderRadius: '10px',
    color: '#e2e8f0',
    fontFamily: "'Inter', sans-serif",
    fontSize: '13px',
    outline: 'none',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10px',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    marginBottom: '6px',
    display: 'block',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '440px',
          maxHeight: '85vh',
          overflow: 'auto',
          background: 'rgba(18, 18, 26, 0.95)',
          border: '1px solid rgba(0, 245, 255, 0.15)',
          borderRadius: '16px',
          padding: '28px',
          boxShadow: '0 0 60px rgba(0, 245, 255, 0.08), 0 24px 48px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '16px',
              fontWeight: 700,
              color: '#e2e8f0',
              letterSpacing: '1px',
            }}
          >
            <span style={{ color: '#00f5ff' }}>+</span> NEW AGENT
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid rgba(0, 245, 255, 0.12)',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Name */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>AGENT NAME</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Research Analyst"
            style={{
              ...inputStyle,
              borderColor: errors.name ? '#ff006e' : 'rgba(0, 245, 255, 0.12)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#00f5ff';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 245, 255, 0.2)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = errors.name ? '#ff006e' : 'rgba(0, 245, 255, 0.12)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          {errors.name && (
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#ff006e', marginTop: '4px' }}>
              ⚠ {errors.name}
            </div>
          )}
        </div>

        {/* Model — Custom Dropdown */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>MODEL</label>
          <div style={{ position: 'relative' }}>
            <div
              onClick={() => setIsModelOpen(!isModelOpen)}
              style={{
                ...inputStyle,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                borderColor: isModelOpen ? '#00f5ff' : 'rgba(0, 245, 255, 0.12)',
                boxShadow: isModelOpen ? '0 0 20px rgba(0, 245, 255, 0.2)' : 'none',
              }}
            >
              <span
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  background: `${selectedModel.color}18`,
                  border: `1px solid ${selectedModel.color}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  color: selectedModel.color,
                }}
              >
                {selectedModel.icon}
              </span>
              <span style={{ flex: 1 }}>{selectedModel.label}</span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '10px',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: `${selectedModel.color}15`,
                  color: selectedModel.color,
                  border: `1px solid ${selectedModel.color}30`,
                }}
              >
                {selectedModel.desc.split(' · ')[0]}
              </span>
              <span
                style={{
                  color: '#94a3b8',
                  transform: isModelOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.3s ease',
                }}
              >
                ▾
              </span>
            </div>

            {/* Dropdown options */}
            {isModelOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  right: 0,
                  background: '#12121a',
                  border: '1px solid rgba(0, 245, 255, 0.2)',
                  borderRadius: '10px',
                  padding: '4px',
                  zIndex: 100,
                  backdropFilter: 'blur(24px)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 245, 255, 0.1)',
                }}
              >
                {MODELS.map((m) => (
                  <div
                    key={m.value}
                    onClick={() => {
                      setModel(m.value);
                      setIsModelOpen(false);
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: model === m.value ? 'rgba(0, 245, 255, 0.1)' : 'transparent',
                      borderLeft: model === m.value ? `3px solid ${m.color}` : '3px solid transparent',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (model !== m.value) e.currentTarget.style.background = 'rgba(0, 245, 255, 0.06)';
                    }}
                    onMouseLeave={(e) => {
                      if (model !== m.value) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: `${m.color}15`,
                        border: `1px solid ${m.color}30`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        color: m.color,
                      }}
                    >
                      {m.icon}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: model === m.value ? m.color : '#e2e8f0' }}>
                        {m.label}
                      </div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#475569' }}>
                        {m.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* System Prompt */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>SYSTEM PROMPT</label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="Describe the agent's role and behavior..."
            rows={4}
            style={{
              ...inputStyle,
              resize: 'vertical',
              minHeight: '80px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
              lineHeight: 1.6,
              borderColor: errors.systemPrompt ? '#ff006e' : 'rgba(0, 245, 255, 0.12)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#00f5ff';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 245, 255, 0.2)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = errors.systemPrompt ? '#ff006e' : 'rgba(0, 245, 255, 0.12)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          {errors.systemPrompt && (
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#ff006e', marginTop: '4px' }}>
              ⚠ {errors.systemPrompt}
            </div>
          )}
        </div>

        {/* Temperature */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>
            TEMPERATURE: <span style={{ color: '#00f5ff' }}>{temperature.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            style={{
              width: '100%',
              accentColor: '#00f5ff',
              height: '4px',
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px',
              color: '#475569',
              marginTop: '4px',
            }}
          >
            <span>Precise (0)</span>
            <span>Creative (2)</span>
          </div>
        </div>

        {/* Max Tokens */}
        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>MAX TOKENS</label>
          <input
            type="number"
            value={maxTokens}
            onChange={(e) => setMaxTokens(parseInt(e.target.value) || 1)}
            min={1}
            max={128000}
            style={inputStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#00f5ff';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 245, 255, 0.2)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 245, 255, 0.12)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleSubmit}
            style={{
              flex: 1,
              padding: '12px',
              background: 'linear-gradient(135deg, #00f5ff, #0099aa)',
              border: 'none',
              borderRadius: '10px',
              color: '#0a0a0f',
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '1px',
              cursor: 'pointer',
            }}
          >
            CREATE AGENT
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '12px 20px',
              background: 'transparent',
              border: '1px solid rgba(0, 245, 255, 0.15)',
              borderRadius: '10px',
              color: '#94a3b8',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}
