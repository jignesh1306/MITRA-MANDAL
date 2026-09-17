import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'xbpj3lwe',
  api_key: process.env.CLOUDINARY_API_KEY || '323724288686485',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'bjzbCB3-B8BYVHiHKsO7oQD6sjg',
  secure: true
});

export default cloudinary;
