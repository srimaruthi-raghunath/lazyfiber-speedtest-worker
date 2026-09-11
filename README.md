Cloudflare Worker Speed Test

A lightweight speed-test backend running on Cloudflare Workers.

This Worker provides simple endpoints for measuring:

Download speed
Upload speed
Latency
Jitter
Cloudflare edge/colo information

The Worker is based on the architecture of Cloudflare's classic worker-speedtest-template, modernized to use the current ES Modules Worker format.

Features
Runs on Cloudflare Workers
No server to maintain
No external runtime dependencies
Download endpoint
Upload endpoint
CORS enabled
Cloudflare colo information
Request timing information
Supports up to 100 MB per download request
Works with browser-based speed-test clients
Endpoints
Download
GET /down?bytes=N


Downloads N bytes from the Worker.

Example:

https://YOUR-WORKER.workers.dev/down?bytes=1000000


This requests approximately 1 MB of data.

For 10 MB:

https://YOUR-WORKER.workers.dev/down?bytes=10000000

Upload
POST /up


The client sends data to the Worker.

The Worker reads and discards the request body and returns:

ok


Example using JavaScript:

const data = new Uint8Array(10 * 1024 * 1024);

const response = await fetch(
  "https://YOUR-WORKER.workers.dev/up",
  {
    method: "POST",
    body: data,
    cache: "no-store"
  }
);

console.log(await response.text());

Latency

The Worker can be used for basic latency testing with:

GET /down?bytes=0


Example:

https://YOUR-WORKER.workers.dev/down?bytes=0


A browser can measure the round-trip time using performance.now().

Jitter

Jitter is calculated client-side by performing multiple latency requests and measuring the variation between consecutive results.

For example:

Latency:
18.2 ms
17.9 ms
19.1 ms
18.4 ms
17.8 ms

Average latency:
18.28 ms

Jitter:
0.5 ms


The Worker itself does not calculate jitter. The client performs the measurements.

Response Headers

The download and upload endpoints expose Cloudflare-specific information.

cf-meta-colo

The Cloudflare datacenter/colo handling the request.

Example:

cf-meta-colo: HYD


The value depends on the Cloudflare location handling the request.

cf-meta-request-time

The timestamp recorded when the Worker receives the request.

CORS

The Worker allows cross-origin browser requests:

Access-Control-Allow-Origin: *


The following Cloudflare headers are exposed to browser JavaScript:

cf-meta-colo
cf-meta-request-time

Project Structure

The project is intentionally small:

cloudflare-worker-speedtest/
│
├── index.js
├── package.json
├── wrangler.jsonc
└── README.md

index.js

Contains the complete Cloudflare Worker implementation.

package.json

Contains the Wrangler dependency and deployment scripts.

wrangler.jsonc

Contains the Cloudflare Worker configuration.

Requirements

You need:

A Cloudflare account
A Cloudflare Workers-enabled account
Node.js
npm
Git (optional)
Local Development

Clone the repository:

git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git


Enter the directory:

cd YOUR_REPOSITORY


Install dependencies:

npm install


Login to Cloudflare:

npx wrangler login


Start the local development server:

npm run dev


Wrangler will provide a local URL similar to:

http://localhost:8787


Test the download endpoint:

http://localhost:8787/down?bytes=1000000

Deployment

Deploy the Worker with:

npm run deploy


Or:

npx wrangler deploy


After deployment, Cloudflare will provide a URL similar to:

https://your-worker.your-subdomain.workers.dev

Cloudflare Git Deployment

If the repository is connected to Cloudflare Workers through Git integration, use:

Build command
npm install


You can also leave the build command empty because this project does not require a build step.

Deploy command
npx wrangler deploy

Root directory
/

Build output directory

Leave empty.

Testing
Download test

Open this URL in a browser:

https://YOUR-WORKER.workers.dev/down?bytes=1000000


For 10 MB:

https://YOUR-WORKER.workers.dev/down?bytes=10000000

Upload test

The upload endpoint requires a POST request.

PowerShell:

curl.exe -X POST --data-binary "@test.bin" https://YOUR-WORKER.workers.dev/up


The Worker should respond:

ok

Browser upload test

A browser application can send data using:

await fetch(
  "https://YOUR-WORKER.workers.dev/up",
  {
    method: "POST",
    body: data,
    cache: "no-store"
  }
);

Measuring Download Speed

A client can measure download speed using:

const url =
  "https://YOUR-WORKER.workers.dev/down?bytes=10000000";

const start = performance.now();

const response = await fetch(
  url + "&t=" + Date.now(),
  {
    cache: "no-store"
  }
);

const data = await response.arrayBuffer();

const end = performance.now();

const seconds = (end - start) / 1000;

const megabits =
  (data.byteLength * 8) /
  seconds /
  1000000;

console.log(
  `Download: ${megabits.toFixed(2)} Mbps`
);


For more accurate speed testing, use multiple requests and larger payloads.

Measuring Upload Speed

A client can measure upload speed using:

const data = new Uint8Array(
  10 * 1024 * 1024
);

const start = performance.now();

await fetch(
  "https://YOUR-WORKER.workers.dev/up",
  {
    method: "POST",
    body: data,
    cache: "no-store"
  }
);

const end = performance.now();

const seconds =
  (end - start) / 1000;

const megabits =
  (data.byteLength * 8) /
  seconds /
  1000000;

console.log(
  `Upload: ${megabits.toFixed(2)} Mbps`
);

Measuring Latency

Latency can be measured with a small request:

const start = performance.now();

await fetch(
  "https://YOUR-WORKER.workers.dev/down?bytes=0&t=" +
  Date.now(),
  {
    cache: "no-store"
  }
);

const latency =
  performance.now() - start;

console.log(
  `Latency: ${latency.toFixed(2)} ms`
);


Run the test multiple times and calculate the average.

Measuring Jitter

A simple jitter calculation is the average absolute difference between consecutive latency measurements:

const results = [
  18.2,
  17.9,
  19.1,
  18.4,
  17.8
];

let total = 0;

for (let i = 1; i < results.length; i++) {
  total += Math.abs(
    results[i] - results[i - 1]
  );
}

const jitter =
  total / (results.length - 1);

console.log(
  `Jitter: ${jitter.toFixed(2)} ms`
);

Configuration

Example wrangler.jsonc:

{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "cloudflare-worker-speedtest",
  "main": "index.js",
  "compatibility_date": "2026-09-11"
}

Limits

The Worker currently limits a single download request to:

100 MB


The limit is controlled by:

const MAX_BYTES = 100 * 1000 * 1000;


You can adjust this according to your Cloudflare Workers plan and requirements.

Custom Domain

After deploying the Worker, you can attach your own domain or subdomain through Cloudflare.

For example:

https://speedtest.example.com


Then the endpoints become:

https://speedtest.example.com/down?bytes=10000000


and:

https://speedtest.example.com/up

Important Notes

This project provides the backend endpoints required by a speed-test client.

It does not provide a complete speed-test interface.

A complete speed-test application normally performs:

Latency tests
Multiple download tests
Multiple upload tests
Jitter calculation
Progress calculation
Final Mbps calculation

The Worker is designed to provide the network endpoints used by that client.

License

This project is provided for personal and development use.

Check the original Cloudflare repository and its license before redistributing modified versions of the original source.

:::

You can save that directly as **`README.md`** and push it alongside `index.js`, `package.json`, and `wrangler.jsonc`.
