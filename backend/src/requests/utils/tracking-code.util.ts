import * as crypto from 'crypto';

export function generateTrackingCode(PREFIX = 'TRK'): string {

    // Generate a unique tracking code using a combination of timestamp and random bytes
    
    // Convert the current timestamp to a base36 string for compactness and uniqueness
    const timestamp = Date.now().toString(36).toUpperCase(); 

    // Generate a random part using crypto to ensure uniqueness and randomness
    const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();

    // Replace characters that can be easily confused (like 0, O) with 'X' to avoid confusion in tracking codes
    const cleanTimestamp = timestamp.replace(/[0O]/gi, 'X');
    const cleanRandom = randomPart.replace(/[O0]/gi, 'X');

  return `${PREFIX}-${cleanTimestamp}-${cleanRandom}`;
    
}

    console.log('Generated Tracking Code:', generateTrackingCode());