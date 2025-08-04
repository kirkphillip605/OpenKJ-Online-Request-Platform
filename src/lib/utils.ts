import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function convertNumbersToWords(str: string): string {
  const numberWords: { [key: string]: string } = {
    '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
    '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine',
    '10': 'ten', '11': 'eleven', '12': 'twelve', '13': 'thirteen',
    '14': 'fourteen', '15': 'fifteen', '16': 'sixteen', '17': 'seventeen',
    '18': 'eighteen', '19': 'nineteen', '20': 'twenty'
  }

  return str.split(' ').map(token => {
    if (/^\d+$/.test(token) && numberWords[token]) {
      return numberWords[token]
    }
    return token
  }).join(' ')
}

export function createNormalizedCombined(artist: string, title: string): string {
  const combined = `${artist} - ${title}`
  let normalized = normalizeString(combined)
  
  // Handle artist, title format
  if (normalized.includes(',')) {
    const parts = normalized.split(',').map(s => s.trim())
    if (parts.length === 2) {
      normalized = `${parts[1]} ${parts[0]}`
    }
  }
  
  return convertNumbersToWords(normalized)
}