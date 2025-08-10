// @ts-nocheck

import ChronosRunner from '../src/index';

async function main() {
 const runner = new ChronosRunner({
  endpoint: process.env.CHRONOS_ENDPOINT || 'http://localhost:3001',
  apiKey: process.env.CHRONOS_API_KEY || 'your-api-key',
  captureConsole: true,
 });

 // Register jobs with schedule + runMode
 await runner['client'].registerJobs([
  {
   id: 'demo-hourly',
   name: 'Demo Hourly Job',
   schedule: '0 * * * *',
   runMode: 'recurring',
  },
  {
   id: 'demo-once',
   name: 'One-time Demo',
   schedule: '',
   runMode: 'once',
   runAt: new Date(Date.now() + 60_000).toISOString(),
  },
 ]);

 // Handlers invoked when the server emits job:trigger
 runner.register('demo-hourly', async () => {
  // your work here
  await new Promise((r) => setTimeout(r, 200));
 });

 runner.register('demo-once', async () => {
  // this will run once based on runAt (or first cron match if schedule provided)
  await new Promise((r) => setTimeout(r, 100));
 });

 runner.start();
 console.log('ChronosRunner started. Waiting for server job:trigger events...');
}

main().catch((err) => {
 console.error(err);
 process.exit(1);
});
