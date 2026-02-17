import { EnhancedErrorReport, ErrorSeverity, ErrorCategory } from './error-reporting';
import { ErrorGroup, ErrorTrend } from './error-aggregator';

export type AlertChannel = 'slack' | 'discord' | 'webhook' | 'email' | 'sms';

export interface AlertChannelConfig {
  type: AlertChannel;
  enabled: boolean;
  webhookUrl?: string;
  channel?: string;
  botToken?: string;
  email?: string;
  phone?: string;
  minSeverity?: ErrorSeverity;
}

export interface AlertMessage {
  id: string;
  timestamp: Date;
  channel: AlertChannel;
  errorGroup?: ErrorGroup;
  error?: EnhancedErrorReport;
  trend?: ErrorTrend;
  message: string;
  success: boolean;
  response?: any;
}

export interface AlertRule {
  id: string;
  name: string;
  enabled: boolean;
  conditions: {
    severity?: ErrorSeverity[];
    category?: ErrorCategory[];
    component?: string[];
    messageContains?: string[];
    threshold?: number;
    timeWindowMs?: number;
  };
  actions: {
    channels: AlertChannel[];
    messageTemplate?: string;
    rateLimitMs?: number;
  };
}

export class ErrorAlerter {
  private static instance: ErrorAlerter;
  private channels: Map<AlertChannel, AlertChannelConfig> = new Map();
  private rules: Map<string, AlertRule> = new Map();
  private alertHistory: AlertMessage[] = [];
  private lastAlertTimes: Map<string, number> = new Map();
  private maxHistory: number = 1000;

  private constructor() {
    this.setupDefaultChannels();
  }

  static getInstance(): ErrorAlerter {
    if (!ErrorAlerter.instance) {
      ErrorAlerter.instance = new ErrorAlerter();
    }
    return ErrorAlerter.instance;
  }

  private setupDefaultChannels(): void {
    this.channels.set('webhook', {
      type: 'webhook',
      enabled: false
    });
    this.channels.set('slack', {
      type: 'slack',
      enabled: false
    });
    this.channels.set('discord', {
      type: 'discord',
      enabled: false
    });
    this.channels.set('email', {
      type: 'email',
      enabled: false
    });
    this.channels.set('sms', {
      type: 'sms',
      enabled: false
    });
  }

  configureChannel(config: AlertChannelConfig): void {
    this.channels.set(config.type, config);
  }

  getChannelConfig(channel: AlertChannel): AlertChannelConfig | undefined {
    return this.channels.get(channel);
  }

  addRule(rule: Omit<AlertRule, 'id'>): AlertRule {
    const newRule: AlertRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    this.rules.set(newRule.id, newRule);
    return newRule;
  }

  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  getRule(ruleId: string): AlertRule | undefined {
    return this.rules.get(ruleId);
  }

  getAllRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  async alertError(error: EnhancedErrorReport): Promise<AlertMessage[]> {
    const messages: AlertMessage[] = [];
    const applicableRules = this.getApplicableRules(error);

    for (const rule of applicableRules) {
      const rateLimitKey = `${rule.id}_${error.fingerprint}`;
      const lastAlert = this.lastAlertTimes.get(rateLimitKey) || 0;
      
      if (rule.actions.rateLimitMs && Date.now() - lastAlert < rule.actions.rateLimitMs) {
        continue;
      }

      for (const channel of rule.actions.channels) {
        const channelConfig = this.channels.get(channel);
        if (!channelConfig?.enabled) continue;

        const message = await this.sendAlert(channel, error, rule);
        messages.push(message);
        
        if (message.success) {
          this.lastAlertTimes.set(rateLimitKey, Date.now());
        }
      }
    }

    this.alertHistory.push(...messages);
    if (this.alertHistory.length > this.maxHistory) {
      this.alertHistory = this.alertHistory.slice(-this.maxHistory);
    }

    return messages;
  }

  async alertErrorGroup(group: ErrorGroup): Promise<AlertMessage[]> {
    const messages: AlertMessage[] = [];

    for (const [channel, config] of this.channels) {
      if (!config.enabled) continue;
      if (config.minSeverity && this.compareSeverity(group.severity, config.minSeverity) < 0) continue;

      const message = await this.sendGroupAlert(channel, group);
      messages.push(message);
    }

    this.alertHistory.push(...messages);
    return messages;
  }

  async alertTrend(trend: ErrorTrend): Promise<AlertMessage[]> {
    if (trend.trend !== 'increasing') return [];

    const messages: AlertMessage[] = [];

    for (const [channel, config] of this.channels) {
      if (!config.enabled) continue;

      const message = await this.sendTrendAlert(channel, trend);
      messages.push(message);
    }

    this.alertHistory.push(...messages);
    return messages;
  }

