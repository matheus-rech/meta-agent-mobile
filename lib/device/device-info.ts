/**
 * Device Information Utility
 * 
 * Detects device capabilities including RAM, device model, and iOS version.
 * Used by the onboarding wizard to recommend appropriate AI models.
 */

import { Platform } from 'react-native';
import * as Device from 'expo-device';

/**
 * Device capability tier based on RAM and processing power
 */
export type DeviceTier = 'low' | 'medium' | 'high' | 'premium';

/**
 * Device information interface
 */
export interface DeviceInfo {
  /** Device model name (e.g., "iPhone 15 Pro") */
  modelName: string | null;
  /** Device model ID (e.g., "iPhone16,1") */
  modelId: string | null;
  /** Operating system version */
  osVersion: string | null;
  /** Platform (ios, android, web) */
  platform: string;
  /** Estimated RAM in GB */
  estimatedRamGB: number;
  /** Device capability tier */
  tier: DeviceTier;
  /** Whether the device supports on-device AI */
  supportsOnDeviceAI: boolean;
  /** Maximum recommended model size in GB */
  maxRecommendedModelGB: number;
  /** Whether this is a physical device */
  isPhysicalDevice: boolean;
}

/**
 * iPhone model to RAM mapping (approximate)
 * Based on publicly available specifications
 */
const IPHONE_RAM_MAP: Record<string, number> = {
  // iPhone 15 series (2023)
  'iPhone16,1': 8, // iPhone 15 Pro
  'iPhone16,2': 8, // iPhone 15 Pro Max
  'iPhone15,4': 6, // iPhone 15
  'iPhone15,5': 6, // iPhone 15 Plus
  
  // iPhone 14 series (2022)
  'iPhone15,2': 6, // iPhone 14 Pro
  'iPhone15,3': 6, // iPhone 14 Pro Max
  'iPhone14,7': 6, // iPhone 14
  'iPhone14,8': 6, // iPhone 14 Plus
  
  // iPhone 13 series (2021)
  'iPhone14,2': 6, // iPhone 13 Pro
  'iPhone14,3': 6, // iPhone 13 Pro Max
  'iPhone14,4': 4, // iPhone 13 Mini
  'iPhone14,5': 4, // iPhone 13
  
  // iPhone 12 series (2020)
  'iPhone13,1': 4, // iPhone 12 Mini
  'iPhone13,2': 4, // iPhone 12
  'iPhone13,3': 6, // iPhone 12 Pro
  'iPhone13,4': 6, // iPhone 12 Pro Max
  
  // iPhone 11 series (2019)
  'iPhone12,1': 4, // iPhone 11
  'iPhone12,3': 4, // iPhone 11 Pro
  'iPhone12,5': 4, // iPhone 11 Pro Max
  
  // iPhone SE
  'iPhone14,6': 4, // iPhone SE (3rd gen)
  'iPhone12,8': 3, // iPhone SE (2nd gen)
  
  // Older iPhones
  'iPhone11,2': 4, // iPhone XS
  'iPhone11,4': 4, // iPhone XS Max
  'iPhone11,6': 4, // iPhone XS Max (China)
  'iPhone11,8': 3, // iPhone XR
  'iPhone10,1': 2, // iPhone 8
  'iPhone10,2': 3, // iPhone 8 Plus
  'iPhone10,3': 3, // iPhone X
  'iPhone10,4': 2, // iPhone 8
  'iPhone10,5': 3, // iPhone 8 Plus
  'iPhone10,6': 3, // iPhone X
};

/**
 * iPad model to RAM mapping (approximate)
 */
