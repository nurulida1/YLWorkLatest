export const environment = {
  production: false,
  /** HTTP for local Angular→API (browser blocks self-signed HTTPS without manual trust). */
  ApiBaseUrl: 'http://localhost:5000/api',
  RedirectUrl: 'http://localhost:4200',
  AttachmentUrl: 'http://localhost:5000/',
  AuthServerUrl: '',
  HubUrl: 'http://localhost:5000/hubs/notifications',
};
