/**
 * Certificate Generation Service
 * Creates shareable PDF certificates for tutorial completion
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export interface CertificateData {
  userName: string;
  completionDate: Date;
  modulesCompleted: number;
  totalModules: number;
  totalTimeMinutes: number;
  accuracy: number;
  badges: string[];
}

/**
 * Generate certificate HTML content
 */
function generateCertificateHTML(data: CertificateData): string {
  const formattedDate = data.completionDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const badgesList = data.badges.length > 0 
    ? data.badges.join(' • ')
    : 'All Modules Completed';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Georgia', serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    
    .certificate {
      background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
      border: 8px solid #0ea5e9;
      border-radius: 16px;
      padding: 48px;
      max-width: 800px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      position: relative;
      overflow: hidden;
    }
    
    .certificate::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 8px;
      background: linear-gradient(90deg, #0ea5e9, #22c55e, #0ea5e9);
    }
    
    .header {
      text-align: center;
      margin-bottom: 32px;
    }
    
    .logo {
      font-size: 48px;
      margin-bottom: 16px;
    }
    
    .title {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 4px;
      color: #64748b;
      margin-bottom: 8px;
    }
    
    .main-title {
      font-size: 36px;
      color: #0f172a;
      font-weight: 700;
      margin-bottom: 8px;
    }
    
    .subtitle {
      font-size: 18px;
      color: #475569;
    }
    
    .recipient {
      text-align: center;
      margin: 40px 0;
    }
    
    .presented-to {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 12px;
    }
    
    .name {
      font-size: 42px;
      color: #0ea5e9;
      font-style: italic;
      font-weight: 700;
      border-bottom: 3px solid #0ea5e9;
      display: inline-block;
      padding: 0 24px 8px;
    }
    
    .achievement {
      text-align: center;
      margin: 32px 0;
    }
    
    .achievement-text {
      font-size: 16px;
      color: #475569;
      line-height: 1.8;
      max-width: 600px;
      margin: 0 auto;
    }
    
    .stats {
      display: flex;
      justify-content: center;
      gap: 48px;
      margin: 40px 0;
      flex-wrap: wrap;
    }
    
    .stat {
      text-align: center;
    }
    
    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: #0ea5e9;
    }
    
    .stat-label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 4px;
    }
    
    .badges {
      text-align: center;
      margin: 32px 0;
      padding: 16px;
      background: #f1f5f9;
      border-radius: 8px;
    }
    
    .badges-title {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    
    .badges-list {
      font-size: 14px;
      color: #475569;
    }
    
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;
    }
    
    .date {
      text-align: left;
    }
    
    .date-label {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 4px;
    }
    
    .date-value {
      font-size: 14px;
      color: #0f172a;
      font-weight: 500;
    }
    
    .signature {
      text-align: right;
    }
    
    .signature-line {
      width: 200px;
      border-bottom: 2px solid #0f172a;
      margin-bottom: 8px;
    }
    
    .signature-name {
      font-size: 14px;
      color: #0f172a;
      font-weight: 500;
    }
    
    .signature-title {
      font-size: 12px;
      color: #64748b;
    }
    
    .watermark {
      position: absolute;
      bottom: 20px;
      right: 20px;
      font-size: 10px;
      color: #cbd5e1;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <div class="logo">🤖📊</div>
      <div class="title">Certificate of Completion</div>
      <div class="main-title">Meta-Analysis Mastery</div>
      <div class="subtitle">Meta Agent Mobile Learning Program</div>
    </div>
    
    <div class="recipient">
      <div class="presented-to">This certificate is proudly presented to</div>
      <div class="name">${escapeHtml(data.userName)}</div>
    </div>
    
    <div class="achievement">
      <p class="achievement-text">
        For successfully completing the Meta Agent Mobile tutorial program,
        demonstrating proficiency in meta-analysis methodology, statistical
        interpretation, and evidence synthesis techniques.
      </p>
    </div>
    
    <div class="stats">
      <div class="stat">
        <div class="stat-value">${data.modulesCompleted}/${data.totalModules}</div>
        <div class="stat-label">Modules Completed</div>
      </div>
      <div class="stat">
        <div class="stat-value">${data.totalTimeMinutes}</div>
        <div class="stat-label">Minutes Invested</div>
      </div>
      <div class="stat">
        <div class="stat-value">${data.accuracy}%</div>
        <div class="stat-label">Quiz Accuracy</div>
      </div>
    </div>
    
    <div class="badges">
      <div class="badges-title">Achievements Earned</div>
      <div class="badges-list">${escapeHtml(badgesList)}</div>
    </div>
    
    <div class="footer">
      <div class="date">
        <div class="date-label">Date of Completion</div>
        <div class="date-value">${formattedDate}</div>
      </div>
      <div class="signature">
        <div class="signature-line"></div>
        <div class="signature-name">Meta Agent</div>
        <div class="signature-title">AI Learning Assistant</div>
      </div>
    </div>
    
    <div class="watermark">Verified by Meta Agent Mobile</div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Certificate Service
 */
class CertificateService {
  private certificatesDir: string;

  constructor() {
    this.certificatesDir = `${FileSystem.documentDirectory}certificates/`;
  }

  /**
   * Initialize certificates directory
   */
  async initialize(): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(this.certificatesDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(this.certificatesDir, { intermediates: true });
    }
  }

  /**
   * Generate and save a certificate
   */
  async generateCertificate(data: CertificateData): Promise<string> {
    await this.initialize();

    const html = generateCertificateHTML(data);
    const timestamp = Date.now();
    const fileName = `certificate_${timestamp}.html`;
    const filePath = `${this.certificatesDir}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, html, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    return filePath;
  }

  /**
   * Share a certificate
   */
  async shareCertificate(filePath: string): Promise<boolean> {
    if (Platform.OS === 'web') {
      // On web, open in new tab
      const content = await FileSystem.readAsStringAsync(filePath);
      const blob = new Blob([content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      return true;
    }

    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      console.warn('Sharing is not available on this device');
      return false;
    }

    await Sharing.shareAsync(filePath, {
      mimeType: 'text/html',
      dialogTitle: 'Share Your Certificate',
      UTI: 'public.html',
    });

    return true;
  }

  /**
   * Get all saved certificates
   */
  async getSavedCertificates(): Promise<string[]> {
    await this.initialize();

    const files = await FileSystem.readDirectoryAsync(this.certificatesDir);
    return files
      .filter((f) => f.endsWith('.html'))
      .map((f) => `${this.certificatesDir}${f}`)
      .sort()
      .reverse();
  }

  /**
   * Delete a certificate
   */
  async deleteCertificate(filePath: string): Promise<void> {
    await FileSystem.deleteAsync(filePath, { idempotent: true });
  }

  /**
   * Get certificate content
   */
  async getCertificateContent(filePath: string): Promise<string> {
    return FileSystem.readAsStringAsync(filePath, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  }
}

export const certificateService = new CertificateService();
