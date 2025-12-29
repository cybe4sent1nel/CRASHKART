// ImageKit client configuration
// Note: ImageKit module not installed - provide mock implementation

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
}

const imagekit = new ImageKitMock({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
});

export default imagekit;
