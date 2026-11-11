using System.Net;
using System.Net.Sockets;
using Google.Apis.Http;

namespace YLWorks.Services.Leave
{
    /// <summary>
    /// Forces IPv4 for Google API HTTP calls. Some Windows Server hosts hang for ~100s
    /// when .NET tries IPv6 first (same class of issue as Cloudflare API without curl -4).
    /// </summary>
    public sealed class GoogleIpv4HttpClientFactory : Google.Apis.Http.HttpClientFactory
    {
        protected override HttpMessageHandler CreateHandler(CreateHttpClientArgs args)
        {
            return new SocketsHttpHandler
            {
                PooledConnectionLifetime = TimeSpan.FromMinutes(15),
                ConnectCallback = async (context, cancellationToken) =>
                {
                    var host = context.DnsEndPoint.Host;
                    var port = context.DnsEndPoint.Port;

                    IPAddress[] ipv4;
                    try
                    {
                        ipv4 = await Dns.GetHostAddressesAsync(
                            host, AddressFamily.InterNetwork, cancellationToken);
                    }
                    catch (SocketException)
                    {
                        ipv4 = [];
                    }

                    if (ipv4.Length == 0)
                    {
                        // Fall back to default dual-stack resolution if host has no A record.
                        var socket = new Socket(SocketType.Stream, ProtocolType.Tcp);
                        try
                        {
                            await socket.ConnectAsync(host, port, cancellationToken);
                            return new NetworkStream(socket, ownsSocket: true);
                        }
                        catch
                        {
                            socket.Dispose();
                            throw;
                        }
                    }

                    Exception? last = null;
                    foreach (var address in ipv4)
                    {
                        var socket = new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp);
                        try
                        {
                            await socket.ConnectAsync(address, port, cancellationToken);
                            return new NetworkStream(socket, ownsSocket: true);
                        }
                        catch (Exception ex)
                        {
                            last = ex;
                            socket.Dispose();
                        }
                    }

                    throw last ?? new InvalidOperationException($"Unable to connect to {host}:{port} over IPv4.");
                }
            };
        }
    }
}
