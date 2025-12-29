// ImageKit client configuration
import crypto from 'crypto';

class ImageKitMock {
  constructor(config) {
    this.config = config;
  }

  upload(options) {
    return Promise.resolve({
      url: options.file || '',
      fileId: 'mock-file-id',
      name: options.fileName || 'image'
    });
  }

  getUrl(options) {
    return `${this.config.urlEndpoint}${options.path}`;
  }

  delete(fileId) {
    return Promise.resolve({ success: true });
  }

  getAuthenticationParameters() {
    const defaultExpire = 60 * 60; // 1 hour
    const timestamp = Math.floor(Date.now() / 1000);
    const expire = timestamp + defaultExpire;
    
    // Generate a unique token
    const token = crypto.randomBytes(16).toString('hex');
    
    // Create proper HMAC-SHA1 signature using private key
    const stringToSign = token + expire;
    const signature = crypto
      .createHmac('sha1', this.config.privateKey)
      .update(stringToSign)
      .digest('hex');
    
    return {
      signature,
      expire,
      token
    };
  }
}

const imagekit = new ImageKitMock({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
});

export default imagekit;
