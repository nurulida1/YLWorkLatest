export const environment = {
  production: true,
  /** Same-origin API when SPA is served from the .NET/IIS site. */
  ApiBaseUrl: '/api',
  /** Empty = current origin (LAN IP or Cloudflare hostname). */
  RedirectUrl: '',
  AuthServerUrl: '',
  /** Same-origin SignalR hub. */
  HubUrl: '/hubs/notifications',
  AttachmentUrl: '/',
};
