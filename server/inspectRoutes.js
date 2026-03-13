const app = require('./server');

console.log('app export is', app);

const router = app._router || app.router;
if (!app || !router) {
  console.error('No router found on exported app');
  process.exit(1);
}

console.log('Registered routes:');
router.stack
  .filter((layer) => layer.route)
  .forEach((layer) => {
    const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
    console.log(`${methods} ${layer.route.path}`);
  });

process.exit(0);