const IPAD_RAM_MAP: Record<string, number> = {
  // iPad Pro M2/M4
  'iPad14,3': 8,  // iPad Pro 11" (4th gen)
  'iPad14,4': 8,  // iPad Pro 11" (4th gen)
  'iPad14,5': 16, // iPad Pro 12.9" (6th gen)
  'iPad14,6': 16, // iPad Pro 12.9" (6th gen)
  
  // iPad Air
  'iPad13,16': 8, // iPad Air (5th gen)
  'iPad13,17': 8, // iPad Air (5th gen)
  
  // iPad
  'iPad13,18': 4, // iPad (10th gen)
  'iPad13,19': 4, // iPad (10th gen)
  'iPad12,1': 3,  // iPad (9th gen)
  'iPad12,2': 3,  // iPad (9th gen)
};

/**
 * Estimate RAM based on device model
 */
function estimateRAM(modelId: string | null): number {
  if (!modelId) {
    // Default to conservative estimate
    return 4;
  }
  
  // Check iPhone models
  if (modelId in IPHONE_RAM_MAP) {
    return IPHONE_RAM_MAP[modelId];
  }
  
  // Check iPad models
  if (modelId in IPAD_RAM_MAP) {
    return IPAD_RAM_MAP[modelId];
  }
  
  // For unknown models, estimate based on prefix
  if (modelId.startsWith('iPhone16')) return 8;
  if (modelId.startsWith('iPhone15')) return 6;
  if (modelId.startsWith('iPhone14')) return 6;
  if (modelId.startsWith('iPhone13')) return 4;
  if (modelId.startsWith('iPhone12')) return 4;
  if (modelId.startsWith('iPad14')) return 8;
  if (modelId.startsWith('iPad13')) return 4;
  
  // Default conservative estimate
  return 4;
}

/**
 * Determine device tier based on RAM
 */
function getDeviceTier(ramGB: number): DeviceTier {
  if (ramGB >= 8) return 'premium';
  if (ramGB >= 6) return 'high';
  if (ramGB >= 4) return 'medium';
  return 'low';
}

/**
 * Get maximum recommended model size based on RAM
 * Rule of thumb: model should use at most 50-60% of available RAM
 */
function getMaxRecommendedModelSize(ramGB: number): number {
  if (ramGB >= 8) return 4.5; // Can run Mistral 7B
  if (ramGB >= 6) return 2.5; // Can run Phi-3 or Llama 3.2
  if (ramGB >= 4) return 2.0; // Can run Llama 3.2
  return 1.0; // Only Qwen 2.5 1.5B
}

/**
 * Get device information
 */
export async function getDeviceInfo(): Promise<DeviceInfo> {
  const modelName = Device.modelName;
  const modelId = Device.modelId;
  const osVersion = Device.osVersion;
  const isPhysicalDevice = Device.isDevice;
  
  const estimatedRamGB = estimateRAM(modelId);
  const tier = getDeviceTier(estimatedRamGB);
  const maxRecommendedModelGB = getMaxRecommendedModelSize(estimatedRamGB);
  
  // On-device AI requires iOS and physical device
  const supportsOnDeviceAI = Platform.OS === 'ios' && isPhysicalDevice;
  
  return {
    modelName,
    modelId,
    osVersion,
    platform: Platform.OS,
    estimatedRamGB,
    tier,
    supportsOnDeviceAI,
    maxRecommendedModelGB,
    isPhysicalDevice,
  };
}

/**
 * Get a human-readable description of the device tier
 */
export function getTierDescription(tier: DeviceTier): string {
  switch (tier) {
    case 'premium':
      return 'Your device has excellent capabilities and can run all available models, including the most powerful ones.';
    case 'high':
      return 'Your device has great capabilities and can run most models smoothly.';
    case 'medium':
      return 'Your device has good capabilities and can run lightweight to medium models.';
    case 'low':
      return 'Your device has limited RAM. We recommend the smallest, fastest model for the best experience.';
  }
}

/**
 * Get device tier emoji
 */
export function getTierEmoji(tier: DeviceTier): string {
  switch (tier) {
    case 'premium': return '🚀';
    case 'high': return '⚡';
    case 'medium': return '✓';
    case 'low': return '📱';
  }
}
