import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        console.log(`Scanning URL: ${url}`);
        
        // Replace localhost with 127.0.0.1 for server-side fetch
        const fetchUrl = url.replace('localhost', '127.0.0.1');
        
        // Try the URL directly first
        let response = await fetch(fetchUrl);
        let targetUrl = fetchUrl;
        let contentType = response.headers.get('content-type');
        
        // If not JSON and looks like a website, try appending /openapi.json
        if (!contentType?.includes('application/json') && !fetchUrl.endsWith('.json')) {
            const openapiUrl = fetchUrl.endsWith('/') ? `${fetchUrl}openapi.json` : `${fetchUrl}/openapi.json`;
            console.log(`Trying OpenAPI spec at: ${openapiUrl}`);
            
            try {
                const openapiResponse = await fetch(openapiUrl);
                if (openapiResponse.ok && openapiResponse.headers.get('content-type')?.includes('application/json')) {
                    response = openapiResponse;
                    targetUrl = openapiUrl;
                    contentType = openapiResponse.headers.get('content-type');
                    console.log(`Found OpenAPI spec at: ${openapiUrl}`);
                }
            } catch (e) {
                console.log(`No OpenAPI spec found at ${openapiUrl}, using original URL`);
            }
        }
        
        console.log(`Response status: ${response.status}, Content-Type: ${contentType}`);

        const text = await response.text();
        console.log(`Response body length: ${text.length}`);

        let endpoints: { method: string; path: string; description?: string }[] = [];

        if (contentType?.includes('application/json')) {
            console.log('Parsing as JSON');
            try {
                const json = JSON.parse(text);
                // Basic OpenAPI/Swagger parsing
                if (json.paths) {
                    Object.entries(json.paths).forEach(([path, methods]: [string, any]) => {
                        Object.entries(methods).forEach(([method, details]: [string, any]) => {
                            endpoints.push({
                                method: method.toUpperCase(),
                                path,
                                description: details.summary || details.description,
                            });
                        });
                    });
                } else {
                    console.warn('JSON does not contain "paths" property');
                }
            } catch (e) {
                console.error('Failed to parse JSON', e);
            }
        } else {
            console.log('Parsing as HTML');
            // Basic HTML parsing for anchor tags
            // This is a very naive implementation as requested for MVP
            const anchorRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"/gi;
            let match;
            while ((match = anchorRegex.exec(text)) !== null) {
                const href = match[1];
                if (href.startsWith('/') || href.startsWith('http')) {
                    endpoints.push({
                        method: 'GET',
                        path: href,
                        description: 'Scraped link',
                    });
                }
            }
        }

        console.log(`Found ${endpoints.length} endpoints`);

        return NextResponse.json({ endpoints });
    } catch (error: any) {
        console.error('Scan error:', error);
        return NextResponse.json({ error: `Failed to scan URL: ${error.message}` }, { status: 500 });
    }
}
