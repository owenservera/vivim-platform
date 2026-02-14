/**
 * Settings Panel Component
 * Recommendation settings with interactive controls
 */

import { memo } from 'react';
import { loadUserPreferences, updatePreference, type UserPreferences } from '../../lib/recommendation';
import { X, EyeOff } from 'lucide-react';
import '../../pages/ForYou.css';

interface SettingsPanelProps {
  userPrefs: UserPreferences;
  onPrefsChange: (prefs: UserPreferences) => void;
  onResetDismissed: () => void;
}

export const SettingsPanel = memo(function SettingsPanel({
  userPrefs,
  onPrefsChange,
  onResetDismissed
}: SettingsPanelProps) {
  const handlePreferenceToggle = (key: keyof UserPreferences) => {
    // Only toggle boolean properties
    const current = userPrefs[key];
    if (typeof current === 'boolean') {
      updatePreference(key, !current);
      const updated = loadUserPreferences();
      onPrefsChange(updated);
    }
  };

  const handleWeightChange = (key: keyof UserPreferences['rankWeights'], value: number) => {
    const newWeights = { ...userPrefs.rankWeights, [key]: value };
    updatePreference('rankWeights', newWeights);
    const updated = loadUserPreferences();
    onPrefsChange(updated);
  };

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <h3>Recommendation Settings</h3>
        <button
          className="close-btn"
          onClick={() => onPrefsChange(loadUserPreferences())}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="settings-content">
        <div className="setting-group">
          <h4>Content Preferences</h4>
          <label className="setting-item">
            <input
              type="checkbox"
              checked={userPrefs.codeBoost}
              onChange={() => handlePreferenceToggle('codeBoost')}
            />
            <span>Prioritize code-heavy conversations</span>
          </label>
          <label className="setting-item">
            <input
              type="checkbox"
              checked={userPrefs.longFormBoost}
              onChange={() => handlePreferenceToggle('longFormBoost')}
            />
            <span>Prioritize long-form content (1000+ words)</span>
          </label>
          <label className="setting-item">
            <input
              type="checkbox"
              checked={userPrefs.recentBoost}
              onChange={() => handlePreferenceToggle('recentBoost')}
            />
            <span>Prioritize recent conversations</span>
          </label>
        </div>

        <div className="setting-group">
          <h4>Your Preferences</h4>
          <div className="stats-row">
            <span className="stat-item flex items-center gap-2">
              <EyeOff className="w-3.5 h-3.5" />
              {userPrefs.dismissed.length} dismissed
            </span>
            {userPrefs.dismissed.length > 0 && (
              <button
                className="text-btn"
                onClick={onResetDismissed}
              >
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="setting-group">
          <h4>Ranking Weights</h4>
          <div className="weights-display">
            <div className="weight-item">
              <div className="weight-row">
                <span className="weight-label">Quality</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={userPrefs.rankWeights.quality * 100}
                  onChange={(e) => handleWeightChange('quality', parseInt(e.target.value) / 100)}
                  className="weight-slider"
                />
                <span className="weight-value">{Math.round(userPrefs.rankWeights.quality * 100)}%</span>
              </div>
            </div>
            <div className="weight-item">
              <div className="weight-row">
                <span className="weight-label">Recency</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={userPrefs.rankWeights.recency * 100}
                  onChange={(e) => handleWeightChange('recency', parseInt(e.target.value) / 100)}
                  className="weight-slider"
                />
                <span className="weight-value">{Math.round(userPrefs.rankWeights.recency * 100)}%</span>
              </div>
            </div>
            <div className="weight-item">
              <div className="weight-row">
                <span className="weight-label">Topic Match</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={userPrefs.rankWeights.topicMatch * 100}
                  onChange={(e) => handleWeightChange('topicMatch', parseInt(e.target.value) / 100)}
                  className="weight-slider"
                />
                <span className="weight-value">{Math.round(userPrefs.rankWeights.topicMatch * 100)}%</span>
              </div>
            </div>
            <div className="weight-item">
              <div className="weight-row">
                <span className="weight-label">Interaction</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={userPrefs.rankWeights.interaction * 100}
                  onChange={(e) => handleWeightChange('interaction', parseInt(e.target.value) / 100)}
                  className="weight-slider"
                />
                <span className="weight-value">{Math.round(userPrefs.rankWeights.interaction * 100)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});