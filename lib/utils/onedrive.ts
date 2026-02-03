import axios from 'axios';

interface OneDriveMetadata {
    originalUrl: string;
    downloadUrl: string;
    embedUrl?: string;
    thumbnail?: string;
    mimeType: string;
    type: 'image' | 'video' | 'audio' | 'other';
    name: string;
}

/**
 * Encodes a sharing URL to base64url format as required by MS Graph
 * @param url The OneDrive sharing URL
 */
function encodeSharingUrl(url: string): string {
    const base64 = Buffer.from(url).toString('base64');
    return 'u!' + base64
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

/**
 * Gets an access token for Microsoft Graph using Client Credentials flow
 */
async function getGraphAccessToken(): Promise<string> {
    const tenantId = process.env.MS_GRAPH_TENANT_ID;
    const clientId = process.env.MS_GRAPH_CLIENT_ID;
    const clientSecret = process.env.MS_GRAPH_CLIENT_SECRET;

    if (!tenantId || !clientId || !clientSecret) {
        throw new Error('OneDrive credentials not configured');
    }

    const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('scope', 'https://graph.microsoft.com/.default');
    params.append('client_secret', clientSecret);
    params.append('grant_type', 'client_credentials');

    const response = await axios.post(url, params);
    return response.data.access_token;
}

/**
 * Resolves a OneDrive shared link into a metadata object
 * @param url Sharing URL
 */
export async function resolveOneDriveLink(url: string): Promise<OneDriveMetadata | undefined> {
    if (!url || (!url.includes('1drv.ms') && !url.includes('sharepoint.com'))) {
        return undefined;
    }

    try {
        const accessToken = await getGraphAccessToken();
        const encodedUrl = encodeSharingUrl(url);
        const graphUrl = `https://graph.microsoft.com/v1.0/shares/${encodedUrl}/driveItem`;

        // Expand thumbnails and request the download URL
        const response = await axios.get(graphUrl + '?$expand=thumbnails', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        const data = response.data;
        const downloadUrl = data['@microsoft.graph.downloadUrl'];
        const mimeType = data.file?.mimeType || 'application/octet-stream';
        
        let type: OneDriveMetadata['type'] = 'other';
        if (mimeType.startsWith('image/')) type = 'image';
        else if (mimeType.startsWith('video/')) type = 'video';
        else if (mimeType.startsWith('audio/')) type = 'audio';

        // Get the best thumbnail (usually 'large' or 'medium')
        const thumbnail = data.thumbnails?.[0]?.large?.url || data.thumbnails?.[0]?.medium?.url;

        return {
            originalUrl: url,
            downloadUrl,
            embedUrl: data.webUrl, // Graph sometimes provides specialized embedUrls but webUrl is safe
            thumbnail,
            mimeType,
            type,
            name: data.name
        };
    } catch (error: any) {
        console.error('Error resolving OneDrive link:', error.response?.data || error.message);
        return undefined;
    }
}