  private async sendAlert(channel: AlertChannel, error: EnhancedErrorReport, rule: AlertRule): Promise<AlertMessage> {
    const channelConfig = this.channels.get(channel);
    
    const payload = this.buildAlertPayload(error, rule.actions.messageTemplate);
    
    let success = false;
    let response: any;

    try {
      switch (channel) {
        case 'webhook':
        case 'discord':
          if (channelConfig?.webhookUrl) {
            response = await fetch(channelConfig.webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            success = response.ok;
          }
          break;
        case 'slack':
          if (channelConfig?.webhookUrl) {
            response = await fetch(channelConfig.webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: payload.text,
                blocks: payload.blocks
              })
            });
            success = response.ok;
          }
          break;
        case 'email':
          success = await this.sendEmail(channelConfig!, payload);
          break;
        case 'sms':
          success = await this.sendSMS(channelConfig!, payload);
          break;
      }
    } catch (e) {
      console.error(`Failed to send alert to ${channel}:`, e);
    }

    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      channel,
      error,
      message: payload.text,
      success,
      response
    };
  }

  private async sendGroupAlert(channel: AlertChannel, group: ErrorGroup): Promise<AlertMessage> {
    const channelConfig = this.channels.get(channel);
    
    const payload = {
      text: `🚨 Error Alert: ${group.message} occurred ${group.count} times`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `🚨 Error Alert: ${group.category}`
          }
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Message:*\n${group.message.substring(0, 100)}` },
            { type: 'mrkdwn', text: `*Occurrences:*\n${group.count}` },
            { type: 'mrkdwn', text: `*Severity:*\n${group.severity}` },
            { type: 'mrkdwn', text: `*Component:*\n${group.component}` }
          ]
        }
      ]
    };

    let success = false;
    try {
      if (channelConfig?.webhookUrl) {
        const response = await fetch(channelConfig.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        success = response.ok;
      }
    } catch (e) {
      console.error('Failed to send group alert:', e);
    }

    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      channel,
      errorGroup: group,
      message: payload.text,
      success
    };
  }

  private async sendTrendAlert(channel: AlertChannel, trend: ErrorTrend): Promise<AlertMessage> {
    const channelConfig = this.channels.get(channel);
    
    const payload = {
      text: `📈 Error Trend: ${trend.message} increased by ${trend.growthRate.toFixed(1)}%`
    };

    let success = false;
    try {
      if (channelConfig?.webhookUrl) {
        const response = await fetch(channelConfig.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        success = response.ok;
      }
    } catch (e) {
      console.error('Failed to send trend alert:', e);
    }

    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      channel,
      trend,
      message: payload.text,
      success
    };
  }

  private buildAlertPayload(error: EnhancedErrorReport, template?: string): any {
    const emoji = this.getSeverityEmoji(error.severity);
    
    if (template) {
      return {
        text: template
          .replace('{severity}', error.severity)
          .replace('{category}', error.category)
          .replace('{message}', error.message)
          .replace('{component}', error.component)
      };
    }

    return {
      text: `${emoji} ${error.severity.toUpperCase()}: ${error.message}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${emoji} ${error.category}`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Message:*\n${error.message}`
          }
        },
        {
          type: 'context',
          elements: [
            { type: 'mrkdwn', text: `*Severity:* ${error.severity}` },
            { type: 'mrkdwn', text: `*Component:* ${error.component}` },
            { type: 'mrkdwn', text: `*Time:* ${error.timestamp}` }
          ]
        }
      ]
    };
  }

  private getSeverityEmoji(severity: ErrorSeverity): string {
    const emojis: Record<ErrorSeverity, string> = {
      fatal: '💀',
      critical: '🚨',
      high: '⚠️',
      medium: '⚡',
      low: 'ℹ️'
    };
    return emojis[severity] || 'ℹ️';
  }

  private async sendEmail(config: AlertChannelConfig, payload: any): Promise<boolean> {
    console.log(`[Email Alert] Would send to ${config.email}: ${payload.text}`);
    return true;
  }

  private async sendSMS(config: AlertChannelConfig, payload: any): Promise<boolean> {
    console.log(`[SMS Alert] Would send to ${config.phone}: ${payload.text}`);
    return true;
  }

  private getApplicableRules(error: EnhancedErrorReport): AlertRule[] {
    return Array.from(this.rules.values()).filter(rule => {
      if (!rule.enabled) return false;
      if (rule.conditions.severity && !rule.conditions.severity.includes(error.severity)) return false;
      if (rule.conditions.category && !rule.conditions.category.includes(error.category)) return false;
      if (rule.conditions.component && !rule.conditions.component.includes(error.component)) return false;
      if (rule.conditions.messageContains) {
        const matches = rule.conditions.messageContains.some(substr => 
          error.message.toLowerCase().includes(substr.toLowerCase())
        );
        if (!matches) return false;
      }
      return true;
    });
  }

  private compareSeverity(a: ErrorSeverity, b: ErrorSeverity): number {
    const order: ErrorSeverity[] = ['fatal', 'critical', 'high', 'medium', 'low'];
    return order.indexOf(a) - order.indexOf(b);
  }

  getAlertHistory(channel?: AlertChannel, limit?: number): AlertMessage[] {
    let history = this.alertHistory;
    if (channel) {
      history = history.filter(m => m.channel === channel);
    }
    return history.slice(-(limit || 100));
  }

  clearAlertHistory(): void {
    this.alertHistory = [];
  }
}

export const errorAlerter = ErrorAlerter.getInstance();
