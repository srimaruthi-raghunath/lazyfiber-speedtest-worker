/**
 * Cloudflare Worker — Speed Test
 *
 * Endpoints:
 *
 *   GET  /down?bytes=N
 *   POST /up
 *
 * Example:
 *
 *   /down?bytes=1000000
 *
 * This is a modern ES Modules version of the
 * Cloudflare worker-speedtest-template.
 */

const DEFAULT_NUM_BYTES = 0;
const MAX_BYTES = 100 * 1000 * 1000;


/**
 * Parse query string.
 */
function getQs(url) {
	const sp = url.split('?');

	if (sp.length < 2) {
		return {};
	}

	const qs = sp[1];

	return Object.assign(
		{},
		...qs.split('&').map(s => {
			const parts = s.split('=');

			if (parts.length !== 2) {
				return {};
			}

			return {
				[parts[0]]: parts[1]
			};
		})
	);
}


/**
 * Generate response content.
 *
 * The original speedtest template uses a string
 * containing zeroes as the response body.
 */
function genContent(numBytes = 0) {
	return '0'.repeat(Math.max(0, numBytes));
}


/**
 * Download handler.
 *
 * GET /down?bytes=N
 */
async function downHandler(request) {
	const reqTime = new Date();

	const qs = getQs(request.url);

	const numBytes = Object.prototype.hasOwnProperty.call(qs, 'bytes')
		? Math.min(
			MAX_BYTES,
			Math.abs(Number(qs.bytes))
		)
		: DEFAULT_NUM_BYTES;

	const response = new Response(
		genContent(numBytes)
	);

	response.headers.set(
		'access-control-allow-origin',
		'*'
	);

	response.headers.set(
		'timing-allow-origin',
		'*'
	);

	response.headers.set(
		'cache-control',
		'no-store'
	);

	response.headers.set(
		'content-type',
		'application/octet-stream'
	);

	/*
	 * Cloudflare datacenter/colo.
	 */
	if (request.cf && request.cf.colo) {
		response.headers.set(
			'cf-meta-colo',
			request.cf.colo
		);
	}

	/*
	 * Time when the Worker received the request.
	 */
	response.headers.set(
		'cf-meta-request-time',
		String(+reqTime)
	);

	/*
	 * Allow the browser to read the Cloudflare
	 * metadata headers.
	 */
	response.headers.set(
		'access-control-expose-headers',
		'cf-meta-colo, cf-meta-request-time'
	);

	return response;
}


/**
 * Upload handler.
 *
 * POST /up
 *
 * The request body is received and discarded.
 */
async function upHandler(request) {
	const reqTime = new Date();

	/*
	 * Consume the request body.
	 *
	 * This makes the Worker wait until the upload
	 * body has been received.
	 */
	if (request.body) {
		const reader = request.body.getReader();

		while (true) {
			const { done } = await reader.read();

			if (done) {
				break;
			}
		}
	}

	const response = new Response('ok');

	response.headers.set(
		'access-control-allow-origin',
		'*'
	);

	response.headers.set(
		'timing-allow-origin',
		'*'
	);

	/*
	 * Cloudflare datacenter/colo.
	 */
	if (request.cf && request.cf.colo) {
		response.headers.set(
			'cf-meta-colo',
			request.cf.colo
		);
	}

	/*
	 * Time when the Worker received the request.
	 */
	response.headers.set(
		'cf-meta-request-time',
		String(+reqTime)
	);

	/*
	 * Allow the browser to read the Cloudflare
	 * metadata headers.
	 */
	response.headers.set(
		'access-control-expose-headers',
		'cf-meta-colo, cf-meta-request-time'
	);

	return response;
}


/**
 * Main Cloudflare Worker.
 */
export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);

		/*
		 * Download endpoint.
		 */
		if (
			request.method === 'GET' &&
			url.pathname.endsWith('/down')
		) {
			return downHandler(request);
		}

		/*
		 * Upload endpoint.
		 */
		if (
			request.method === 'POST' &&
			url.pathname.endsWith('/up')
		) {
			return upHandler(request);
		}

		/*
		 * Everything else.
		 */
		return new Response(
			'resource not found',
			{
				status: 404,
				statusText: 'not found',
				headers: {
					'content-type': 'text/plain'
				}
			}
		);
	}
};
